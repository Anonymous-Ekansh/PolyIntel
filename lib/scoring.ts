// ============================================================
// Market Scoring — 4-factor scoring system
// ============================================================

import { ScoredMarket, RawMarket, PricePoint } from '@/types';
import { formatDistanceToNow } from 'date-fns';

/**
 * Easy Win Score (weight: 30%)
 * Markets with price < 0.12 or > 0.88 get high scores (near-certain outcomes)
 */
export function computeEasyWinScore(yesPrice: number): number {
  if (yesPrice <= 0.12) return (1 - yesPrice) * 100;
  if (yesPrice >= 0.88) return yesPrice * 100;
  return 0;
}

/**
 * Volume Score (weight: 25%)
 * Log-scaled relative to max volume across all markets
 */
export function computeVolumeScore(volume: number, maxVolume: number): number {
  if (maxVolume <= 0 || volume <= 0) return 0;
  return (Math.log10(volume + 1) / Math.log10(maxVolume + 1)) * 100;
}

/**
 * Volatility Score (weight: 25%)
 * Standard deviation of recent prices, normalized to 0–100
 */
export function computeVolatilityScore(prices: number[]): number {
  if (prices.length < 2) return 0;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  return Math.min((stdDev / 0.15) * 100, 100);
}

/**
 * Mispricing Score (weight: 20%)
 * How much the current price differs from order book midpoint
 */
export function computeMispricingScore(yesPrice: number, bestBid: number, bestAsk: number): number {
  if (bestBid <= 0 || bestAsk <= 0) return 0;
  const midpoint = (bestBid + bestAsk) / 2;
  if (midpoint <= 0) return 0;
  const mispricing = Math.abs(yesPrice - midpoint) / midpoint;
  return Math.min(mispricing * 500, 100);
}

/**
 * Compute overall score from 4 factors
 */
export function computeOverallScore(
  easyWin: number,
  volume: number,
  volatility: number,
  mispricing: number
): number {
  return easyWin * 0.30 + volume * 0.25 + volatility * 0.25 + mispricing * 0.20;
}

/**
 * Parse raw market data into a ScoredMarket with initial scores
 */
export function parseRawMarket(raw: RawMarket, maxVolume: number): ScoredMarket {
  const parseList = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  let yesPrice = 0.5;
  let noPrice = 0.5;

  try {
    const prices = parseList(raw.outcomePrices);
    if (prices.length >= 2) {
      yesPrice = parseFloat(prices[0]) || 0.5;
      noPrice = parseFloat(prices[1]) || 0.5;
    }
  } catch { /* use defaults */ }

  let tokenIds: string[] = [];
  try {
    tokenIds = parseList(raw.clobTokenIds);
  } catch { /* empty */ }

  const volume = Number(raw.volume24hr) || 0;
  const liquidity = Number(raw.liquidity || 0) || 0;

  const easyWinScore = computeEasyWinScore(yesPrice);
  const volumeScore = computeVolumeScore(volume, maxVolume);

  let timeRemaining = '';
  try {
    if (raw.endDate) {
      timeRemaining = formatDistanceToNow(new Date(raw.endDate), { addSuffix: false });
    }
  } catch {
    timeRemaining = '—';
  }

  return {
    id: raw.id || raw.conditionId || raw.condition_id || '',
    question: raw.question || '',
    conditionId: raw.conditionId || raw.condition_id || '',
    slug: raw.slug || '',
    yesPrice,
    noPrice,
    volume24h: volume,
    volume24hr: volume,
    liquidity,
    active: Boolean(raw.active ?? !raw.closed),
    endDate: raw.endDate || '',
    outcomes: (() => {
      const parsed = parseList(raw.outcomes);
      return parsed.length ? parsed : ['Yes', 'No'];
    })(),
    description: raw.description || '',
    category: raw.category || '',
    tokenIds,
    geopolitical: false,
    evScore: computeOverallScore(easyWinScore, volumeScore, 0, 0),
    easyWinScore,
    volumeScore,
    volatilityScore: 0,   // filled async
    mispricingScore: 0,    // filled async
    overallScore: computeOverallScore(easyWinScore, volumeScore, 0, 0),
    timeRemaining,
  };
}

/**
 * Score and rank an array of raw markets
 */
export function scoreMarkets(rawMarkets: RawMarket[]): ScoredMarket[] {
  const maxVolume = Math.max(...rawMarkets.map(m => Number(m.volume24hr) || 0), 1);

  return rawMarkets
    .filter(m => m.question && m.conditionId)
    .map(m => parseRawMarket(m, maxVolume))
    .filter(m => m.yesPrice > 0 && m.yesPrice < 1)
    .sort((a, b) => b.overallScore - a.overallScore);
}
