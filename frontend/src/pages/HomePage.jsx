import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../context/SessionContext.jsx";

export default function HomePage() {
  const { user } = useSession();
  const { t } = useTranslation();
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="heading mt-4">
          <h1>It's TeaTime</h1>
          <h5>{t("home.tagline")}</h5>
        </div>
        <div className="explore">
          <Link className="btn index-btn" to={user ? "/user/profile" : "/user/login"}>
            {user ? t("home.explore") : t("home.loginSignup")}
          </Link>
        </div>
        <div className="news">
          <Link className="btn index-btn" id="news" to="/news">{t("home.news")}</Link>
        </div>
      </div>
    </section>
  );
}
