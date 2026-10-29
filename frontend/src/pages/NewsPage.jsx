import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api.js";
import { useSession } from "../context/SessionContext.jsx";
import { Loading } from "../components/Common.jsx";

export default function NewsPage() {
  const { t } = useTranslation();
  const { language } = useSession();
  const [news, setNews] = useState(null);
  const [translatedNews, setTranslatedNews] = useState(null);
  const [error, setError] = useState("");
  const [translationError, setTranslationError] = useState(false);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    api("/news").then(result => setNews(result.news)).catch(reason => setError(reason.message));
  }, []);

  useEffect(() => {
    if (!news || language === "en") {
      setTranslatedNews(null);
      setTranslationError(false);
      setTranslating(false);
      return;
    }

    let active = true;
    setTranslatedNews(null);
    setTranslationError(false);

    const cacheKey = `teatime:news-translations:${language}`;
    let cached = {};
    try {
      cached = JSON.parse(window.localStorage.getItem(cacheKey) || "{}");
    } catch {
      window.localStorage.removeItem(cacheKey);
    }
    const cachedBatch = news.map((article, index) => cached[article.url || String(index)]);
    const cacheMatches = cachedBatch.every((entry, index) =>
      entry?.sourceTitle === news[index].title && entry?.sourceDescription === news[index].description
    );
    if (cacheMatches) {
      setTranslatedNews(news.map((article, index) => ({
        ...article,
        title: cachedBatch[index].title,
        description: cachedBatch[index].description,
      })));
      setTranslating(false);
      return () => { active = false; };
    }

    setTranslating(true);
    api("/news/translate", {
      method: "POST",
      body: {
        language,
        news: news.map(({ title, description }) => ({ title, description })),
      },
    }).then(({ news: translations }) => {
      if (!active) return;
      const localizedNews = news.map((article, index) => ({
        ...article,
        title: translations[index].title,
        description: translations[index].description,
      }));
      setTranslatedNews(localizedNews);
      try {
        const nextCache = { ...cached };
        localizedNews.forEach((article, index) => {
          nextCache[article.url || String(index)] = {
            sourceTitle: news[index].title,
            sourceDescription: news[index].description,
            title: article.title,
            description: article.description,
          };
        });
        window.localStorage.setItem(cacheKey, JSON.stringify(nextCache));
      } catch {
        return;
      }
    }).catch(() => {
      if (active) setTranslationError(true);
    }).finally(() => {
      if (active) setTranslating(false);
    });

    return () => { active = false; };
  }, [news, language]);

  const displayedNews = translatedNews || news;

  return (
    <div className="news-page container py-4">
      {error && <div className="alert alert-warning">{error}</div>}
      {!news && !error && <Loading />}
      {news?.length === 0 && <p className="text-muted">{t("news.none")}</p>}
      {news?.length > 0 && translating && <p role="status">{t("news.translating")}</p>}
      {news?.length > 0 && translationError && <p className="text-muted" role="status">{t("news.translationUnavailable")}</p>}
      {displayedNews?.length > 0 && (
        <div className="news-list">
          {displayedNews.map((article, index) => (
            <article className="news-item" key={`${article.url}-${index}`}>
              <img
                className="news-image"
                src={article.image || "/images/default.png"}
                alt=""
                onError={event => { event.currentTarget.src = "/images/default.png"; }}
              />
              <div className="news-content">
                <p className="news-source">{article.source?.name || t("news.source")}</p>
                <h2>{article.title}</h2>
                {article.description && <p className="news-description">{article.description}</p>}
                <a
                  className="news-read-more"
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("news.visitWebsite")}
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
