const express = require("express");
const router = express.Router();
const newsAggregator = require("../services/newsAggregator");

// GET /api/news?q={query}&category={category}
router.get("/", async (req, res) => {
  const q = req.query.q || req.query.question || "";
  const category = req.query.category || "default";

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' or 'question' is required" });
  }

  try {
    const news = await newsAggregator.getNews(q, category);
    res.json(news);
  } catch (error) {
    console.error(`[Routes News] Failed to fetch news for query '${q}': ${error.message}`);
    res.status(502).json({ error: "News service temporarily unavailable" });
  }
});

module.exports = router;
