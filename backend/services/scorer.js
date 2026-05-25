const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// Helper to convert price to 0-100 scale if it is 0-1
const to100Scale = (p) => (p <= 1.01 ? p * 100 : p);

function scoreMarket({ market, priceHistory = [], trades = [], orderbook = { bids: [], asks: [] } }) {
  if (!market) {
    throw new Error("Market data is required for scoring");
  }

  const yesPrice = to100Scale(market.yesPrice);
  const noPrice = 100 - yesPrice;
  const now = Date.now();
  const history = Array.isArray(priceHistory) ? priceHistory : [];

  // ============================================================
  // FACTOR 1 — MOMENTUM (weight 0.20)
  // ============================================================
  let momentumScore = 0;
  let momentumLabel = "Price consolidating";
  let momentumDetail = "Insufficient price history to calculate momentum.";

  if (history.length >= 2) {
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    let price7dObj = history[0];
    let price1dObj = history[0];

    // Find entries closest to 7d ago and 1d ago
    let min7dDiff = Infinity;
    let min1dDiff = Infinity;

    for (const h of history) {
      const timestamp = h.t * 1000; // t is in seconds
      const diff7d = Math.abs(timestamp - sevenDaysAgo);
      if (diff7d < min7dDiff) {
        min7dDiff = diff7d;
        price7dObj = h;
      }
      const diff1d = Math.abs(timestamp - oneDayAgo);
      if (diff1d < min1dDiff) {
        min1dDiff = diff1d;
        price1dObj = h;
      }
    }

    const price7d = to100Scale(price7dObj.p);
    const price1d = to100Scale(price1dObj.p);

    const change7d = yesPrice - price7d;
    const change1d = yesPrice - price1d;
    const acceleration = change1d - change7d / 7;

    momentumScore = clamp(change7d * 0.6 + acceleration * 2, -10, 10);

    if (momentumScore > 6) {
      momentumLabel = "Strong accelerating uptrend";
      momentumDetail = `Bullish momentum has accelerated rapidly (+${change1d.toFixed(1)}% in 24h, +${change7d.toFixed(1)}% in 7d).`;
    } else if (momentumScore > 2) {
      momentumLabel = "Mild upward momentum";
      momentumDetail = `Steady buying pressure has driven the price up (+${change7d.toFixed(1)}% in 7d).`;
    } else if (momentumScore > -2) {
      momentumLabel = "Price consolidating";
      momentumDetail = `Price range is tight, showing stable consolidation (moved ${change7d.toFixed(1)}% in 7d).`;
    } else if (momentumScore > -6) {
      momentumLabel = "Mild downward pressure";
      momentumDetail = `Persistent selling has drifted the price lower (${change7d.toFixed(1)}% in 7d).`;
    } else {
      momentumLabel = "Strong sell-off";
      momentumDetail = `Aggressive bearish momentum has intensified (${change7d.toFixed(1)}% drop in 7d).`;
    }
  }

  // ============================================================
  // FACTOR 2 — VOLUME ANOMALY (weight 0.20)
  // ============================================================
  let volumeScore = 0;
  let volumeLabel = "Normal volume";
  let volumeDetail = "Typical activity observed.";
  let isVolumeAnomaly = false;

  const liquidity = parseFloat(market.liquidity ?? 0);
  const volume24hr = parseFloat(market.volume24hr ?? 0);
  const totalVolume = parseFloat(market.totalVolume ?? 0);

  // Compute 14d average volume deterministically
  const avg14dVolume = totalVolume > volume24hr ? (totalVolume - volume24hr) / 14 : volume24hr * 0.9;
  const ratio = avg14dVolume > 0 ? volume24hr / avg14dVolume : 1.0;

  if (liquidity < 2000) {
    volumeScore = -8;
    volumeLabel = "Dangerously illiquid";
    volumeDetail = `Liquidity is critically low at $${liquidity.toFixed(0)} USDC, making trades highly risky.`;
  } else {
    if (ratio > 5) {
      volumeScore = 10;
      volumeLabel = "Extreme volume spike — major event signal";
      volumeDetail = `24h volume is ${ratio.toFixed(1)}x the 14-day average, signaling high-conviction institutional interest.`;
      isVolumeAnomaly = true;
    } else if (ratio > 3) {
      volumeScore = 7;
      volumeLabel = "Large volume spike — unusual activity";
      volumeDetail = `24h volume is ${ratio.toFixed(1)}x average, highlighting an active and highly traded breakout.`;
      isVolumeAnomaly = true;
    } else if (ratio > 2) {
      volumeScore = 4;
      volumeLabel = "Above average volume";
      volumeDetail = `Volume is elevated at ${ratio.toFixed(1)}x normal levels.`;
    } else if (ratio > 1.2) {
      volumeScore = 1;
      volumeLabel = "Slightly elevated";
      volumeDetail = `Slight uptick in trade activity (${ratio.toFixed(1)}x average).`;
    } else if (ratio > 0.6) {
      volumeScore = 0;
      volumeLabel = "Normal volume";
      volumeDetail = `Standard market activity (${ratio.toFixed(1)}x average).`;
    } else {
      volumeScore = -5;
      volumeLabel = "Volume collapsing — market dying";
      volumeDetail = `Trading interest has evaporated (${ratio.toFixed(1)}x average), indicating a stagnant market.`;
    }

    if (liquidity < 10000) {
      volumeScore = Math.min(volumeScore, -4);
      volumeLabel = "Low liquidity cap";
      volumeDetail = `Liquidity is thin ($${liquidity.toFixed(0)}), capping potential score due to slippage risks.`;
    }
  }

  // ============================================================
  // FACTOR 3 — ORDER FLOW PRESSURE (weight 0.20)
  // ============================================================
  let orderFlowScore = 0;
  let orderFlowLabel = "Balanced flow";
  let orderFlowDetail = "Buys and sells are evenly matched.";

  const recentTrades = Array.isArray(trades) ? trades.slice(0, 100) : [];
  let buyPct = 50;

  if (recentTrades.length >= 5) {
    const buys = recentTrades.filter((t) => String(t.side).toUpperCase() === "BUY");
    buyPct = (buys.length / recentTrades.length) * 100;

    let totalBuyUSDC = 0;
    let totalSellUSDC = 0;
    let buyCount = 0;
    let sellCount = 0;

    for (const t of recentTrades) {
      const price = parseFloat(t.price ?? 0.5);
      const size = parseFloat(t.size ?? 0);
      const usdc = price * size;

      if (String(t.side).toUpperCase() === "BUY") {
        totalBuyUSDC += usdc;
        buyCount++;
      } else {
        totalSellUSDC += usdc;
        sellCount++;
      }
    }

    const avgBuySize = buyCount > 0 ? totalBuyUSDC / buyCount : 0;
    const avgSellSize = sellCount > 0 ? totalSellUSDC / sellCount : 0;
    const sizeRatio = avgSellSize > 0 ? avgBuySize / avgSellSize : 1.0;

    let baseScore = (buyPct - 50) * 0.22;
    baseScore = clamp(baseScore, -10, 10);

    if (sizeRatio > 1.5) baseScore += 1.5;
    if (sizeRatio < 0.7) baseScore -= 1.5;

    orderFlowScore = clamp(baseScore, -10, 10);

    if (buyPct > 70 && sizeRatio > 1.2) {
      orderFlowLabel = "Heavy institutional buying";
      orderFlowDetail = `${buyPct.toFixed(0)}% of trades are buys, with larger average trade sizes indicating strong whale accumulation.`;
    } else if (buyPct > 70) {
      orderFlowLabel = "Strong retail buy pressure";
      orderFlowDetail = `${buyPct.toFixed(0)}% buy frequency points to robust retail demand.`;
    } else if (buyPct > 55) {
      orderFlowLabel = "Mild buy-side lean";
      orderFlowDetail = `Slight accumulation bias (${buyPct.toFixed(0)}% buys).`;
    } else if (buyPct > 45) {
      orderFlowLabel = "Balanced flow";
      orderFlowDetail = `Equilibrium reached between buy and sell transactions (${buyPct.toFixed(0)}% buys).`;
    } else if (buyPct > 30) {
      orderFlowLabel = "Mild sell pressure";
      orderFlowDetail = `Slight distribution bias with ${buyPct.toFixed(0)}% buys.`;
    } else {
      orderFlowLabel = "Heavy sell-side pressure";
      orderFlowDetail = `Aggressive selling dominated flow (only ${buyPct.toFixed(0)}% buys) with large average transaction sizes.`;
    }
  }

  // ============================================================
  // FACTOR 4 — PROBABILITY EDGE (weight 0.20)
  // ============================================================
  let edgeScore = 0;
  let edgeLabel = "Coin flip, skip";
  let edgeDetail = "Market probability sits at a neutral equilibrium.";

  if (yesPrice >= 20 && yesPrice <= 40) {
    edgeScore = 6;
    edgeLabel = "Clear lean, tradeable edge";
    edgeDetail = `Price range (${yesPrice.toFixed(0)}%) offers a highly asymmetric entry for NO.`;
  } else if (yesPrice >= 60 && yesPrice <= 80) {
    edgeScore = 6;
    edgeLabel = "Clear lean, tradeable edge";
    edgeDetail = `Price range (${yesPrice.toFixed(0)}%) offers a highly asymmetric entry for YES.`;
  } else if (yesPrice > 40 && yesPrice < 60) {
    edgeScore = 0;
    edgeLabel = "Coin flip, skip";
    edgeDetail = `At ${yesPrice.toFixed(0)}%, this represents a highly speculative coin flip.`;
  } else if ((yesPrice >= 10 && yesPrice < 20) || (yesPrice > 80 && yesPrice <= 90)) {
    edgeScore = 3;
    edgeLabel = "Strong but risky";
    edgeDetail = `Price is highly polarized (${yesPrice.toFixed(0)}%), offering high payout potential but with elevated volatility.`;
  } else if (yesPrice < 10 || yesPrice > 90) {
    edgeScore = -3;
    edgeLabel = "Tail risk, avoid";
    edgeDetail = `Extremely low payout leverage (${yesPrice.toFixed(0)}%) doesn't justify taking tail resolution risks.`;
  }

  // Check 3+ days stability or 50% cross in last 24h
  if (history.length >= 3) {
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

    const history24h = history.filter((h) => h.t * 1000 >= oneDayAgo);
    const history3d = history.filter((h) => h.t * 1000 >= threeDaysAgo);

    // crossed 50% in last 24h
    let crossed = false;
    if (history24h.length >= 2) {
      const first24h = to100Scale(history24h[0].p);
      const last24h = to100Scale(history24h[history24h.length - 1].p);
      if ((first24h < 50 && last24h >= 50) || (first24h >= 50 && last24h < 50)) {
        crossed = true;
      }
    }

    if (crossed) {
      edgeScore += 3;
      edgeLabel = "Major regime change signal";
      edgeDetail += " The price has crossed the critical 50% threshold in the last 24 hours, indicating a narrative shift.";
    } else {
      // Stable in same range class for 3+ days
      let stable = true;
      const getRangeClass = (p) => {
        if (p >= 20 && p <= 40) return "lean";
        if (p >= 60 && p <= 80) return "lean";
        if (p > 40 && p < 60) return "neutral";
        if ((p >= 10 && p < 20) || (p > 80 && p <= 90)) return "polar";
        return "tail";
      };

      const baseClass = getRangeClass(yesPrice);
      for (const h of history3d) {
        if (getRangeClass(to100Scale(h.p)) !== baseClass) {
          stable = false;
          break;
        }
      }

      if (stable && history3d.length > 0) {
        edgeScore += 2;
        edgeDetail += " Price has remained remarkably consolidated in this range for over 3 days, proving high structural support.";
      }
    }
  }

  edgeScore = clamp(edgeScore, -10, 10);

  // ============================================================
  // FACTOR 5 — ORDERBOOK HEALTH (weight 0.10)
  // ============================================================
  let orderbookScore = 0;
  let orderbookLabel = "Wide spread";
  let orderbookDetail = "Order book is thin or inactive.";

  const bids = Array.isArray(orderbook?.bids) ? orderbook.bids : [];
  const asks = Array.isArray(orderbook?.asks) ? orderbook.asks : [];

  if (bids.length > 0 && asks.length > 0) {
    const bestBid = parseFloat(bids[0].price);
    const bestAsk = parseFloat(asks[0].price);
    const spread = bestAsk - bestBid;
    const spreadPct = spread * 100;

    const top5Bids = bids.slice(0, 5);
    const top5Asks = asks.slice(0, 5);

    const bidDepth = top5Bids.reduce((acc, b) => acc + parseFloat(b.size) * parseFloat(b.price), 0);
    const askDepth = top5Asks.reduce((acc, a) => acc + parseFloat(a.size) * parseFloat(a.price), 0);
    const imbalance = bidDepth + askDepth > 0 ? (bidDepth - askDepth) / (bidDepth + askDepth) : 0;

    if (spreadPct < 1 && Math.abs(imbalance) < 0.2) {
      orderbookScore = 6;
      orderbookLabel = "Tight spread, balanced book";
      orderbookDetail = `Spread is extremely tight at ${spreadPct.toFixed(2)}%, backed by robust and highly balanced market maker bids ($${bidDepth.toFixed(0)}) and asks ($${askDepth.toFixed(0)}).`;
    } else if (spreadPct < 2) {
      orderbookScore = 3;
      orderbookLabel = "Reasonable spread";
      orderbookDetail = `Moderate bid/ask spread of ${spreadPct.toFixed(2)}% allows clean execution.`;
    } else if (spreadPct < 5) {
      orderbookScore = 0;
      orderbookLabel = "Wide spread";
      orderbookDetail = `Higher spreads (${spreadPct.toFixed(2)}%) will lead to execution slippage.`;
    } else {
      orderbookScore = -5;
      orderbookLabel = "Very wide spread, illiquid";
      orderbookDetail = `Prohibitive spreads (${spreadPct.toFixed(2)}%) represent extreme liquidity risks.`;
    }

    if (imbalance > 0.3) {
      orderbookScore += 2;
      orderbookLabel = "Bid-heavy wall support";
      orderbookDetail += ` Robust buyer support wall is building, with bids outweighing asks by ${(imbalance * 100).toFixed(0)}%.`;
    } else if (imbalance < -0.3) {
      orderbookScore -= 2;
      orderbookLabel = "Ask-heavy resistance wall";
      orderbookDetail += ` Heavy sell walls are caping upside, asks outweighing bids by ${Math.abs(imbalance * 100).toFixed(0)}%.`;
    }
  }

  orderbookScore = clamp(orderbookScore, -10, 10);

  // ============================================================
  // FACTOR 6 — TIME VALUE (weight 0.10)
  // ============================================================
  let timeScore = 0;
  let timeLabel = "Neutral runway";
  let timeDetail = "Resolution runway is average.";

  const daysLeft = parseInt(market.daysLeft ?? 0);

  if (daysLeft < 1) {
    timeScore = -10;
    timeLabel = "Do not enter — expires today";
    timeDetail = "Resolution is set to occur within the next 24 hours, making active speculation highly dangerous.";
  } else if (daysLeft >= 1 && daysLeft <= 2) {
    timeScore = -6;
    timeLabel = "Too close to resolution";
    timeDetail = "Resolution within 48 hours offers extremely compressed runway to manage position risk.";
  } else if (daysLeft >= 3 && daysLeft <= 7) {
    timeScore = 1;
    timeLabel = "Short window — only high conviction";
    timeDetail = "Short timeframe (3-7 days) demands rapid thesis realization; only deploy if high conviction triggers exist.";
  } else if (daysLeft >= 8 && daysLeft <= 21) {
    timeScore = 4;
    timeLabel = "Optimal window";
    timeDetail = "Optimal trading window (8-21 days) matches the sweet spot for narrative growth without capital lockup.";
  } else if (daysLeft >= 22 && daysLeft <= 60) {
    timeScore = 3;
    timeLabel = "Good runway";
    timeDetail = "Provides a healthy 22-60 days timeline, giving robust room for long-term thesis structures to settle.";
  } else if (daysLeft >= 61 && daysLeft <= 180) {
    timeScore = 1;
    timeLabel = "Long horizon — monitor";
    timeDetail = "Far-dated (61-180 days) requires sustained thesis monitoring; capital velocity will be reduced.";
  } else if (daysLeft > 180) {
    timeScore = -2;
    timeLabel = "Too far out — capital locked";
    timeDetail = "Very far-dated resolution (>180 days) will severely trap trading capital for extended durations.";
  }

  // ============================================================
  // FINAL RECOMMENDATION SCORING
  // ============================================================
  const weighted =
    momentumScore * 0.20 +
    volumeScore * 0.20 +
    orderFlowScore * 0.20 +
    edgeScore * 0.20 +
    orderbookScore * 0.10 +
    timeScore * 0.10;

  const finalScore = parseFloat(weighted.toFixed(1));

  let recommendation = { rec: "SKIP", color: "gray" };
  if (finalScore >= 5) recommendation = { rec: "STRONG YES", color: "emerald" };
  else if (finalScore >= 3) recommendation = { rec: "LEAN YES", color: "green" };
  else if (finalScore >= 1) recommendation = { rec: "WEAK YES", color: "lime" };
  else if (finalScore > -1) recommendation = { rec: "SKIP", color: "gray" };
  else if (finalScore > -3) recommendation = { rec: "WEAK NO", color: "orange" };
  else if (finalScore > -5) recommendation = { rec: "LEAN NO", color: "red" };
  else recommendation = { rec: "STRONG NO", color: "rose" };

  // ============================================================
  // CONFIDENCE CALCULATIONS
  // ============================================================
  let confidencePoints = 0;
  if (history.length > 100) confidencePoints += 1;
  if (recentTrades.length >= 50) confidencePoints += 1;
  if (liquidity > 20000) confidencePoints += 1;
  if (daysLeft >= 5 && daysLeft <= 30) confidencePoints += 1;
  if (volume24hr > 10000) confidencePoints += 1;

  const confidenceScore = confidencePoints / 5;
  let confidenceLabel = "LOW";
  if (confidenceScore >= 0.7) confidenceLabel = "HIGH";
  else if (confidenceScore >= 0.4) confidenceLabel = "MEDIUM";

  // ============================================================
  // AUTO-GENERATED REASONING
  // ============================================================
  const reasoning = `${momentumLabel}. ${volumeLabel}. ${orderFlowLabel}. At ${yesPrice.toFixed(0)}% probability with ${daysLeft} days remaining, ${timeLabel}. Overall signal is ${recommendation.rec} with ${confidenceLabel} confidence based on ${(confidenceScore * 100).toFixed(0)}% data completeness.`;

  // ============================================================
  // COUNTER-ARGUMENTS
  // ============================================================
  const counterArguments = [];
  const recSide = finalScore >= 1 ? "YES" : finalScore <= -1 ? "NO" : "SKIP";

  if (recSide === "YES" || recSide === "SKIP") {
    // Generate bear cases
    if (momentumScore < 0 && volumeScore > 0) {
      counterArguments.push("Price move has technical downward drift despite active participation.");
    } else if (momentumScore > 0 && volumeScore < 0) {
      counterArguments.push("Price move may lack structural conviction due to low supportive volume.");
    }
    if (daysLeft < 7) {
      counterArguments.push("Insufficient time for thesis to play out before resolution deadline.");
    }
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = parseFloat(bids[0].price);
      const bestAsk = parseFloat(asks[0].price);
      if (bestAsk - bestBid > 0.03) {
        counterArguments.push("Wide bid/ask spread will eat heavily into returns upon exit.");
      }
    }
    if (liquidity < 20000) {
      counterArguments.push("Low liquidity increases extreme slippage risks for larger block transactions.");
    }
    if (buyPct > 70) {
      counterArguments.push("Crowded retail buying creates high systemic risk of a rapid, contrarian sell-off.");
    }
    if (counterArguments.length < 2) {
      counterArguments.push("Macro news flow or external events could abruptly invalidate current market consensus.");
      counterArguments.push("Consensus pricing is already highly efficient, leaving tiny margins for additional alpha.");
    }
  } else {
    // Generate bull cases (NO-side lean counter-arguments)
    if (momentumScore > 0 && volumeScore > 0) {
      counterArguments.push("Strong upward price support backed by active buying volume poses heavy risks for shorting YES.");
    } else if (momentumScore < 0 && volumeScore < 0) {
      counterArguments.push("Downward price trend could suddenly bounce due to low volume exhausted sellers.");
    }
    if (daysLeft < 7) {
      counterArguments.push("Time is running out for the negative narrative to structurally break the existing YES support.");
    }
    if (liquidity < 20000) {
      counterArguments.push("Extremely thin books create high risk of violent, low-volume upward price spikes.");
    }
    if (buyPct < 30) {
      counterArguments.push("Oversold retail sentiment signals a crowded short trade that is highly vulnerable to a short squeeze.");
    }
    if (counterArguments.length < 2) {
      counterArguments.push("External developments could trigger an immediate positive narrative change.");
      counterArguments.push("Market has priced in an overly bearish scenario, creating high risk of a technical mean-reversion.");
    }
  }

  // ============================================================
  // POSITION SIZING SUGGESTION (Kelly Criterion)
  // ============================================================
  const edge = Math.abs(yesPrice / 100 - 0.5);
  const odds = 1 / (yesPrice / 100 || 0.01);
  const kellyPct = clamp((edge / odds) * 100, 0, 25);
  const halfKelly = kellyPct / 2;

  const positionSizing = {
    suggestedSizePct: parseFloat(halfKelly.toFixed(1)),
    maxSizePct: parseFloat(kellyPct.toFixed(1)),
    note: "Half-Kelly sizing. Mathematical suggestion only.",
  };

  // ============================================================
  // INVALIDATING CONDITIONS
  // ============================================================
  const invalidatingConditions = [];
  const cat = String(market.category).toLowerCase();

  if (cat.includes("politics") || cat.includes("election")) {
    invalidatingConditions.push("A major candidate drops out or officially suspends campaign operations.");
    invalidatingConditions.push("Key aggregate polling registers a sudden shift exceeding 10 points.");
    invalidatingConditions.push("A decisive court ruling changes ballot eligibility or rules.");
  } else if (cat.includes("crypto") || cat.includes("finance") || cat.includes("economics")) {
    invalidatingConditions.push("Major regulatory crackdown announcement or unexpected executive order.");
    invalidatingConditions.push("A systemic crypto exchange hack, protocol failure, or stablecoin depeg.");
    invalidatingConditions.push("Unexpected central bank interest rate decisions or inflation index spikes.");
  } else if (cat.includes("sports")) {
    invalidatingConditions.push("Key player injury report or sudden team lineup suspension.");
    invalidatingConditions.push("A referee controversy or official sporting league ruling changes outcome.");
  } else {
    invalidatingConditions.push("Unforeseen black swan news event invalidates the underlying market thesis.");
    invalidatingConditions.push("Major whale participant exits the market, triggering a massive price decoupling.");
  }

  return {
    finalScore,
    recommendation: recommendation.rec,
    recommendationColor: recommendation.color,
    confidence: confidenceLabel,
    confidenceScore,
    reasoning,
    counterArguments: counterArguments.slice(0, 2),
    invalidatingConditions,
    positionSizing,
    factors: {
      momentum: { score: momentumScore, label: momentumLabel, detail: momentumDetail, weight: "20%" },
      volume: { score: volumeScore, label: volumeLabel, detail: volumeDetail, weight: "20%" },
      orderFlow: { score: orderFlowScore, label: orderFlowLabel, detail: orderFlowDetail, weight: "20%" },
      edge: { score: edgeScore, label: edgeLabel, detail: edgeDetail, weight: "20%" },
      orderbook: { score: orderbookScore, label: orderbookLabel, detail: orderbookDetail, weight: "10%" },
      timeValue: { score: timeScore, label: timeLabel, detail: timeDetail, weight: "10%" },
    },
    dataQuality: {
      hasHistory: history.length > 0,
      hasTrades: recentTrades.length > 0,
      hasOrderbook: bids.length > 0 && asks.length > 0,
      daysOfHistory: Math.ceil(history.length),
    },
  };
}

module.exports = {
  scoreMarket,
};
