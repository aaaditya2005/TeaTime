import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { categoryOptions } from "../constants/categories.js";
import { useSession } from "../context/SessionContext.jsx";

export default function FeedEditor() {
  const { setNotice } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api("/feed", {
        method: "POST",
        body: form,
      });
      setNotice({ type: "success", text: result.message });
      navigate("/user/profile");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10 col-12">
          <h2>Create new post</h2>
          <p className="text-muted">You can publish one post per day across all categories.</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit} encType="multipart/form-data">
            <div className="row">
              <div className="mb-3 col-md-8">
                <label htmlFor="title" className="form-label">Title</label>
                <input id="title" name="title" className="form-control" required />
              </div>
              <div className="mb-3 col-md-4">
                <label htmlFor="category" className="form-label">Category</label>
                <select id="category" name="category" className="form-select" defaultValue="motivational">
                  {categoryOptions.filter(([value]) => value !== "news").map(([value,label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="image" className="form-label">Upload image</label>
              <input id="image" name="image" type="file" accept="image/png,image/jpeg" className="form-control" />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea id="description" name="description" className="form-control" required />
            </div>
            <div className="mb-3">
              <label htmlFor="info" className="form-label">Info</label>
              <textarea id="info" name="info" className="form-control" required />
            </div>
            <button id="add" className="btn custom-btn w-100" disabled={saving}>{saving ? "Saving..." : "Add"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
