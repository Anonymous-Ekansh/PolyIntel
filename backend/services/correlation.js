const polymarketService = require("./polymarket");

let correlatedPairs = [];
let divergenceList = [];

// Compute Pearson correlation coefficient
function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 5) return 0; // Require at least 5 common ticks

  let sumX = 0, sumY = 0, sumXY = 0;
  let sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (den === 0) return 0;
  return num / den;
}

// Align two time series by date (rounding timestamp to day)
function alignTimeSeries(seriesA, seriesB) {
  const getDayKey = (t) => new Date(t * 1000).toDateString();
  
  const mapA = new Map();
  for (const tick of seriesA) {
    mapA.set(getDayKey(tick.t), tick.p);
  }

  const alignedX = [];
  const alignedY = [];

  // Align dates backwards from now
  for (const tick of seriesB) {
    const key = getDayKey(tick.t);
    if (mapA.has(key)) {
      alignedX.push(mapA.get(key));
      alignedY.push(tick.p);
    }
  }

  return { x: alignedX, y: alignedY };
}

async function runCorrelationAnalysis() {
  console.log("[Correlation Analyzer] Running calculations on top markets...");
  try {
    const markets = await polymarketService.getMarkets(25, 0); // Analyze top 25 markets
    const histories = new Map();

    // Fetch time series daily candles sequentially to stay within limits
    for (const m of markets) {
      if (m.yesTokenId) {
        try {
          const ts = await polymarketService.getTimeSeries(m.yesTokenId);
          if (ts?.history && ts.history.length >= 5) {
            histories.set(m.conditionId, {
              market: m,
              history: ts.history,
            });
          }
          await new Promise((r) => setTimeout(r, 200)); // Sleep 200ms
        } catch (e) {
          console.warn(`[Correlation Analyzer] Time series failed for ${m.conditionId}: ${e.message}`);
        }
      }
    }

    const pairs = [];
    const divergences = [];
    const historyEntries = Array.from(histories.entries());

    // Pairwise comparison
    for (let i = 0; i < historyEntries.length; i++) {
      const [idA, dataA] = historyEntries[i];
      for (let j = i + 1; j < historyEntries.length; j++) {
        const [idB, dataB] = historyEntries[j];

        const { x, y } = alignTimeSeries(dataA.history, dataB.history);
        const r = pearsonCorrelation(x, y);
        const absR = Math.abs(r);

        if (absR > 0.7) {
          const pair = {
            marketA: {
              conditionId: idA,
              question: dataA.market.question,
              yesPrice: dataA.market.yesPrice,
              oneDayPriceChange: dataA.market.oneDayPriceChange,
            },
            marketB: {
              conditionId: idB,
              question: dataB.market.question,
              yesPrice: dataB.market.yesPrice,
              oneDayPriceChange: dataB.market.oneDayPriceChange,
            },
            correlation: parseFloat(r.toFixed(3)),
          };
          pairs.push(pair);

          // 5. DIVERGENCES DETECTION
          // If correlation > 0.8 but they diverged by > 5% in the last 24h
          const changeDiff = dataA.market.oneDayPriceChange - dataB.market.oneDayPriceChange;
          const absDiff = Math.abs(changeDiff);
          if (r > 0.8 && absDiff > 5) {
            divergences.push({
              ...pair,
              divergencePct: parseFloat(absDiff.toFixed(1)),
              changeDiff: parseFloat(changeDiff.toFixed(1)),
              detail: `DIVERGENCE: Strong historic correlation (${r.toFixed(2)}) broken. Market A moved ${dataA.market.oneDayPriceChange > 0 ? "+" : ""}${dataA.market.oneDayPriceChange.toFixed(1)}% vs Market B ${dataB.market.oneDayPriceChange > 0 ? "+" : ""}${dataB.market.oneDayPriceChange.toFixed(1)}% in 24h (delta ${absDiff.toFixed(1)}%).`,
            });
          }
        }
      }
    }

    correlatedPairs = pairs;
    divergenceList = divergences;
    console.log(`[Correlation Analyzer] Completed. Stored ${correlatedPairs.length} pairs and ${divergenceList.length} divergences.`);
  } catch (err) {
    console.error("[Correlation Analyzer] Main run failed:", err);
  }
}

function findRelatedMarkets(conditionId) {
  return correlatedPairs
    .filter((p) => p.marketA.conditionId === conditionId || p.marketB.conditionId === conditionId)
    .map((p) => {
      const isA = p.marketA.conditionId === conditionId;
      return {
        market: isA ? p.marketB : p.marketA,
        correlation: p.correlation,
      };
    })
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 5);
}

function getCorrelations() {
  return correlatedPairs;
}

function getDivergences() {
  return divergenceList;
}

function startCorrelationAnalyzer() {
  runCorrelationAnalysis();
  // Run every 10 minutes
  setInterval(runCorrelationAnalysis, 10 * 60 * 1000);
}

module.exports = {
  startCorrelationAnalyzer,
  findRelatedMarkets,
  getCorrelations,
  getDivergences,
};
