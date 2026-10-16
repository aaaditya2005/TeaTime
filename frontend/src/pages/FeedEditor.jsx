import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { categoryOptions } from "../constants/categories.js";
import { useSession } from "../context/SessionContext.jsx";
import { Loading, PageMessage } from "../components/Common.jsx";

export default function FeedEditor({ editing = false }) {
  const { id } = useParams();
  const { setNotice } = useSession();
  const navigate = useNavigate();
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api(`/feed/${id}`)
      .then(result => setFeed(result.feed))
      .catch(reason => setError(reason.message));
  }, [editing, id]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api(editing ? `/feed/${id}` : "/feed", {
        method: editing ? "PUT" : "POST",
        body: form,
      });
      setNotice({ type: "success", text: result.message });
      navigate(editing ? `/feed/${id}` : "/user/profile");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  if (editing && error) return <PageMessage title="Post unavailable" text={error} />;
  if (editing && !feed) return <Loading />;

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10 col-12">
          <h2>{editing ? "Edit your post" : "Create new post"}</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit} encType="multipart/form-data">
            <div className="row">
              <div className="mb-3 col-md-8">
                <label htmlFor="title" className="form-label">Title</label>
                <input id="title" name="title" className="form-control" defaultValue={feed?.title || ""} required />
              </div>
              <div className="mb-3 col-md-4">
                <label htmlFor="category" className="form-label">Category</label>
                <select id="category" name="category" className="form-select" defaultValue={feed?.category || "motivational"}>
                  {categoryOptions.filter(([value]) => value !== "news").map(([value,label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>
            </div>
            {editing && <div className="mb-3"><h4>Current uploaded image</h4><img className="current-feed-img" src={feed.image.url} alt={feed.title} /></div>}
            <div className="mb-3">
              <label htmlFor="image" className="form-label">{editing ? "Upload new image" : "Upload image"}</label>
              <input id="image" name="image" type="file" accept="image/png,image/jpeg" className="form-control" />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea id="description" name="description" className="form-control" defaultValue={feed?.description || ""} required />
            </div>
            <div className="mb-3">
              <label htmlFor="info" className="form-label">Info</label>
              <textarea id="info" name="info" className="form-control" defaultValue={feed?.info || ""} required />
            </div>
            <button id={editing ? "Update" : "add"} className="btn custom-btn w-100" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
