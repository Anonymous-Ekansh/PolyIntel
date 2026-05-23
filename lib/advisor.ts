// ============================================================
// Smart Bet Advisor — Rule-based scoring engine
// No AI APIs needed — 100% deterministic
// ============================================================

export interface AdvisorScoreComponent {
  score: number;
  label: string;
  detail: string;
}

export interface AdvisorResult {
  recommendation: "LEAN_YES" | "LEAN_NO" | "SKIP";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  finalScore: number;
  components: {
    momentum: AdvisorScoreComponent;
    volume: AdvisorScoreComponent;
    orderFlow: AdvisorScoreComponent;
    timeValue: AdvisorScoreComponent;
  };
  summary: string;
}

interface PricePoint {
  t: number;
  p: number;
}

interface TradeEntry {
  side: string;
  sizeUSDC?: number;
  size?: number;
  price?: number;
}

interface MarketData {
  currentYesPrice: number;
  priceHistory7d: PricePoint[];       // YES price points over 7 days
  volume24h: number;
  volumeHistory7d: number[];          // daily volume values for 7 days
  liquidity: number;
  recentTrades: TradeEntry[];         // last 50 trades
  endDate: string;                    // ISO date string
}

// ============================================================
// 1. MOMENTUM SCORE (weight: 30%)
// ============================================================
function computeMomentumScore(data: MarketData): AdvisorScoreComponent {
  const current = data.currentYesPrice;
  const history = data.priceHistory7d;

  if (history.length < 2) {
    return { score: 0, label: "Insufficient data", detail: "Not enough price history to measure momentum." };
  }

  const oldestPrice = history[0].p;
  const priceChange = current - oldestPrice;
  const pctChange = oldestPrice > 0 ? (priceChange / oldestPrice) * 100 : 0;

  let score: number;
  let label: string;
  let detail: string;

  if (pctChange > 10) {
    score = 8 + Math.min((pctChange - 10) / 10, 1) * 2;
    label = "Strong upward momentum";
    detail = `YES price surged +${pctChange.toFixed(1)}% over 7 days — strong bullish signal.`;
  } else if (pctChange > 5) {
    score = 4 + ((pctChange - 5) / 5) * 3;
    label = "Moderate upward momentum";
    detail = `YES price up +${pctChange.toFixed(1)}% over 7 days — steady buying pressure.`;
  } else if (pctChange >= -5) {
    score = (pctChange / 5) * 3;
    label = "Stable price";
    detail = `YES price moved ${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}% over 7 days — no strong directional bias.`;
  } else if (pctChange >= -10) {
    score = -4 + ((pctChange + 5) / 5) * 3;
    label = "Moderate downward momentum";
    detail = `YES price dropped ${pctChange.toFixed(1)}% over 7 days — selling pressure building.`;
  } else {
    score = -8 - Math.min((Math.abs(pctChange) - 10) / 10, 1) * 2;
    label = "Strong downward momentum";
    detail = `YES price plunged ${pctChange.toFixed(1)}% over 7 days — heavy bearish signal.`;
  }

  return { score: clampScore(score), label, detail };
}

// ============================================================
// 2. VOLUME TREND SCORE (weight: 25%)
// ============================================================
function computeVolumeTrendScore(data: MarketData): AdvisorScoreComponent {
  const { volume24h, volumeHistory7d, liquidity } = data;

  if (liquidity < 1000) {
    return {
      score: -5,
      label: "Illiquid market",
      detail: `Total liquidity is only $${liquidity.toFixed(0)} USDC — too thin to trade safely.`,
    };
  }

  const validDays = volumeHistory7d.filter(v => v > 0);
  if (validDays.length === 0) {
    return { score: 0, label: "No volume history", detail: "Cannot compare volume trend without historical data." };
  }

  const avgDailyVolume = validDays.reduce((a, b) => a + b, 0) / validDays.length;
  const volumeRatio = avgDailyVolume > 0 ? volume24h / avgDailyVolume : 0;

  let score: number;
  let label: string;
  let detail: string;

  if (volumeRatio > 3) {
    score = 8;
    label = "Unusual volume spike";
    detail = `24h volume is ${volumeRatio.toFixed(1)}x the 7-day average — smart money signal.`;
  } else if (volumeRatio > 1.5) {
    score = 4;
    label = "Above-average volume";
    detail = `24h volume is ${volumeRatio.toFixed(1)}x average — elevated interest.`;
  } else if (volumeRatio >= 0.8) {
    score = 0;
    label = "Normal volume";
    detail = `24h volume is ${volumeRatio.toFixed(1)}x average — typical activity.`;
  } else {
    score = -3;
    label = "Low volume";
    detail = `24h volume is only ${volumeRatio.toFixed(1)}x average — interest drying up.`;
  }

  return { score: clampScore(score), label, detail };
}

// ============================================================
// 3. ORDER FLOW SCORE (weight: 25%)
// ============================================================
function computeOrderFlowScore(data: MarketData): AdvisorScoreComponent {
  const trades = data.recentTrades;

  if (trades.length < 5) {
    return { score: 0, label: "Insufficient trades", detail: "Not enough recent trades to analyze order flow." };
  }

  const buyCount = trades.filter(t => t.side === "BUY").length;
  const netBuyPercent = (buyCount / trades.length) * 100;

  let score: number;
  let label: string;
  let detail: string;

  if (netBuyPercent > 70) {
    score = 8;
    label = "Heavy buy-side pressure";
    detail = `${netBuyPercent.toFixed(0)}% of recent trades are buys — strong accumulation.`;
  } else if (netBuyPercent > 60) {
    score = 4;
    label = "Mostly buy-side";
    detail = `${netBuyPercent.toFixed(0)}% buys — moderate accumulation bias.`;
  } else if (netBuyPercent >= 40) {
    score = 0;
    label = "Balanced flow";
    detail = `${netBuyPercent.toFixed(0)}% buys / ${(100 - netBuyPercent).toFixed(0)}% sells — no clear directional bias.`;
  } else if (netBuyPercent >= 30) {
    score = -4;
    label = "Mostly sell-side";
    detail = `Only ${netBuyPercent.toFixed(0)}% buys — distribution underway.`;
  } else {
    score = -8;
    label = "Heavy sell-side pressure";
    detail = `Only ${netBuyPercent.toFixed(0)}% buys — aggressive selling.`;
  }

  return { score: clampScore(score), label, detail };
}

// ============================================================
// 4. TIME VALUE SCORE (weight: 20%)
// ============================================================
function computeTimeValueScore(data: MarketData): AdvisorScoreComponent {
  const { endDate, currentYesPrice } = data;

  if (!endDate) {
    return { score: 0, label: "No end date", detail: "This market has no resolution date — time value is neutral." };
  }

  const now = Date.now();
  const end = new Date(endDate).getTime();
  const daysLeft = (end - now) / (1000 * 60 * 60 * 24);

  let score: number;
  let label: string;
  let detail: string;

  if (daysLeft < 1) {
    score = -10;
    label = "Expiring imminently";
    detail = `Less than 1 day until resolution — do not enter new positions.`;
  } else if (daysLeft <= 3) {
    const isUncertain = currentYesPrice >= 0.3 && currentYesPrice <= 0.7;
    if (isUncertain) {
      score = -6;
      label = "High risk — close to expiry";
      detail = `${daysLeft.toFixed(0)} days left with ${(currentYesPrice * 100).toFixed(0)}% probability — too uncertain, too close.`;
    } else {
      score = -2;
      label = "Near expiry but decisive";
      detail = `${daysLeft.toFixed(0)} days left but probability at ${(currentYesPrice * 100).toFixed(0)}% — outcome likely decided.`;
    }
  } else if (daysLeft <= 14) {
    score = 2;
    label = "Good timing window";
    detail = `${daysLeft.toFixed(0)} days until resolution — sweet spot for momentum plays.`;
  } else if (daysLeft <= 60) {
    score = 4;
    label = "Ample time";
    detail = `${daysLeft.toFixed(0)} days left — enough time for a thesis to play out.`;
  } else {
    score = 0;
    label = "Far-dated";
    detail = `${daysLeft.toFixed(0)} days until resolution — too far out for high conviction.`;
  }

  return { score: clampScore(score), label, detail };
}

// ============================================================
// Utility
// ============================================================
function clampScore(score: number): number {
  return Math.max(-10, Math.min(10, Number(score.toFixed(1))));
}

// ============================================================
// Main scoring function
// ============================================================
export function scoreMarket(data: MarketData): AdvisorResult {
  const momentum = computeMomentumScore(data);
  const volume = computeVolumeTrendScore(data);
  const orderFlow = computeOrderFlowScore(data);
  const timeValue = computeTimeValueScore(data);

  const finalScore = clampScore(
    momentum.score * 0.3 +
    volume.score * 0.25 +
    orderFlow.score * 0.25 +
    timeValue.score * 0.2
  );

  let recommendation: AdvisorResult["recommendation"];
  let confidence: AdvisorResult["confidence"];

  if (finalScore >= 4) {
    recommendation = "LEAN_YES";
    confidence = finalScore > 6 ? "HIGH" : "MEDIUM";
  } else if (finalScore <= -4) {
    recommendation = "LEAN_NO";
    confidence = finalScore < -6 ? "HIGH" : "MEDIUM";
  } else {
    recommendation = "SKIP";
    confidence = "LOW";
  }

  // Build summary from component details
  const summaryParts = [
    momentum.detail,
    volume.detail,
    orderFlow.detail,
    timeValue.detail,
  ];
  const actionPhrase =
    recommendation === "LEAN_YES" ? "Lean YES." :
    recommendation === "LEAN_NO" ? "Lean NO." :
    "No clear edge — skip.";

  const summary = `${summaryParts.join(" ")} ${actionPhrase}`;

  return {
    recommendation,
    confidence,
    finalScore,
    components: { momentum, volume, orderFlow, timeValue },
    summary,
  };
}
