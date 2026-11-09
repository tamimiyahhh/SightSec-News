const express = require("express");
const axios = require("axios");

const router = express.Router();

const GNEWS_API_URL = "https://gnews.io/api/v4/search";

// Each category maps to a GNews search expression.
const CATEGORIES = {
  cybersecurity: '(cybersecurity OR infosec OR "cyber attack" OR "data breach")',
  ai: '("artificial intelligence" OR "machine learning" OR "generative AI")',
  technology: "(technology OR software OR hardware)",
  malware: "(malware OR ransomware OR trojan OR spyware)",
  privacy: '("data privacy" OR GDPR OR "personal data" OR "privacy law")',
};

// Tiny in-memory cache (5 min) to protect the GNews quota.
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

router.get("/categories", (req, res) => {
  res.json(Object.keys(CATEGORIES));
});

// GET /api/news?q=keyword&category=malware&page=1&pageSize=10
router.get("/", async (req, res, next) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "GNEWS_API_KEY is missing on the server (see .env.example)" });
    }

    const q = (req.query.q || "").toString().trim();
    const category = (req.query.category || "").toString().toLowerCase();
    const eventCountry = (req.query.eventCountry || "").toString().trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 10, 10);

    const parts = [];
    if (q) parts.push(`(${q})`);
    if (CATEGORIES[category]) parts.push(CATEGORIES[category]);
    if (eventCountry) {
      if (!/^[a-zA-Z .'-]{1,60}$/.test(eventCountry)) {
        return res.status(400).json({ error: "Invalid event country filter" });
      }
      parts.push(`"${eventCountry}"`);
    }
    const query = parts.length ? parts.join(" AND ") : CATEGORIES.cybersecurity;

    const params = {
      apikey: apiKey,
      q: query,
      lang: "en",
      sortby: q ? "relevance" : "publishedAt",
      page,
      max: pageSize,
    };

    const cacheKey = JSON.stringify(params);
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.time < TTL_MS) {
      return res.json({ ...hit.data, cached: true });
    }

    const response = await axios.get(GNEWS_API_URL, {
      params,
      timeout: 10000,
    });

    const articles = (response.data.articles || [])
      .filter((a) => a.title && a.url)
      .map((a) => ({
        title: a.title,
        description: a.description,
        content: a.content,
        author: a.author || null,
        source: a.source && a.source.name,
        url: a.url,
        image: a.image,
        publishedAt: a.publishedAt,
      }));

    const data = {
      totalResults: response.data.totalArticles,
      page,
      pageSize,
      articles,
    };
    cache.set(cacheKey, { time: Date.now(), data });
    res.json(data);
  } catch (err) {
    if (err.response) {
      const body = err.response.data;
      const msg = body?.errors?.join(", ") || body?.message || "GNews API error";
      return next(Object.assign(new Error(msg), { status: err.response.status }));
    }
    next(err);
  }
});

module.exports = router;
