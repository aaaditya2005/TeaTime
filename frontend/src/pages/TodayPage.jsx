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
    try {
      const result = await api(`/feed/${data.feed.id}/like`, { method: "POST" });
      setData(current => ({ ...current, isLiked: result.isLiked, feed: { ...current.feed, likes: result.likes } }));
    } catch (reason) {
      setNotice({ type: "danger", text: reason.message });
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!user) return navigate("/user/login");
    setBusy(true);
    try {
      await api(`/feed/${data.feed.id}/reviews`, { method: "POST", body: { review: { comment } } });
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
          <button className="btn border-0 bg-transparent" type="button" onClick={toggleLike} aria-label={data.isLiked ? "Unlike post" : "Like post"}>
            <i className={data.isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
            <br />{feed.likes}
          </button>
        </div>
        <h4>Comment</h4>
        <form onSubmit={addComment}>
          <input className="form-control" value={comment} onChange={event => setComment(event.target.value)} required placeholder="Add a comment" />
          <button id="comment" className="btn custom-btn mt-2" disabled={busy}>Comment</button>
        </form>
      </div>
    </section>
  );
}
