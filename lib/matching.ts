import { Article, ArticleMatch, Market } from "@/types";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "will",
  "be",
  "is",
  "are",
  "was",
  "were",
  "if",
  "by",
  "at",
  "from",
  "up",
  "down",
  "yes",
  "no",
  "market",
  "markets",
]);

const BULLISH_HINTS = ["wins", "surges", "passes", "supports", "approves", "rises", "gains"];
const BEARISH_HINTS = ["falls", "drops", "blocks", "vetoes", "loses", "war", "sanctions"];

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function keywordOverlapRatio(a: string, b: string) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;

  let overlap = 0;
  left.forEach((token) => {
    if (right.has(token)) overlap += 1;
  });

  return overlap / Math.min(left.size, right.size);
}

export function inferArticleSentiment(text: string): Article["sentiment"] {
  const lowered = text.toLowerCase();
  const bullish = BULLISH_HINTS.filter((hint) => lowered.includes(hint)).length;
  const bearish = BEARISH_HINTS.filter((hint) => lowered.includes(hint)).length;
  if (bullish > bearish) return "bullish";
  if (bearish > bullish) return "bearish";
  return "neutral";
}

export function inferImpactDirection(text: string): "up" | "down" | "neutral" {
  const sentiment = inferArticleSentiment(text);
  if (sentiment === "bullish") return "up";
  if (sentiment === "bearish") return "down";
  return "neutral";
}

export function matchArticleToMarkets(
  articleText: string,
  markets: Market[],
  threshold = 0.15,
): ArticleMatch[] {
  return markets
    .map((market) => ({
      marketId: market.id,
      conditionId: market.conditionId,
      question: market.question,
      score: keywordOverlapRatio(articleText, market.question),
    }))
    .filter((match) => match.score > threshold)
    .sort((a, b) => b.score - a.score);
}
