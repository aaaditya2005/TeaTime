import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

  async function addComment(event) {
    event.preventDefault();
    if (!user) return navigate("/user/login");
    setPosting(true);
    try {
      await api(`/feed/${id}/reviews`, { method: "POST", body: { review: { comment } } });
      setComment("");
      setNotice({ type: "success", text: "Comment added." });
      await loadFeed();
    } catch (reason) {
      setNotice({ type: "danger", text: reason.message });
    } finally {
      setPosting(false);
    }
  }

  async function deleteReview(reviewId) {
    try {
      await api(`/feed/${id}/reviews/${reviewId}`, { method: "DELETE" });
      await loadFeed();
      setNotice({ type: "success", text: "Comment deleted." });
    } catch (reason) {
      setNotice({ type: "danger", text: reason.message });
    }
  }

  async function deleteFeed() {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await api(`/feed/${id}`, { method: "DELETE" });
      setNotice({ type: "success", text: "Post deleted successfully." });
      navigate("/user/profile");
    } catch (reason) {
      setNotice({ type: "danger", text: reason.message });
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
      <p>Likes: {feed.likes}</p>
      {ownsFeed && (
        <div className="modification-button">
          <Link to={`/feed/${id}/edit`} id="edit" className="btn">Edit</Link>
          <button type="button" id="delete" className="btn" onClick={deleteFeed}>Delete</button>
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
          <input className="form-control" value={comment} onChange={event => setComment(event.target.value)} required placeholder="Add a comment" />
          <button id="comment" className="btn custom-btn mt-2" disabled={posting}>Comment</button>
        </form>
        <div className="row mt-3">
          {feed.reviews.map(review => (
            <div className="col-lg-4 col-md-6 col-12 mb-3" key={review.id}>
              <div className="card h-100">
                <div className="d-flex justify-content-between align-items-center p-2">
                  <div className="card-title"><i className="fa-solid fa-circle-user" /> {review.author?.username || "Former user"}</div>
                  {user?.id === review.authorId && (
                    <button className="btn" type="button" aria-label="Delete comment" onClick={() => deleteReview(review.id)}>
                      <i className="fa-solid fa-trash" style={{ color: "#ff7f2a" }} />
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
