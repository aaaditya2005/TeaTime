import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <article className="container privacy-policy py-5">
      <h1 className="mb-3">Privacy Policy &amp; Community Rules</h1>
      <p className="text-muted">This page explains how It's TeaTime handles information and the standards expected when using the app.</p>
      <section className="mt-4">
        <h2>Privacy Policy</h2>
        <h3 className="h5 mt-3">Information used by the app</h3>
        <p>TeaTime stores account details such as your username, email address, password hash, profile image, and preferred categories. It also stores content you create, reviews, likes, login streaks, and the session needed to keep you signed in.</p>
        <h3 className="h5 mt-3">How information is used</h3>
        <p>This information is used to provide sign-in, personalized feeds, profiles, posts, reviews, likes, and session continuity. Passwords are stored as hashes rather than readable passwords.</p>
        <h3 className="h5 mt-3">Third-party services</h3>
        <p>TeaTime uses Supabase to store application data, Cloudinary to store uploaded images, and NewsData.io to retrieve news headlines. When you ask the AI about a post, that post's title, category, description, and your question are sent to Google's Gemini API to generate an answer. Avoid including private or sensitive information in public posts or AI questions.</p>
        <h3 className="h5 mt-3">Cookies and your choices</h3>
        <p>A session cookie is used to keep you signed in. You can edit your profile and remove content through the controls provided in the app. The app does not currently provide self-service account deletion; contact the project maintainer to request account removal.</p>
        <h3 className="h5 mt-3">Policy updates</h3>
        <p>This notice should be updated if TeaTime's data practices or service providers change. Review it periodically when using the app.</p>
      </section>
      <section className="mt-5">
        <h2>Community Rules</h2>
        <ol>
          <li>Be respectful. Do not harass, threaten, or target other people.</li>
          <li>Do not publish unlawful, hateful, sexually exploitative, or deliberately harmful content.</li>
          <li>Only upload images and publish material that you have permission to use.</li>
          <li>Do not post another person's private or identifying information without their consent.</li>
          <li>Do not spam, manipulate likes or reviews, or misuse the news and AI services.</li>
          <li>Check important claims against reliable sources. AI answers and news summaries can be incomplete or incorrect.</li>
        </ol>
        <p>Content that violates these rules may be removed, and access to the app may be restricted.</p>
      </section>
    </article>
  );
}

export function NotFoundPage() {
  return <div className="container py-5"><h1>Page not found</h1><p>The page you are looking for does not exist.</p><Link to="/feed">Return home</Link></div>;
}
