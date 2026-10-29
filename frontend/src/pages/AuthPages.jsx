import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { PasswordField } from "../components/Common.jsx";
import { languages } from "../i18n.js";

export function LoginPage() {
  const { setUser, setNotice } = useSession();
  const { t } = useTranslation();
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
      setNotice({ type: "success", text: t("auth.loginSuccess") });
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
          <h2 className="text-center mb-4">{t("auth.loginTitle")}</h2>
          <div className="card shadow p-4">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={submit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">{t("auth.username")}</label>
                <input type="text" id="username" name="username" className="form-control" required />
              </div>
              <PasswordField show={showPassword} toggle={() => setShowPassword(value => !value)} />
              <button id="login" className="btn custom-btn w-100" disabled={busy}>{busy ? t("auth.loginBusy") : t("nav.login")}</button>
            </form>
          </div>
          <div className="text-center mt-3 mb-3"><Link to="/user/signup">{t("auth.createAccount")}</Link></div>
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const { setUser, setNotice, language, changeLanguage } = useSession();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameCheck, setUsernameCheck] = useState(null);
  const normalizedUsername=username.trim();
  const usernameTooShort=normalizedUsername.length>0&&normalizedUsername.length<6;
  const checkingUsername=normalizedUsername.length>=6&&(
    usernameCheck?.username!==normalizedUsername||usernameCheck.status==="checking"
  );
  const usernameTaken=usernameCheck?.username===normalizedUsername&&usernameCheck.status==="taken";

  useEffect(()=>{
    const value=username.trim();
    if(value.length<6){
      setUsernameCheck(null);
      return;
    }

    const controller=new AbortController();
    const timeoutId=window.setTimeout(async()=>{
      setUsernameCheck({username:value,status:"checking"});
      try{
        const result=await api(`/user/username-availability?username=${encodeURIComponent(value)}`,{
          signal:controller.signal,
        });
        setUsernameCheck({username:value,status:result.available?"available":"taken"});
      }catch(reason){
        if(reason.name!=="AbortError"){
          setUsernameCheck({username:value,status:"error"});
        }
      }
    },300);

    return ()=>{
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  },[username]);

  async function submit(event) {
    event.preventDefault();
    if(normalizedUsername.length<6||checkingUsername||usernameTaken) return;
    setBusy(true);
    setError("");
    try {
      const form=new FormData(event.currentTarget);
      form.set("username",normalizedUsername);
      const result = await api("/user/signup", { method: "POST", body: form });
      setUser(result.user);
      setNotice({ type: "success", text: t("auth.signupSuccess") });
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
          <h2 className="text-center mb-4">{t("auth.signupTitle")}</h2>
          <div className="card shadow p-4">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={submit} encType="multipart/form-data">
              <div className="mb-3">
                <label htmlFor="username" className="form-label">{t("auth.username")}</label>
                <input
                  id="username"
                  name="username"
                  className="form-control"
                  value={username}
                  onChange={event=>setUsername(event.target.value)}
                  minLength={6}
                  aria-invalid={usernameTooShort||usernameTaken}
                  aria-describedby="username-availability"
                  autoComplete="username"
                  required
                />
                <div id="username-availability" className={`form-text ${usernameTaken?"text-danger":""}`} aria-live="polite">
                  {usernameTooShort&&t("auth.usernameShort")}
                  {checkingUsername&&t("auth.usernameChecking")}
                  {!checkingUsername&&usernameCheck?.username===normalizedUsername&&usernameCheck.status==="available"&&t("auth.usernameAvailable")}
                  {usernameTaken&&t("auth.usernameTaken")}
                  {!checkingUsername&&usernameCheck?.username===normalizedUsername&&usernameCheck.status==="error"&&t("auth.usernameCheckFailed")}
                </div>
              </div>
              <div className="mb-3"><label htmlFor="email" className="form-label">{t("auth.email")}</label><input id="email" type="email" name="email" className="form-control" required /></div>
              <PasswordField show={showPassword} toggle={() => setShowPassword(value => !value)} />
              <div className="mb-3">
                <label htmlFor="preferredLanguage" className="form-label">{t("auth.languagePreference")}</label>
                <select id="preferredLanguage" name="preferredLanguage" className="form-select" value={language} onChange={event => changeLanguage(event.target.value)}>
                  {languages.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
                </select>
              </div>
              <div className="mb-3"><label htmlFor="profileImage" className="form-label">{t("auth.profilePicture")}</label><input id="profileImage" type="file" name="profileImage" accept="image/png,image/jpeg" className="form-control" /></div>
              <button className="btn custom-btn primary-btn w-100" id="signup" disabled={busy||normalizedUsername.length<6||checkingUsername||usernameTaken}>{busy ? t("auth.signupBusy") : t("auth.signup")}</button>
            </form>
          </div>
          <div className="text-center mt-3"><Link to="/user/login">{t("auth.alreadyAccount")}</Link></div>
        </div>
      </div>
    </div>
  );
}
