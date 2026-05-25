const express = require("express");
const router = express.Router();
const polymarketService = require("../services/polymarket");
const newsAggregator = require("../services/newsAggregator");
const scorer = require("../services/scorer");
const cacheService = require("../services/cache");

// GET /api/markets
// Params: limit, offset, category, search, sort
router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit || 100);
  const offset = parseInt(req.query.offset || 0);
  const category = req.query.category || "All";
  const search = req.query.search || "";
  const sort = req.query.sort || "volume";

  const cacheKey = `markets_list:${limit}:${offset}`;
  
  try {
    const allMarkets = await cacheService.getOrFetch(cacheKey, cacheService.TTL.MARKETS, async () => {
      return await polymarketService.getMarkets(limit, offset);
    });

    let filtered = [...allMarkets];

    // Filter by Category
    if (category !== "All") {
      const catLower = category.toLowerCase();
      filtered = filtered.filter((m) => {
        const cat = String(m.category || "").toLowerCase();
        const q = String(m.question || "").toLowerCase();

        if (catLower === "politics" && /\b(trump|biden|election|senate|congress|political|harris|president)\b/.test(q)) return true;
        if (catLower === "crypto" && /\b(bitcoin|crypto|eth|sol|token|blockchain|doge|binance)\b/.test(q)) return true;
        if (catLower === "sports" && /\b(nba|nfl|soccer|tennis|ufc|boxing|championship|olympics)\b/.test(q)) return true;
        if (catLower === "economics" && /\b(gdp|inflation|fed|economy|rate|recession)\b/.test(q)) return true;
        if (catLower === "science" && /\b(space|nasa|ai|openai|science|moon|biology|cancer)\b/.test(q)) return true;

        return cat.includes(catLower);
      });
    }

    // Filter by Search text
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((m) =>
        String(m.question || "").toLowerCase().includes(searchLower)
      );
    }

    // Sorting Options
    filtered.sort((a, b) => {
      if (sort === "volume") {
        return b.volume24hr - a.volume24hr;
      }
      if (sort === "liquidity") {
        return b.liquidity - a.liquidity;
      }
      if (sort === "ends-soon") {
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }
      if (sort === "newest") {
        return b.conditionId.localeCompare(a.conditionId);
      }
      return 0;
    });

    res.json(filtered);
  } catch (error) {
    console.error(`[Routes Markets] Failed to fetch markets: ${error.message}`);
    res.status(502).json({ error: "Market data temporarily unavailable" });
  }
});

// GET /api/markets/:conditionId/full
router.get("/:conditionId/full", async (req, res) => {
  const { conditionId } = req.params;
  const cacheKey = `market_full:${conditionId}`;

  try {
    const data = await cacheService.getOrFetch(cacheKey, cacheService.TTL.MARKET_DETAIL, async () => {
      // 1. Fetch main market first to get token IDs
      const market = await polymarketService.getMarket(conditionId);
      if (!market) {
        throw new Error("Market not found");
      }

      const yesTokenId = market.yesTokenId;
      const noTokenId = market.noTokenId;

      // 2. Fetch all other resources in parallel
      const [priceHistoryRes, noHistoryRes, orderbookRes, tradesRes, newsRes] = await Promise.allSettled([
        yesTokenId ? polymarketService.getPriceHistory(yesTokenId) : Promise.resolve({ history: [] }),
        noTokenId ? polymarketService.getPriceHistory(noTokenId) : Promise.resolve({ history: [] }),
        yesTokenId ? polymarketService.getOrderbook(yesTokenId) : Promise.resolve({ bids: [], asks: [] }),
        polymarketService.getTrades(conditionId, 100),
        newsAggregator.getNews(market.question, market.category),
      ]);

      const priceHistory = priceHistoryRes.status === "fulfilled" ? priceHistoryRes.value?.history ?? [] : [];
      const noHistory = noHistoryRes.status === "fulfilled" ? noHistoryRes.value?.history ?? [] : [];
      const orderbook = orderbookRes.status === "fulfilled" ? orderbookRes.value ?? { bids: [], asks: [] } : { bids: [], asks: [] };
      const trades = tradesRes.status === "fulfilled" ? tradesRes.value ?? [] : [];
      const news = newsRes.status === "fulfilled" ? newsRes.value ?? [] : [];

      // 3. Compute deterministic intelligence score
      const score = scorer.scoreMarket({
        market,
        priceHistory,
        trades,
        orderbook,
      });

      return {
        market,
        priceHistory,
        noHistory,
        orderbook,
        trades,
        news,
        score,
      };
    });

    res.json(data);
  } catch (error) {
    if (error.message === "Market not found") {
      return res.status(404).json({ error: "Market not found" });
    }
    console.error(`[Routes Markets] Failed to fetch market details for ${conditionId}: ${error.message}`);
    res.status(502).json({ error: "Market details temporarily unavailable" });
  }
});

module.exports = router;
