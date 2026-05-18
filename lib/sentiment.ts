// ============================================================
// Sentiment Analysis — bullish/bearish word scoring
// ============================================================

const BULLISH_WORDS = new Set([
  'win', 'wins', 'winning', 'won', 'rise', 'rises', 'rising', 'rose',
  'approve', 'approved', 'approves', 'approval', 'up', 'gain', 'gains',
  'confirm', 'confirmed', 'confirms', 'yes', 'likely', 'strong', 'stronger',
  'positive', 'success', 'successful', 'boost', 'surge', 'surges', 'surging',
  'rally', 'rallies', 'rallying', 'advance', 'advances', 'recover', 'recovery',
  'bullish', 'breakthrough', 'agreement', 'deal', 'pass', 'passes', 'passed',
  'victory', 'lead', 'leads', 'leading', 'ahead', 'support', 'supports',
  'grow', 'grows', 'growth', 'increase', 'increases', 'high', 'higher', 'highest',
]);

const BEARISH_WORDS = new Set([
  'lose', 'loses', 'losing', 'lost', 'fall', 'falls', 'falling', 'fell',
  'reject', 'rejected', 'rejects', 'rejection', 'down', 'loss', 'losses',
  'deny', 'denied', 'denies', 'no', 'unlikely', 'weak', 'weaker',
  'negative', 'fail', 'fails', 'failed', 'failure', 'drop', 'drops', 'dropping',
  'crash', 'crashes', 'crashing', 'decline', 'declines', 'declining',
  'bearish', 'collapse', 'block', 'blocks', 'blocked', 'veto', 'vetoes',
  'defeat', 'defeated', 'behind', 'oppose', 'opposes', 'opposition',
  'shrink', 'shrinks', 'decrease', 'decreases', 'low', 'lower', 'lowest',
  'risk', 'risks', 'threat', 'threatens', 'warning', 'crisis',
]);

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

/**
 * Analyze sentiment of a text string
 */
export function analyzeSentiment(text: string): Sentiment {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/);

  let bullish = 0;
  let bearish = 0;

  words.forEach(w => {
    if (BULLISH_WORDS.has(w)) bullish++;
    if (BEARISH_WORDS.has(w)) bearish++;
  });

  if (bullish > bearish + 1) return 'bullish';
  if (bearish > bullish + 1) return 'bearish';
  return 'neutral';
}

/**
 * Count sentiments in an array of articles
 */
export function countSentiments(sentiments: Sentiment[]): { bullish: number; bearish: number; neutral: number } {
  return sentiments.reduce(
    (acc, s) => {
      acc[s]++;
      return acc;
    },
    { bullish: 0, bearish: 0, neutral: 0 }
  );
}
