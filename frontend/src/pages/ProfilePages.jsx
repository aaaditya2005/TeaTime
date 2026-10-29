import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { PageMessage, PostGrid, Loading } from "../components/Common.jsx";

export function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/user/profile").then(setProfile).catch(reason => setError(reason.message));
  }, []);

  if (error) return <PageMessage title={t("profile.unavailable")} text={error} />;
  if (!profile) return <Loading />;
  const { user, createdPosts, likedPosts, totalLikesReceived } = profile;
  const currentPostStreak=user.currentPostStreak??0;
  const highestPostStreak=user.highestPostStreak??0;
  const progress = highestPostStreak > 0 ? Math.min(100, (currentPostStreak / highestPostStreak) * 100) : 0;

  return (
    <div className="container-fluid py-1 px-4">
      <div className="row align-items-center mb-4">
        <div className="col-lg-2 col-md-3 col-12 text-center"><img src={user.profileImage?.url || "/images/default.png"} className="profile-img" alt={t("profile.avatarAlt", { name: user.username })} /></div>
        <div className="col-lg-3 col-md-4 col-12 text-center text-md-start mt-md-0"><h2>{user.username}</h2><p>{user.email}</p></div>
        <div className="col-lg-7 col-md-5 col-12 mt-3 mt-md-0">
          <div className="card p-3">
            <h4>{t("profile.postingStreak")}</h4>
            <div className="d-flex justify-content-between"><span>{t("profile.current", { count: currentPostStreak })}</span><span>{t("profile.record", { count: highestPostStreak })}</span></div>
            <div className="progress mt-3" style={{ height: 25 }}><div className="progress-bar" role="progressbar" aria-label={t("profile.postingStreak")} aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" style={{ width: `${progress}%` }}>{currentPostStreak}</div></div>
          </div>
        </div>
      </div>
      <div className="row col-8 mt-4"><div className="col-md-3"><h5>{t("profile.totalPosts", { count: createdPosts.length })}</h5></div><div className="col-md-5"><h5>{t("profile.totalLikes", { count: totalLikesReceived })}</h5></div></div>
      <Link to="/user/profile/edit" className="btn profile-btn custom-btn" id="profile-edit">{t("profile.edit")}</Link>
      <hr />
      <PostGrid title={t("profile.createdPosts")} posts={createdPosts} />
      <hr />
      <PostGrid title={t("profile.likedPosts")} posts={likedPosts} />
    </div>
  );
}

export function PublicProfilePage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile(null);
    setError("");
    api(`/user/${encodeURIComponent(id)}/public`).then(setProfile).catch(reason => setError(reason.message));
  }, [id]);

  if (error) return <PageMessage title={t("profile.publicUnavailable")} text={error} />;
  if (!profile) return <Loading />;

  return (
    <div className="container-fluid py-3 px-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <img src={profile.user.profileImage?.url || "/images/default.png"} className="profile-img" alt={t("profile.avatarAlt", { name: profile.user.username })} />
        <div>
          <h1 className="h2 mb-1">{profile.user.username}</h1>
          <p className="text-muted mb-0">{t("profile.publicProfile")}</p>
        </div>
      </div>
      <PostGrid title={t("profile.createdPosts")} posts={profile.createdPosts} />
    </div>
  );
}

export function ProfileEditor() {
  const { user, setUser, setNotice } = useSession();
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api(`/user/${user.id}`, { method: "PUT", body: new FormData(event.currentTarget) });
      setUser(result.user);
      setNotice({ type: "success", text: t("profile.updated") });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8 col-12">
          <h2>{t("profile.editTitle")}</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit} encType="multipart/form-data">
            <div className="mb-3"><label htmlFor="username" className="form-label">{t("auth.username")}</label><input id="username" name="username" className="form-control" defaultValue={user.username} minLength={6} required /></div>
            <div className="mb-3"><h4>{t("profile.currentImage")}</h4><img className="current-feed-img" src={user.profileImage?.url || "/images/default.png"} alt={t("profile.currentImage")} /></div>
            <div className="mb-3"><label htmlFor="profileImage" className="form-label">{t("auth.profilePicture")}</label><input id="profileImage" type="file" name="profileImage" accept="image/png,image/jpeg" className="form-control" /></div>
            <button className="custom-btn btn" id="save" disabled={saving}>{saving ? t("profile.saving") : t("profile.save")}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
