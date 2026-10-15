import { useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { categoryOptions, useSession } from "../context/SessionContext.jsx";

export function Notice({ notice, dismiss }) {
  return (
    <div className={`alert alert-${notice.type} alert-dismissible fade show m-3`} role="status">
      {notice.text}
      <button type="button" className="btn-close" aria-label="Dismiss" onClick={dismiss} />
    </div>
  );
}

export function Navbar() {
  const { user, setUser, setNotice } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const categories = user?.preferredCategories?.length
    ? user.preferredCategories
    : ["motivational", "fitness", "spiritual", "news", "natural-fact"];

  async function logout() {
    try {
      await api("/user/logout", { method: "POST" });
      setUser(null);
      setNotice({ type: "success", text: "Logged out successfully." });
      setAccountOpen(false);
      navigate("/feed");
    } catch (error) {
      setNotice({ type: "danger", text: error.message });
    }
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body-light border-bottom sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/feed" onClick={() => setExpanded(false)}>
          <img src="/images/logo.png" className="logo" alt="It's TeaTime Logo" />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`navbar-collapse ${expanded ? "show" : "collapse"}`}>
          <div className="navbar-nav">
            <NavLink className="nav-link" to="/feed" onClick={() => setExpanded(false)} aria-label="Home">
              <i className="fa-solid fa-house" />
            </NavLink>
            {categories.map(category => (
              <NavLink
                className="nav-link"
                to={category === "news" ? "/news" : `/feeds/${category}`}
                key={category}
                onClick={() => setExpanded(false)}
              >
                {categoryOptions.find(([value]) => value === category)?.[1] || category}
              </NavLink>
            ))}
          </div>
          <div className="navbar-nav ms-auto nav-actions">
            <Link className="nav-link" to="/feed/new" aria-label="Create a post" onClick={() => setExpanded(false)}>
              <i className="fa-solid fa-circle-plus" />
            </Link>
            <button
              className="nav-link account-toggle"
              type="button"
              aria-label="Account menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen(value => !value)}
            >
              {user?.profileImage?.url
                ? <img className="nav-avatar" src={user.profileImage.url} alt="" />
                : <i className="fa-solid fa-circle-user" />}
            </button>
            {accountOpen && (
              <div className="account-menu">
                {user ? (
                  <>
                    <Link to="/user/profile" onClick={() => setAccountOpen(false)}>{user.username}</Link>
                    <Link to="/user/profile/edit" onClick={() => setAccountOpen(false)}>Edit profile</Link>
                    <button type="button" onClick={logout}>Log out</button>
                  </>
                ) : (
                  <>
                    <Link to="/user/login" onClick={() => setAccountOpen(false)}>Login</Link>
                    <Link to="/user/signup" onClick={() => setAccountOpen(false)}>Sign up</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Protected({ children }) {
  const { user, sessionReady } = useSession();
  const location = useLocation();
  if (!sessionReady) return <Loading />;
  if (!user) return <Navigate to="/user/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function Footer() {
  return (
    <footer className="border-top text-center">
      <div className="f-info">
        <div className="f-info-brand">&copy; 2026 It's TeaTime</div>
        <div className="f-info-links"><Link to="/privacy">Privacy Policy</Link></div>
      </div>
    </footer>
  );
}

export function PageMessage({ title, text }) {
  return <div className="container py-5"><h1>{title}</h1><p>{text}</p><Link to="/feed">Return home</Link></div>;
}

export function Loading() {
  return <div className="container py-5" role="status">Loading...</div>;
}

export function PasswordField({ show, toggle }) {
  return (
    <div className="mb-3">
      <label htmlFor="password" className="form-label">Password</label>
      <div className="password-input-wrap">
        <input type={show ? "text" : "password"} id="password" name="password" className="form-control" required />
        <button type="button" className="password-toggle" onClick={toggle} aria-label={show ? "Hide password" : "Show password"}>
          <i className={`fa-solid ${show ? "fa-eye-slash" : "fa-eye"}`} />
        </button>
      </div>
    </div>
  );
}

export function CategoryCheckboxes({ selected = [] }) {
  return (
    <fieldset className="mb-3">
      <legend className="form-label">Preferred Categories</legend>
      {categoryOptions.map(([value,label]) => (
        <div className="form-check" key={value}>
          <input className="form-check-input" type="checkbox" name="preferredCategories" value={value} id={`category-${value}`} defaultChecked={selected.includes(value)} />
          <label className="form-check-label" htmlFor={`category-${value}`}>{label}</label>
        </div>
      ))}
    </fieldset>
  );
}

export function PostGrid({ title, posts }) {
  return (
    <>
      <h3>{posts.length} {title}</h3>
      <div className="row row-cols-lg-4 row-cols-md-2 row-cols-sm-1 mt-3">
        {posts.map(post => (
          <Link to={`/feed/${post.id}`} className="nav-link" key={post.id}>
            <div className="card mb-3 h-100">
              <img src={post.image?.url || "/images/default.png"} className="card-img-top profile-post-img" alt={post.title} />
              <div className="card-body"><h5>{post.title}</h5></div>
            </div>
          </Link>
        ))}
      </div>
      {!posts.length && <p className="text-muted">Nothing here yet.</p>}
    </>
  );
}
