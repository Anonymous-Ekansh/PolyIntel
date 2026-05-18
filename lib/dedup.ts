// ============================================================
// Article Deduplication — Levenshtein distance based
// ============================================================

import { Article } from '@/types';

/**
 * Simple Levenshtein distance (for short strings like headlines)
 */
function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use only two rows for memory efficiency
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb];
}

/**
 * Compute normalized similarity (0–1) between two strings
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

/**
 * Deduplicate articles by headline similarity.
 * Articles with >80% headline similarity are considered duplicates.
 */
export function deduplicateArticles(articles: Article[], threshold = 0.8): Article[] {
  const result: Article[] = [];

  for (const article of articles) {
    const isDuplicate = result.some(
      existing => similarity(existing.title, article.title) > threshold
    );
    if (!isDuplicate) {
      result.push(article);
    }
  }

  return result;
}
