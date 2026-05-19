import { formatDistanceToNowStrict, isBefore } from "date-fns";
import { RawMarket } from "@/types";
import { extractKeywords } from "@/lib/keywords";

export type MarketFilter = "all" | "easy-win" | "high-volume" | "ending-soon";

export interface LiveBetMarket {
  id: string;
  conditionId: string;
  question: string;
  slug: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
  endDate: string;
  score: number;
  easyWinScore: number;
  volumeScore: number;
  outcomes: string[];
  tokenIds: string[];
  raw: RawMarket;
}

function parseStringList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function parseOutcomePrices(value: string | string[] | undefined) {
  const values = parseStringList(value);
  const yes = parseFloat(values[0] ?? "0.5");
  const no = parseFloat(values[1] ?? `${1 - yes}`);
  return {
    yes: Number.isFinite(yes) ? yes : 0.5,
    no: Number.isFinite(no) ? no : 0.5,
  };
}

export function computeMarketScore(market: RawMarket) {
  const outcomePrices = parseOutcomePrices(market.outcomePrices);
  const yes = parseFloat(`${outcomePrices.yes ?? 0.5}`);
  const easyWin = yes >= 0.88 ? yes * 100 : yes <= 0.12 ? (1 - yes) * 100 : 0;
  const volScore = (Math.log10((Number(market.volume24hr ?? 0) || 0) + 1) / 5) * 100;
  const score = Math.round(easyWin * 0.4 + volScore * 0.6);

  return {
    score,
    easyWinScore: easyWin,
    volumeScore: volScore,
    yesPrice: outcomePrices.yes,
    noPrice: outcomePrices.no,
  };
}

export function normalizeMarket(raw: RawMarket): LiveBetMarket | null {
  const id = raw.id ?? raw.conditionId ?? raw.condition_id ?? "";
  const conditionId = raw.conditionId ?? raw.condition_id ?? raw.id ?? "";
  const question = raw.question?.trim() ?? "";

  if (!id || !conditionId || !question) return null;

  const { score, easyWinScore, volumeScore, yesPrice, noPrice } = computeMarketScore(raw);
  const outcomes = parseStringList(raw.outcomes);
  const tokenIds = parseStringList(raw.clobTokenIds);

  return {
    id,
    conditionId,
    question,
    slug:
      raw.slug ??
      question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    yesPrice,
    noPrice,
    volume24hr: Number(raw.volume24hr ?? raw.volume_24h ?? 0),
    endDate: raw.endDate ?? raw.end_date ?? "",
    score,
    easyWinScore,
    volumeScore,
    outcomes: outcomes.length ? outcomes : ["Yes", "No"],
    tokenIds,
    raw,
  };
}

export function formatTimeRemaining(endDate: string) {
  if (!endDate) return "No end date";

  try {
    return formatDistanceToNowStrict(new Date(endDate), { addSuffix: true });
  } catch {
    return "No end date";
  }
}

export function getScoreTone(score: number) {
  if (score > 70) return "green";
  if (score >= 40) return "amber";
  return "red";
}

export function isEndingSoon(endDate: string) {
  if (!endDate) return false;
  const target = new Date(endDate);
  const horizon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return isBefore(target, horizon);
}

export function getHighVolumeThreshold(markets: LiveBetMarket[]) {
  const volumes = markets.map((market) => market.volume24hr).sort((a, b) => b - a);
  if (!volumes.length) return 0;
  return volumes[Math.max(0, Math.floor(volumes.length * 0.25) - 1)] ?? 0;
}

export function filterMarkets(markets: LiveBetMarket[], filter: MarketFilter, searchTerm: string) {
  const lowered = searchTerm.trim().toLowerCase();
  const volumeThreshold = getHighVolumeThreshold(markets);

  return markets.filter((market) => {
    const matchesSearch = !lowered || market.question.toLowerCase().includes(lowered);
    if (!matchesSearch) return false;

    if (filter === "easy-win") return market.score > 70;
    if (filter === "high-volume") return market.volume24hr >= volumeThreshold;
    if (filter === "ending-soon") return isEndingSoon(market.endDate);
    return true;
  });
}

export function getRelatedMarkets(markets: LiveBetMarket[], currentMarket: LiveBetMarket) {
  const sourceKeywords = new Set(extractKeywords(currentMarket.question, 8));

  return markets
    .filter((market) => market.id !== currentMarket.id)
    .map((market) => {
      const overlap = extractKeywords(market.question, 8).filter((keyword) =>
        sourceKeywords.has(keyword),
      );
      return {
        market,
        overlap: overlap.length,
      };
    })
    .filter((entry) => entry.overlap > 2)
    .sort((a, b) => b.overlap - a.overlap || b.market.score - a.market.score)
    .map((entry) => entry.market)
    .slice(0, 12);
}

export interface ResearchArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  source: string;
  pubDate: string;
  timestamp: number;
}
