import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { Loading, PageMessage } from "../components/Common.jsx";

export default function TodayPage() {
  const { category } = useParams();
  const { user, setNotice } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [liking, setLiking] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setData(null);
    setError("");
    api(`/feeds/${encodeURIComponent(category)}`)
      .then(setData)
      .catch(reason => setError(reason.message));
  }, [category]);

  async function toggleLike() {
    if (!user) return navigate("/user/login");
    if (liking) return;
    const previousData=data;
    const nextIsLiked=!data.isLiked;
    setLiking(true);
    setData(current=>({
      ...current,
      isLiked:nextIsLiked,
      feed:{...current.feed,likes:current.feed.likes+(nextIsLiked?1:-1)},
    }));
    try {
      const result = await api(`/feed/${data.feed.id}/like`, { method: "POST" });
      setData(current => ({ ...current, isLiked: result.isLiked, feed: { ...current.feed, likes: result.likes } }));
    } catch (reason) {
      setData(previousData);
      setNotice({ type: "danger", text: reason.message });
    } finally {
      setLiking(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!user) return navigate("/user/login");
    const normalizedComment=comment.trim();
    if(!normalizedComment) return;
    setBusy(true);
    try {
      const result=await api(`/feed/${data.feed.id}/reviews`, { method: "POST", body: { review: { comment:normalizedComment } } });
      setData(current=>({
        ...current,
        feed:{...current.feed,reviews:[...current.feed.reviews,result.review]},
      }));
      setComment("");
      setNotice({ type: "success", text: "Comment added." });
    } catch (reason) {
      setNotice({ type: "danger", text: reason.message });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <PageMessage title="No post today" text={error} />;
  if (!data) return <Loading />;
  const { feed } = data;

  return (
    <section className="today-feed px-4">
      <h1 className="card-title">{feed.title}</h1>
      <img src={feed.image.url} className="today-feed-image" alt={feed.title} />
      <div className="today-feed-content">
        <p className="card-text">{feed.description}</p>
        <Link to={`/feed/${feed.id}`}>Read more</Link>
        <div className="my-3">
          <button className="btn border-0 bg-transparent" type="button" onClick={toggleLike} disabled={liking} aria-pressed={data.isLiked} aria-label={data.isLiked ? "Unlike post" : "Like post"}>
            <i className={data.isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
            <br />{feed.likes}
          </button>
        </div>
        <h4>Comment</h4>
        <form onSubmit={addComment}>
          <input className="form-control" value={comment} onChange={event => setComment(event.target.value)} disabled={busy} required placeholder="Add a comment" />
          <button id="comment" className="btn custom-btn mt-2" disabled={busy || !comment.trim()}>{busy ? "Posting..." : "Comment"}</button>
        </form>
        {feed.reviews.length > 0 && (
          <div className="today-comments mt-3" aria-live="polite">
            <h5>{feed.reviews.length} {feed.reviews.length === 1 ? "comment" : "comments"}</h5>
            {feed.reviews.slice(-3).map(review => (
              <p className="mb-2" key={review.id}>
                <strong>{review.author?.username || "Former user"}:</strong> {review.comment}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
