const polymarketService = require("./polymarket");

let anomalyList = [];
const priceHistoryRegistry = new Map(); // marketId -> Array of { timestamp, price }
const liquidityHistoryRegistry = new Map(); // marketId -> { timestamp, liquidity }

function getAnomalies() {
  // Return last 50 sorted by recency
  return anomalyList.slice(-50).reverse();
}

function addAnomaly(anomaly) {
  anomaly.timestamp = Date.now();
  anomalyList.push(anomaly);
  if (anomalyList.length > 200) {
    anomalyList.shift();
  }
}

// Background detector runner
async function runAnomalyDetection() {
  console.log("[Anomaly Detector] Running checks on top markets...");
  try {
    const markets = await polymarketService.getMarkets(100, 0);
    const now = Date.now();

    // Limit detail scanning (trades/orderbook) to top 20 by volume to avoid 429
    const detailedScanCount = 20;

    for (let i = 0; i < markets.length; i++) {
      const market = markets[i];
      const marketId = market.conditionId;
      const currentPrice = market.yesPrice;
      const liquidity = market.liquidity;
      const volume24h = market.volume24hr;
      const totalVolume = market.totalVolume;

      // Quality Control: Ignore illiquid or tiny volume markets
      if (liquidity < 5000 || totalVolume < 1000) continue;

      // 1. VOLUME SPIKE DETECTION
      // Baseline enforcement: average volume must be at least 500 to prevent divide-by-near-zero absurd ratios
      const avg14dVolume = totalVolume > volume24h ? Math.max((totalVolume - volume24h) / 14, 500) : Math.max(volume24h * 0.9, 500);
      const volRatio = volume24h / avg14dVolume;
      
      // Ignore tiny absolute volume spikes (must be at least 5000 USDC spike)
      if (volRatio > 3 && volume24h > 5000) {
        addAnomaly({
          marketId,
          question: market.question,
          type: "VOLUME_SPIKE",
          severity: volRatio > 5 ? "HIGH" : "MEDIUM",
          detail: `${volRatio.toFixed(1)}x 14-day average volume ($${volume24h.toLocaleString()} USDC)`,
        });
      }

      // 2. PRICE JUMP DETECTION (1-hour delta)
      let priceHistory = priceHistoryRegistry.get(marketId) || [];
      priceHistory.push({ timestamp: now, price: currentPrice });
      
      // Keep only last 2 hours of registry data
      priceHistory = priceHistory.filter((ph) => now - ph.timestamp <= 2 * 60 * 60 * 1000);
      priceHistoryRegistry.set(marketId, priceHistory);

      // Find tick closest to 1 hour ago
      const oneHourAgo = now - 60 * 60 * 1000;
      let closestTick = null;
      let minDiff = Infinity;
      
      for (const ph of priceHistory) {
        const diff = Math.abs(ph.timestamp - oneHourAgo);
        if (diff < minDiff && ph.timestamp < now - 30 * 60 * 1000) { // must be at least 30m old
          minDiff = diff;
          closestTick = ph;
        }
      }

      if (closestTick) {
        const priceDiff = currentPrice - closestTick.price;
        const absDiff = Math.abs(priceDiff);
        if (absDiff > 5) {
          addAnomaly({
            marketId,
            question: market.question,
            type: "PRICE_JUMP",
            severity: absDiff > 10 ? "HIGH" : "MEDIUM",
            direction: priceDiff > 0 ? "UP" : "DOWN",
            magnitude: parseFloat(absDiff.toFixed(1)),
            detail: `Price moved ${priceDiff > 0 ? "+" : ""}${priceDiff.toFixed(1)} percentage points in last hour (${closestTick.price.toFixed(0)}% -> ${currentPrice.toFixed(0)}%)`,
          });
        }
      }

      // 3. LIQUIDITY DRAIN DETECTION (comparison against last stored state, e.g. up to 24h)
      let lastLiquidityState = liquidityHistoryRegistry.get(marketId);
      if (lastLiquidityState) {
        // Compare if last state is from a previous run
        const liquidityDrop = lastLiquidityState.liquidity - liquidity;
        // Ignore tiny absolute liquidity changes
        if (lastLiquidityState.liquidity > 10000 && liquidityDrop > 2000) {
          const dropPct = (liquidityDrop / lastLiquidityState.liquidity) * 100;
          
          if (dropPct > 30) {
            addAnomaly({
              marketId,
              question: market.question,
              type: "LIQUIDITY_DROP",
              severity: dropPct > 50 ? "HIGH" : "MEDIUM",
              dropPct: parseFloat(dropPct.toFixed(1)),
              detail: `Liquidity drained by ${dropPct.toFixed(1)}% ($${lastLiquidityState.liquidity.toLocaleString()} -> $${liquidity.toLocaleString()})`,
            });
          }
        }
      }
      liquidityHistoryRegistry.set(marketId, { timestamp: now, liquidity });

      // 4. DETAILED ORDERBOOK & TRADE SCANS (Conducted sequentially to stay within limits)
      if (i < detailedScanCount && market.yesTokenId) {
        try {
          // Fetch orderbook
          const book = await polymarketService.getOrderbook(market.yesTokenId);
          const bids = book.bids || [];
          const asks = book.asks || [];
          
          if (bids.length > 0 && asks.length > 0) {
            const top5Bids = bids.slice(0, 5);
            const top5Asks = asks.slice(0, 5);
            const bidDepth = top5Bids.reduce((acc, b) => acc + parseFloat(b.size) * parseFloat(b.price), 0);
            const askDepth = top5Asks.reduce((acc, a) => acc + parseFloat(a.size) * parseFloat(a.price), 0);
            
            // Baseline enforcement: depth must be at least 1000 USDC to qualify for imbalance
            if (bidDepth > 1000 && askDepth > 1000) {
              const imbalanceRatio = bidDepth / askDepth;
              if (imbalanceRatio > 3) {
                addAnomaly({
                  marketId,
                  question: market.question,
                  type: "BOOK_IMBALANCE",
                  severity: imbalanceRatio > 6 ? "HIGH" : "MEDIUM",
                  side: "BID_HEAVY",
                  detail: `Order book heavily skewed with bids (${imbalanceRatio.toFixed(1)}x asks depth)`,
                });
              } else if (imbalanceRatio < 0.33) {
                addAnomaly({
                  marketId,
                  question: market.question,
                  type: "BOOK_IMBALANCE",
                  severity: imbalanceRatio < 0.15 ? "HIGH" : "MEDIUM",
                  side: "ASK_HEAVY",
                  detail: `Order book heavily skewed with asks (${(1 / imbalanceRatio).toFixed(1)}x bids depth)`,
                });
              }
            }
          }

          // Fetch trades
          const trades = await polymarketService.getTrades(marketId, 100);
          for (const t of trades) {
            const size = parseFloat(t.size ?? 0);
            const price = parseFloat(t.price ?? 0.5);
            const value = size * price;

            if (value > 10000) {
              addAnomaly({
                marketId,
                question: market.question,
                type: "WHALE_TRADE",
                severity: value > 30000 ? "HIGH" : "MEDIUM",
                size: parseFloat(value.toFixed(0)),
                side: String(t.side).toUpperCase(),
                detail: `Whale trade detected: ${String(t.side).toUpperCase()} of $${value.toLocaleString()} USDC at $${price.toFixed(3)}`,
              });
            }
          }

          // Delay slightly between requests in detailed loop
          await new Promise((r) => setTimeout(r, 200));
        } catch (e) {
          console.warn(`[Anomaly Detector] Detailed scan failed for ${marketId}: ${e.message}`);
        }
      }
    }
  } catch (err) {
    console.error("[Anomaly Detector] Main run failed:", err);
  }
}

function startAnomalyDetector() {
  // Run immediately on start
  runAnomalyDetection();
  // Then run every 2 minutes
  setInterval(runAnomalyDetection, 2 * 60 * 1000);
}

module.exports = {
  startAnomalyDetector,
  getAnomalies,
};
