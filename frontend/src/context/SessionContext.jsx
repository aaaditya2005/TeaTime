import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api("/session")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setNotice({ type: "danger", text: "Could not connect to TeaTime." }))
      .finally(() => setSessionReady(true));
  }, []);

  return (
    <SessionContext.Provider value={{ user, setUser, notice, setNotice, sessionReady }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
