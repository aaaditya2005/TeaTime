import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { PasswordField } from "../components/Common.jsx";

export function LoginPage() {
  const { setUser, setNotice } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await api("/user/login", { method: "POST", body: Object.fromEntries(form) });
      setUser(result.user);
      setNotice({ type: "success", text: result.message });
      navigate(location.state?.from || "/feed", { replace: true });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8 col-12">
          <h2 className="text-center mb-4">Login to It's TeaTime</h2>
          <div className="card shadow p-4">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={submit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input type="text" id="username" name="username" className="form-control" required />
              </div>
              <PasswordField show={showPassword} toggle={() => setShowPassword(value => !value)} />
              <button id="login" className="btn custom-btn w-100" disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
            </form>
          </div>
          <div className="text-center mt-3 mb-3"><Link to="/user/signup">Create new account / Sign Up</Link></div>
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const { setUser, setNotice } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/user/signup", { method: "POST", body: new FormData(event.currentTarget) });
      setUser(result.user);
      setNotice({ type: "success", text: result.message });
      navigate("/feed");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8 col-12">
          <h2 className="text-center mb-4">Signup for It's TeaTime</h2>
          <div className="card shadow p-4">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={submit} encType="multipart/form-data">
              <div className="mb-3"><label htmlFor="username" className="form-label">Username</label><input id="username" name="username" className="form-control" required /></div>
              <div className="mb-3"><label htmlFor="email" className="form-label">Email</label><input id="email" type="email" name="email" className="form-control" required /></div>
              <PasswordField show={showPassword} toggle={() => setShowPassword(value => !value)} />
              <div className="mb-3"><label htmlFor="profileImage" className="form-label">Profile Picture</label><input id="profileImage" type="file" name="profileImage" accept="image/png,image/jpeg" className="form-control" /></div>
              <button className="btn custom-btn primary-btn w-100" id="signup" disabled={busy}>{busy ? "Creating account..." : "Signup"}</button>
            </form>
          </div>
          <div className="text-center mt-3"><Link to="/user/login">Already have an account? Login</Link></div>
        </div>
      </div>
    </div>
  );
}
