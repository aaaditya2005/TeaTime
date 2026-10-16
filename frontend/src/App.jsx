import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Footer, Navbar, Notice, Protected } from "./components/index.js";
import { SessionProvider, useSession } from "./context/SessionContext.jsx";
import { LoginPage, SignupPage } from "./pages/AuthPages.jsx";
import FeedEditor from "./pages/FeedEditor.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import NewsPage from "./pages/NewsPage.jsx";
import { NotFoundPage, PrivacyPage } from "./pages/StaticPages.jsx";
import { ProfileEditor, ProfilePage } from "./pages/ProfilePages.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import "./app.css";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { notice, setNotice } = useSession();

  return (
    <div className="app-root">
      <Navbar />
      <main className="app-main container-fluid px-0 py-0">
        {notice && <Notice notice={notice} dismiss={() => setNotice(null)} />}
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<HomePage />} />
          <Route path="/feeds/:category" element={<TodayPage />} />
          <Route path="/feed/new" element={<Protected><FeedEditor /></Protected>} />
          <Route path="/feed/:id" element={<FeedPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/user/login" element={<LoginPage />} />
          <Route path="/user/signup" element={<SignupPage />} />
          <Route path="/user/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/user/profile/edit" element={<Protected><ProfileEditor /></Protected>} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
