import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { Loading, PageMessage } from "../components/Common.jsx";

export default function FeedPage() {
  const { id } = useParams();
  const { user, setNotice } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [posting, setPosting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [deletingReviews, setDeletingReviews] = useState(() => new Set());
  const navigate = useNavigate();

  async function loadFeed() {
    try {
      setData(await api(`/feed/${id}`));
      setError("");
    } catch (reason) {
      setError(reason.message);
    }
  }

  useEffect(() => {
    setData(null);
    loadFeed();
  }, [id]);

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
      const result=await api(`/feed/${id}/like`,{method:"POST"});
      setData(current=>({...current,isLiked:result.isLiked,feed:{...current.feed,likes:result.likes}}));
    }catch(reason){
      setData(previousData);
      setNotice({type:"danger",text:reason.message});
    }finally{
      setLiking(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!user) return navigate("/user/login");
    const normalizedComment=comment.trim();
    if(!normalizedComment) return;
    setPosting(true);
    try {
      const result=await api(`/feed/${id}/reviews`, { method: "POST", body: { review: { comment:normalizedComment } } });
      setData(current=>({...current,feed:{...current.feed,reviews:[...current.feed.reviews,result.review]}}));
      setComment("");
      setNotice({ type: "success", text: "Comment added." });
    } catch (reason) {
      setNotice({ type: "danger", text: reason.message });
    } finally {
      setPosting(false);
    }
  }

  async function deleteReview(reviewId) {
    if(deletingReviews.has(reviewId)) return;
    setDeletingReviews(current=>new Set(current).add(reviewId));
    try {
      await api(`/feed/${id}/reviews/${reviewId}`, { method: "DELETE" });
      setData(current=>({...current,feed:{...current.feed,reviews:current.feed.reviews.filter(review=>review.id!==reviewId)}}));
      setNotice({ type: "success", text: "Comment deleted." });
    } catch (reason) {
      setNotice({ type: "danger", text: reason.message });
    } finally {
      setDeletingReviews(current=>{
        const next=new Set(current);
        next.delete(reviewId);
        return next;
      });
    }
  }

  async function deleteFeed() {
    if (deletingPost) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setDeletingPost(true);
    try {
      await api(`/feed/${id}`, { method: "DELETE" });
      setNotice({ type: "success", text: "Post deleted successfully." });
      navigate("/user/profile");
    } catch (reason) {
      setNotice({ type: "danger", text: reason.message });
      setDeletingPost(false);
    }
  }

  async function askAI(event) {
    event.preventDefault();
    setAsking(true);
    setAnswer("");
    try {
      const result = await api(`/feed/${id}/ask-ai`, { method: "POST", body: { question } });
      setAnswer(result.answerHtml);
      setQuestion("");
    } catch (reason) {
      setAnswer(`<p>${escapeHtml(reason.message)}</p>`);
    } finally {
      setAsking(false);
    }
  }

  if (error) return <PageMessage title="Post unavailable" text={error} />;
  if (!data) return <Loading />;
  const { feed } = data;
  const ownsFeed = user?.id === feed.ownerId;

  return (
    <div className="container-fluid py-4 px-4">
      <h1>{feed.title}</h1>
      <p className="text-muted"><i>-@{feed.owner?.username || "Former user"}</i></p>
      <img src={feed.image.url} className="single-feed-img" alt={feed.title} />
      <h3>{feed.description}</h3>
      <p className="feed-info">{feed.info}</p>
      <div className="post-like-control">
        <button className="btn border-0 bg-transparent" type="button" onClick={toggleLike} disabled={liking} aria-pressed={data.isLiked} aria-label={data.isLiked ? "Unlike post" : "Like post"}>
          <i className={data.isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
        </button>
        <span>{feed.likes} {feed.likes === 1 ? "Like" : "Likes"}</span>
      </div>
      {ownsFeed && (
        <div className="post-actions">
          <button
            type="button"
            className="post-delete-button"
            title="Delete post"
            aria-label="Delete post"
            onClick={deleteFeed}
            disabled={deletingPost}
          >
            <i className={`fa-solid ${deletingPost ? "fa-spinner fa-spin" : "fa-trash"}`} />
          </button>
        </div>
      )}
      <section className="mt-5">
        <h4>Ask AI about this post</h4>
        <form onSubmit={askAI}>
          <textarea className="form-control" rows="3" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask anything about this post..." required />
          <button className="btn custom-btn mt-3" disabled={asking}>{asking ? "Thinking..." : "Ask AI"}</button>
        </form>
        {answer && (
          <div className="ai-card mt-4">
            <strong>It's TeaTime AI</strong><hr />
            <div className="ai-answer" dangerouslySetInnerHTML={{ __html: answer }} />
          </div>
        )}
      </section>
      <hr />
      <section className="comment-section">
        <h4>{feed.reviews.length} Comments</h4>
        <form onSubmit={addComment}>
          <input className="form-control" value={comment} onChange={event => setComment(event.target.value)} disabled={posting} required placeholder="Add a comment" />
          <button id="comment" className="btn custom-btn mt-2" disabled={posting || !comment.trim()}>{posting ? "Posting..." : "Comment"}</button>
        </form>
        <div className="row mt-3">
          {feed.reviews.map(review => (
            <div className="col-lg-4 col-md-6 col-12 mb-3" key={review.id}>
              <div className="card h-100">
                <div className="d-flex justify-content-between align-items-center p-2">
                  <div className="card-title"><i className="fa-solid fa-circle-user" /> {review.author?.username || "Former user"}</div>
                  {user?.id === review.authorId && (
                    <button className="btn" type="button" aria-label="Delete comment" onClick={() => deleteReview(review.id)} disabled={deletingReviews.has(review.id)}>
                      <i className={`fa-solid ${deletingReviews.has(review.id) ? "fa-spinner fa-spin" : "fa-trash"}`} style={{ color: "#ff7f2a" }} />
                    </button>
                  )}
                </div>
                <div className="card-body"><p className="card-text">{review.comment}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}
