import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { categoryOptions } from "../constants/categories.js";
import { useSession } from "../context/SessionContext.jsx";
import { languages } from "../i18n.js";

const categoryKeys = {
  motivational: "category.motivational",
  fitness: "category.fitness",
  spiritual: "category.spiritual",
  "natural-fact": "category.naturalFact",
  "culture-history": "category.cultureHistory",
  news: "category.news",
};

export function Notice({ notice, dismiss }) {
  const { t } = useTranslation();
  return (
    <div className={`alert alert-${notice.type} alert-dismissible fade show m-3`} role="status">
      {notice.text}
      <button type="button" className="btn-close" aria-label={t("nav.dismiss")} onClick={dismiss} />
    </div>
  );
}

export function ShareButton({ url, title }) {
  const { t } = useTranslation();
  const { setNotice } = useSession();

  async function sharePost() {
    const absoluteUrl = new URL(url, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url: absoluteUrl });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(absoluteUrl);
      setNotice({ type: "success", text: t("share.copied") });
    } catch {
      window.prompt(t("share.copyPrompt"), absoluteUrl);
    }
  }

  return (
    <button className="btn custom-btn share-post-btn" type="button" onClick={sharePost}>
      <i className="fa-solid fa-share-nodes" aria-hidden="true" /> {t("share.post")}
    </button>
  );
}

export function Navbar() {
  const { user, setUser, setNotice, language, changeLanguage } = useSession();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const categories = categoryOptions.map(([value]) => value);

  async function logout() {
    try {
      await api("/user/logout", { method: "POST" });
      setUser(null);
      setNotice({ type: "success", text: t("nav.loggedOut") });
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
          <img src="/images/logo.png" className="logo" alt={t("nav.logoAlt")} />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-label={t("nav.toggleNavigation")}
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`navbar-collapse ${expanded ? "show" : "collapse"}`}>
          <div className="navbar-nav">
            <NavLink className="nav-link" to="/feed" onClick={() => setExpanded(false)} aria-label={t("nav.home")}>
              <i className="fa-solid fa-house" />
            </NavLink>
            {categories.map(category => (
              <NavLink
                className="nav-link"
                to={category === "news" ? "/news" : `/feeds/${category}`}
                key={category}
                onClick={() => setExpanded(false)}
              >
                {t(categoryKeys[category]) || category}
              </NavLink>
            ))}
          </div>
          <div className="navbar-nav ms-auto nav-actions">
            <label className="visually-hidden" htmlFor="app-language">{t("language.label")}</label>
            <select
              id="app-language"
              className="form-select form-select-sm language-select"
              aria-label={t("language.label")}
              value={language}
              onChange={event => changeLanguage(event.target.value).catch(error => setNotice({ type: "danger", text: error.message }))}
            >
              {languages.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
            </select>
            <Link className="nav-link" to="/feed/new" aria-label={t("nav.create")} onClick={() => setExpanded(false)}>
              <i className="fa-solid fa-circle-plus" />
            </Link>
            <button
              className="nav-link account-toggle"
              type="button"
              aria-label={t("nav.account")}
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
                    <Link to="/user/profile/edit" onClick={() => setAccountOpen(false)}>{t("nav.editProfile")}</Link>
                    <button type="button" onClick={logout}>{t("nav.logout")}</button>
                  </>
                ) : (
                  <>
                    <Link to="/user/login" onClick={() => setAccountOpen(false)}>{t("nav.login")}</Link>
                    <Link to="/user/signup" onClick={() => setAccountOpen(false)}>{t("nav.signup")}</Link>
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
  const { t } = useTranslation();
  return (
    <footer className="border-top text-center">
      <div className="f-info">
        <div className="f-info-brand">&copy; 2026 It's TeaTime</div>
        <div className="f-info-links"><Link to="/privacy">{t("static.privacy")}</Link></div>
      </div>
    </footer>
  );
}

export function PageMessage({ title, text }) {
  const { t } = useTranslation();
  return <div className="container py-5"><h1>{title}</h1><p>{text}</p><Link to="/feed">{t("common.returnHome")}</Link></div>;
}

export function Loading() {
  const { t } = useTranslation();
  return <div className="container py-5" role="status">{t("common.loading")}</div>;
}

export function PasswordField({ show, toggle }) {
  const { t } = useTranslation();
  return (
    <div className="mb-3">
      <label htmlFor="password" className="form-label">{t("common.password")}</label>
      <div className="password-input-wrap">
        <input type={show ? "text" : "password"} id="password" name="password" className="form-control" required />
        <button type="button" className="password-toggle" onClick={toggle} aria-label={t(show ? "common.hidePassword" : "common.showPassword")}>
          <i className={`fa-solid ${show ? "fa-eye-slash" : "fa-eye"}`} />
        </button>
      </div>
    </div>
  );
}

export function PostGrid({ title, posts }) {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState("all");
  const filterId = useId();
  const visiblePosts = category === "all" ? posts : posts.filter(post => post.category === category);
  const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage || "en", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <section className="profile-post-section">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <h3 className="mb-0">{posts.length} {title}</h3>
        <div className="profile-post-filter">
          <label htmlFor={filterId} className="form-label mb-0">{t("profile.filterCategory")}</label>
          <select id={filterId} className="form-select form-select-sm" value={category} onChange={event => setCategory(event.target.value)}>
            <option value="all">{t("profile.allCategories")}</option>
            {categoryOptions.filter(([value]) => value !== "news").map(([value]) => (
              <option value={value} key={value}>{t(categoryKeys[value])}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-3 mt-2 profile-post-grid">
        {visiblePosts.map(post => (
          <div className="col" key={post.id}>
            <article className="card profile-post-card h-100">
              <img src={post.image?.url || "/images/default.png"} className="card-img-top profile-post-img" alt={post.title} />
              <div className="card-body">
                <h4 className="profile-post-title">{post.title}</h4>
                <p className="profile-post-meta">{t("profile.postAuthor", { name: post.owner?.username || t("common.formerUser") })}</p>
                <p className="profile-post-meta">{post.likes} {t(post.likes === 1 ? "feed.like" : "feed.likes")}</p>
                <dl className="profile-post-dates mb-0">
                  <div><dt>{t("profile.createdDate")}</dt><dd>{dateFormatter.format(new Date(post.createdAt))}</dd></div>
                  <div><dt>{t("profile.lastFeaturedDate")}</dt><dd>{post.lastFeaturedAt ? dateFormatter.format(new Date(post.lastFeaturedAt)) : t("profile.upcoming")}</dd></div>
                </dl>
              </div>
            </article>
          </div>
        ))}
      </div>
      {!visiblePosts.length && <p className="text-muted mt-3">{t("common.nothingYet")}</p>}
    </section>
  );
}
