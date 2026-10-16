import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { PageMessage, PostGrid, Loading } from "../components/Common.jsx";

export function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/user/profile").then(setProfile).catch(reason => setError(reason.message));
  }, []);

  if (error) return <PageMessage title="Profile unavailable" text={error} />;
  if (!profile) return <Loading />;
  const { user, createdPosts, likedPosts, totalLikesReceived } = profile;
  const progress = user.highestStreak > 0 ? Math.min(100, (user.currentStreak / user.highestStreak) * 100) : 0;

  return (
    <div className="container-fluid py-1 px-4">
      <div className="row align-items-center mb-4">
        <div className="col-lg-2 col-md-3 col-12 text-center"><img src={user.profileImage?.url || "/images/default.png"} className="profile-img" alt={`${user.username}'s profile`} /></div>
        <div className="col-lg-3 col-md-4 col-12 text-center text-md-start mt-md-0"><h2>{user.username}</h2><p>{user.email}</p></div>
        <div className="col-lg-7 col-md-5 col-12 mt-3 mt-md-0">
          <div className="card p-3">
            <h4>Streak Progress</h4>
            <div className="d-flex justify-content-between"><span>Current: {user.currentStreak} days</span><span>Record: {user.highestStreak} days</span></div>
            <div className="progress mt-3" style={{ height: 25 }}><div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" style={{ width: `${progress}%` }}>{user.currentStreak} days</div></div>
          </div>
        </div>
      </div>
      <div className="row col-8 mt-4"><div className="col-md-3"><h5>Total Posts: {createdPosts.length}</h5></div><div className="col-md-5"><h5>Total Likes Received: {totalLikesReceived}</h5></div></div>
      <Link to="/user/profile/edit" className="btn profile-btn custom-btn" id="profile-edit">Edit your profile</Link>
      <hr />
      <PostGrid title="Created Posts" posts={createdPosts} />
      <hr />
      <PostGrid title="Liked Posts" posts={likedPosts} />
    </div>
  );
}

export function ProfileEditor() {
  const { user, setUser, setNotice } = useSession();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api(`/user/${user.id}`, { method: "PUT", body: new FormData(event.currentTarget) });
      setUser(result.user);
      setNotice({ type: "success", text: result.message });
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
          <h2>Edit your Profile</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit} encType="multipart/form-data">
            <div className="mb-3"><label htmlFor="username" className="form-label">Username</label><input id="username" name="username" className="form-control" defaultValue={user.username} required /></div>
            <div className="mb-3"><h4>Current uploaded image</h4><img className="current-feed-img" src={user.profileImage?.url || "/images/default.png"} alt="Current profile" /></div>
            <div className="mb-3"><label htmlFor="profileImage" className="form-label">Profile Picture</label><input id="profileImage" type="file" name="profileImage" accept="image/png,image/jpeg" className="form-control" /></div>
            <button className="custom-btn btn" id="save" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
