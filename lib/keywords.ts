// ============================================================
// Keyword Extraction — extract search terms from market questions
// ============================================================

const STOP_WORDS = new Set([
  'will', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'by', 'of', 'be', 'is',
  'are', 'was', 'were', 'for', 'with', 'before', 'after', 'than', 'that',
  'this', 'which', 'who', 'what', 'when', 'how', 'does', 'do', 'get', 'have',
  'has', 'had', 'not', 'no', 'yes', 'or', 'and', 'but', 'if', 'its', 'his',
  'her', 'they', 'them', 'their', 'we', 'our', 'he', 'she', 'it', 'can',
  'could', 'would', 'should', 'may', 'might', 'shall', 'up', 'down', 'out',
  'into', 'over', 'under', 'about', 'between', 'during', 'more', 'some',
  'other', 'any', 'each', 'all', 'been', 'being', 'there', 'here',
]);

/**
 * Extract top keywords from a market question for news search.
 * Removes stopwords, sorts by length (longer = more specific), takes top N.
 */
export function extractKeywords(question: string, topN = 4): string[] {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Deduplicate
  const unique = Array.from(new Set(words));

  // Sort by length descending (longer words are more specific)
  unique.sort((a, b) => b.length - a.length);

  return unique.slice(0, topN);
}

/**
 * Build a search query string from keywords
 */
export function buildSearchQuery(question: string): string {
  return extractKeywords(question, 4).join(' ');
}

/**
 * Compute keyword overlap ratio between two texts
 */
export function keywordOverlap(text1: string, text2: string): number {
  const words1 = new Set(extractKeywords(text1, 20));
  const words2 = new Set(extractKeywords(text2, 20));
  if (words1.size === 0 || words2.size === 0) return 0;

  let overlap = 0;
  words1.forEach(w => { if (words2.has(w)) overlap++; });

  return overlap / Math.min(words1.size, words2.size);
}
