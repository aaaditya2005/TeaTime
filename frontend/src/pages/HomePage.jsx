import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext.jsx";

export default function HomePage() {
  const { user } = useSession();
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="heading mt-4">
          <h1>It's TeaTime</h1>
          <h5>Read something. Discover something. With every sip of tea.</h5>
        </div>
        <div className="explore">
          <Link className="btn index-btn" to={user ? "/user/profile" : "/user/login"}>
            {user ? "Explore yourself!" : "Login/Signup"}
          </Link>
        </div>
        {(!user || user.preferredCategories?.includes("news")) && (
          <div className="news">
            <Link className="btn index-btn" id="news" to="/news">Know What's happening?!</Link>
          </div>
        )}
      </div>
    </section>
  );
}
