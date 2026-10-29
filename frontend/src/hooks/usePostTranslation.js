import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export function usePostTranslation(feed, language) {
  const [translation, setTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationFailed, setTranslationFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setTranslation(null);
    setTranslationFailed(false);

    if (!feed || language === "en") {
      setIsTranslating(false);
      return () => { active = false; };
    }

    const cacheKey = `teatime:post-translation:${feed.id}:${language}`;
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        setTranslation(JSON.parse(cached));
        setIsTranslating(false);
        return () => { active = false; };
      }
    } catch {
      window.localStorage.removeItem(cacheKey);
    }

    setIsTranslating(true);
    api(`/feed/${encodeURIComponent(feed.id)}/translate`, {
      method: "POST",
      body: { language },
    }).then(({ translation: translated }) => {
      if (!active) return;
      setTranslation(translated);
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(translated));
      } catch {
        return;
      }
    }).catch(() => {
      if (active) setTranslationFailed(true);
    }).finally(() => {
      if (active) setIsTranslating(false);
    });

    return () => { active = false; };
  }, [feed?.id, language]);

  return {
    content: translation ? { ...feed, ...translation } : feed,
    isTranslating,
    translationFailed,
  };
}