import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { Loading, PageMessage, ShareButton } from "../components/Common.jsx";
import { usePostTranslation } from "../hooks/usePostTranslation.js";

export default function FeedPage() {
  const { id } = useParams();
  const { user, setNotice, language } = useSession();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const { content: translatedFeed, isTranslating, translationFailed } = usePostTranslation(data?.feed, language);
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
      setNotice({ type: "success", text: t("feed.commentAdded") });
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
      setNotice({ type: "success", text: t("feed.commentDeleted") });
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
    if (!window.confirm(t("feed.deleteConfirm"))) return;
    setDeletingPost(true);
    try {
      await api(`/feed/${id}`, { method: "DELETE" });
      setNotice({ type: "success", text: t("feed.postDeleted") });
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
      const result = await api(`/feed/${id}/ask-ai`, { method: "POST", body: { question, preferredLanguage: i18n.language } });
      setAnswer(result.answerHtml);
      setQuestion("");
    } catch (reason) {
      setAnswer(`<p>${escapeHtml(reason.message)}</p>`);
    } finally {
      setAsking(false);
    }
  }

  if (error) return <PageMessage title={t("feed.unavailable")} text={error} />;
  if (!data) return <Loading />;
  const feed = data.feed;
  const displayedFeed = translatedFeed || feed;
  const ownsFeed = user?.id === feed.ownerId;

  return (
    <div className="container-fluid py-4 px-4">
      <h1>{displayedFeed.title}</h1>
      {feed.owner?.id
        ? <p className="text-muted"><i>{t("feed.postBy")} <Link to={`/users/${encodeURIComponent(feed.owner.id)}`}>{feed.owner.username}</Link></i></p>
        : <p className="text-muted"><i>{t("feed.unknownUser")}</i></p>}
      {isTranslating && <p role="status">{t("feed.translating")}</p>}
      {translationFailed && <p className="text-muted" role="status">{t("feed.translationUnavailable")}</p>}
      <img src={feed.image.url} className="single-feed-img" alt={displayedFeed.title} />
      <h3>{displayedFeed.description}</h3>
      <p className="feed-info">{displayedFeed.info}</p>
      <div className="post-like-control">
        <button className="btn border-0 bg-transparent" type="button" onClick={toggleLike} disabled={liking} aria-pressed={data.isLiked} aria-label={t(data.isLiked ? "feed.unlike" : "feed.likePost")}>
          <i className={data.isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
        </button>
        <span>{feed.likes} {t(feed.likes === 1 ? "feed.like" : "feed.likes")}</span>
      </div>
      <ShareButton url={`/feed/${feed.id}`} title={displayedFeed.title} />
      {ownsFeed && (
        <div className="post-actions">
          <button
            type="button"
            className="post-delete-button"
            title={t("feed.deletePost")}
            aria-label={t("feed.deletePost")}
            onClick={deleteFeed}
            disabled={deletingPost}
          >
            <i className={`fa-solid ${deletingPost ? "fa-spinner fa-spin" : "fa-trash"}`} />
          </button>
        </div>
      )}
      <section className="mt-5">
        <h4>{t("feed.askAiTitle")}</h4>
        <form onSubmit={askAI}>
          <textarea className="form-control" rows="3" value={question} onChange={event => setQuestion(event.target.value)} placeholder={t("feed.askAnything")} required />
          <button className="btn custom-btn mt-3" disabled={asking}>{asking ? t("feed.thinking") : t("feed.askAi")}</button>
        </form>
        {answer && (
          <div className="ai-card mt-4">
            <strong>{t("feed.aiName")}</strong><hr />
            <div className="ai-answer" dangerouslySetInnerHTML={{ __html: answer }} />
          </div>
        )}
      </section>
      <hr />
      <section className="comment-section">
        <h4>{feed.reviews.length} {t(feed.reviews.length === 1 ? "feed.commentSingular" : "feed.commentPlural")}</h4>
        <form onSubmit={addComment}>
          <input className="form-control" value={comment} onChange={event => setComment(event.target.value)} disabled={posting} required placeholder={t("feed.addComment")} />
          <button id="comment" className="btn custom-btn mt-2" disabled={posting || !comment.trim()}>{posting ? t("feed.posting") : t("feed.comment")}</button>
        </form>
        <div className="row mt-3">
          {feed.reviews.map(review => (
            <div className="col-lg-4 col-md-6 col-12 mb-3" key={review.id}>
              <div className="card h-100">
                <div className="d-flex justify-content-between align-items-center p-2">
                  {review.author?.username && <div className="card-title"><i className="fa-solid fa-circle-user" /> {review.author.username}</div>}
                  {user?.id === review.authorId && (
                    <button className="btn" type="button" aria-label={t("feed.deleteComment")} onClick={() => deleteReview(review.id)} disabled={deletingReviews.has(review.id)}>
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
