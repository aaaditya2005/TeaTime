const express=require("express");
const router=express.Router();
const axios = require("axios");

router.get("/", async (req, res) => {
    const apiKey = process.env.NEWSDATA_API_KEY || process.env.GNEWS_API_KEY;
    if (!apiKey) {
        return res.status(503).json({error:"News API is not configured."});
    }

    try {
        const response = await axios.get("https://newsdata.io/api/1/latest", {
            params: {
                apikey: apiKey,
                country: "in",
                language: "en",
                size: 10,
            },
            timeout: 15000,
        });
        const news = (response.data.results || []).map(article => ({
            title: article.title || "Untitled",
            description: article.description || article.content || "",
            image: article.image_url || "/images/default.png",
            source: { name: article.source_name || article.source_id || "News" },
            url: article.link,
        }));
        res.json({news});
    } catch (err) {
        console.error("NewsData API error:", err.response?.status || "network error", err.message);
        res.status(502).json({error:"News is temporarily unavailable."});
    }
});

module.exports=router;