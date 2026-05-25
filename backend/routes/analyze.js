const express = require("express");
const router = express.Router();
const polymarketService = require("../services/polymarket");
const scorer = require("../services/scorer");
const cacheService = require("../services/cache");

// Helper to fetch details with a concurrency limit of 5 using sequential chunking
async function fetchDetailedMarkets(markets, limit = 30, concurrency = 5) {
  const results = [];
  const subset = markets.slice(0, limit);

  for (let i = 0; i < subset.length; i += concurrency) {
    const chunk = subset.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (m) => {
      try {
        const [tradesRes, historyRes, bookRes] = await Promise.allSettled([
          polymarketService.getTrades(m.conditionId, 50),
          m.yesTokenId ? polymarketService.getPriceHistory(m.yesTokenId) : Promise.resolve({ history: [] }),
          m.yesTokenId ? polymarketService.getOrderbook(m.yesTokenId) : Promise.resolve({ bids: [], asks: [] }),
        ]);

        const trades = tradesRes.status === "fulfilled" ? tradesRes.value : [];
        const priceHistory = historyRes.status === "fulfilled" ? historyRes.value?.history : [];
        const orderbook = bookRes.status === "fulfilled" ? bookRes.value : { bids: [], asks: [] };

        return { market: m, trades, priceHistory, orderbook };
      } catch (err) {
        console.warn(`[Analyze Chunk] Failed to fetch details for ${m.conditionId}: ${err.message}`);
        return { market: m, trades: [], priceHistory: [], orderbook: { bids: [], asks: [] } };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    // Micro sleep to respect the endpoints rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  // Map remaining markets with empty details (graceful degradation)
  for (let i = limit; i < markets.length; i++) {
    results.push({
      market: markets[i],
      trades: [],
      priceHistory: [],
      orderbook: { bids: [], asks: [] },
    });
  }

  return results;
}

// GET /api/analyze/top
router.get("/top", async (req, res) => {
  const cacheKey = "analyze_top";
  
  try {
    const scoredList = await cacheService.getOrFetch(cacheKey, cacheService.TTL.ANALYSIS, async () => {
      const markets = await polymarketService.getMarkets(100, 0);
      const detailed = await fetchDetailedMarkets(markets, 30, 5);

      const scored = detailed.map((entry) => {
        const score = scorer.scoreMarket(entry);
        return {
          ...entry.market,
          score,
        };
      });

      // Sort by finalScore descending
      scored.sort((a, b) => b.score.finalScore - a.score.finalScore);
      return scored;
    });

    res.json(scoredList);
  } catch (error) {
    console.error(`[Routes Analyze] Failed to fetch top analysis: ${error.message}`);
    res.status(502).json({ error: "Analysis engine temporarily unavailable" });
  }
});

// GET /api/analyze/best-bets
router.get("/best-bets", async (req, res) => {
  const cacheKey = "analyze_best_bets";

  try {
    const bestBets = await cacheService.getOrFetch(cacheKey, cacheService.TTL.ANALYSIS, async () => {
      const markets = await polymarketService.getMarkets(100, 0);
      // Fetch top 30 detailed markets
      const detailed = await fetchDetailedMarkets(markets, 30, 5);

      const scored = detailed.map((entry) => {
        const score = scorer.scoreMarket(entry);
        return {
          conditionId: entry.market.conditionId,
          question: entry.market.question,
          yesPrice: entry.market.yesPrice,
          noPrice: entry.market.noPrice,
          volume24hr: entry.market.volume24hr,
          daysLeft: entry.market.daysLeft,
          category: entry.market.category,
          advisor: score,
        };
      });

      // Filter: Relax confidence gating. If we have scored markets, we want to show something.
      // We will accept any confidence level.

      // Top 5 YES picks (finalScore >= 1 to relax from 3)
      const topYes = scored
        .filter((m) => m.advisor.finalScore >= 1)
        .sort((a, b) => b.advisor.finalScore - a.advisor.finalScore)
        .slice(0, 5);

      // Top 5 NO picks (finalScore <= -1 to relax from -3)
      const topNo = scored
        .filter((m) => m.advisor.finalScore <= -1)
        .sort((a, b) => a.advisor.finalScore - b.advisor.finalScore) // most negative first
        .slice(0, 5);
      
      // Fallback: If no picks found based on score, compute lightweight recommendations
      if (topYes.length === 0) {
        // Fallback YES picks based on liquidity and price edge
        scored.filter(m => m.yesPrice >= 30 && m.yesPrice <= 70 && m.liquidity > 5000 && m.volume24hr > 1000)
              .sort((a, b) => b.volume24hr - a.volume24hr)
              .slice(0, 5)
              .forEach(m => topYes.push(m));
      }

      if (topNo.length === 0) {
        // Fallback NO picks based on liquidity and price edge
        scored.filter(m => m.noPrice >= 30 && m.noPrice <= 70 && m.liquidity > 5000 && m.volume24hr > 1000)
              .sort((a, b) => b.volume24hr - a.volume24hr)
              .slice(0, 5)
              .forEach(m => topNo.push(m));
      }

      return {
        yesPicks: topYes,
        noPicks: topNo,
      };
    });

    res.json(bestBets);
  } catch (error) {
    console.error(`[Routes Analyze] Failed to fetch best bets: ${error.message}`);
    res.status(502).json({ error: "Best Bets advisor temporarily unavailable" });
  }
});

module.exports = router;
