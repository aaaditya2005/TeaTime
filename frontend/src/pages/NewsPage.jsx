import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { Loading } from "../components/Common.jsx";

export default function NewsPage() {
  const [news, setNews] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/news").then(result => setNews(result.news)).catch(reason => setError(reason.message));
  }, []);

  return (
    <div className="news-page container py-4">
      {error && <div className="alert alert-warning">{error}</div>}
      {!news && !error && <Loading />}
      {news?.length === 0 && <p className="text-muted">No news is available right now.</p>}
      {news?.length > 0 && (
        <div className="news-list">
          {news.map((article, index) => (
            <article className="news-item" key={`${article.url}-${index}`}>
              <img
                className="news-image"
                src={article.image || "/images/default.png"}
                alt=""
                onError={event => { event.currentTarget.src = "/images/default.png"; }}
              />
              <div className="news-content">
                <p className="news-source">{article.source?.name || "News"}</p>
                <h2>{article.title}</h2>
                {article.description && <p className="news-description">{article.description}</p>}
                <a className="news-read-more" href={article.url} target="_blank" rel="noreferrer">Read article</a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
