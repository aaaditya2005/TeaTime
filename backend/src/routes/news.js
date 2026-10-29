const express=require("express");
const router=express.Router();
const axios = require("axios");
const crypto=require("crypto");
const {translateNews,languageNames}=require("../services/aiService.js");
const translations=new Map();
const maxCachedBatches=50;

function normalizeArticle(article){
    return {
        title:article.title||"Untitled",
        description:article.description||"",
        image:article.image_url||"/images/default.png",
        source:{name:article.source_name||article.source_id||"News"},
        url:article.link,
    };
}

router.post("/translate",async(req,res)=>{
    const {news,language}=req.body||{};
    if(!languageNames[language]||!Array.isArray(news)||news.length>10||news.some(article=>typeof article.title!=="string"||typeof article.description!=="string")){
        return res.status(400).json({error:"A valid language and up to 10 article texts are required."});
    }
    const cacheKey=crypto.createHash("sha256").update(`${language}:${JSON.stringify(news)}`).digest("hex");
    const cached=translations.get(cacheKey);
    if(cached) return res.json({news:cached});

    try{
        const translated=await translateNews(news,language);
        if(translations.size>=maxCachedBatches){
            translations.delete(translations.keys().next().value);
        }
        translations.set(cacheKey,translated);
        res.json({news:translated});
    }catch(error){
        console.error("News translation failed:",error.message);
        res.status(503).json({error:"News translation is temporarily unavailable."});
    }
});

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
        const news=(response.data.results||[]).map(normalizeArticle);
        res.json({news});
    } catch (err) {
        console.error("NewsData API error:", err.response?.status || "network error", err.message);
        res.status(502).json({error:"News is temporarily unavailable."});
    }
});

module.exports=router;