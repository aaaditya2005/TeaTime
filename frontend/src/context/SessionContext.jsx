import { createContext, useContext, useEffect, useState } from "react";
import i18n from "../i18n.js";
import { api } from "../services/api.js";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [notice, setNotice] = useState(null);
  const [language, setLanguage] = useState(i18n.language);

  function applyLanguage(nextLanguage) {
    const supported = ["en", "hi", "kn", "ta", "mr", "te"];
    const value = supported.includes(nextLanguage) ? nextLanguage : "en";
    setLanguage(value);
    window.localStorage.setItem("preferredLanguage", value);
    i18n.changeLanguage(value);
  }

  function updateSessionUser(nextUser) {
    setUser(nextUser);
    if (nextUser?.preferredLanguage) applyLanguage(nextUser.preferredLanguage);
  }

  async function changeLanguage(nextLanguage) {
    const previousLanguage = language;
    applyLanguage(nextLanguage);
    if (!user) return;
    try {
      const result = await api("/user/language", {
        method: "PUT",
        body: { preferredLanguage: nextLanguage },
      });
      setUser(result.user);
    } catch (error) {
      applyLanguage(previousLanguage);
      throw error;
    }
  }

  useEffect(() => {
    api("/session")
      .then(({ user: currentUser }) => updateSessionUser(currentUser))
      .catch(() => setNotice({ type: "danger", text: i18n.t("common.connectFailed") }))
      .finally(() => setSessionReady(true));
  }, []);

  return (
    <SessionContext.Provider value={{ user, setUser: updateSessionUser, notice, setNotice, sessionReady, language, changeLanguage }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
