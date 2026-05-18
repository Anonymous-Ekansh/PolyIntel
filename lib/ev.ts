import { formatDistanceToNowStrict } from "date-fns";
import { Market, RawMarket } from "@/types";

const GEO_KEYWORDS = [
  "election",
  "war",
  "president",
  "prime minister",
  "gdp",
  "sanctions",
  "country",
  "countries",
];

const LOCATION_KEYWORDS: Array<{ match: string; label: string; lat: number; lng: number }> = [
  { match: "usa", label: "United States", lat: 38.9, lng: -77.03 },
  { match: "united states", label: "United States", lat: 38.9, lng: -77.03 },
  { match: "china", label: "China", lat: 39.9, lng: 116.4 },
  { match: "russia", label: "Russia", lat: 55.75, lng: 37.61 },
  { match: "ukraine", label: "Ukraine", lat: 50.45, lng: 30.52 },
  { match: "india", label: "India", lat: 28.61, lng: 77.2 },
  { match: "taiwan", label: "Taiwan", lat: 25.03, lng: 121.56 },
  { match: "iran", label: "Iran", lat: 35.69, lng: 51.39 },
  { match: "israel", label: "Israel", lat: 31.77, lng: 35.21 },
  { match: "gaza", label: "Gaza", lat: 31.5, lng: 34.47 },
  { match: "europe", label: "Europe", lat: 50.11, lng: 8.68 },
  { match: "uk ", label: "United Kingdom", lat: 51.5, lng: -0.12 },
  { match: "britain", label: "United Kingdom", lat: 51.5, lng: -0.12 },
  { match: "france", label: "France", lat: 48.85, lng: 2.35 },
  { match: "germany", label: "Germany", lat: 52.52, lng: 13.4 },
  { match: "canada", label: "Canada", lat: 45.42, lng: -75.69 },
  { match: "mexico", label: "Mexico", lat: 19.43, lng: -99.13 },
  { match: "argentina", label: "Argentina", lat: -34.61, lng: -58.38 },
  { match: "brazil", label: "Brazil", lat: -15.79, lng: -47.88 },
  { match: "japan", label: "Japan", lat: 35.68, lng: 139.69 },
  { match: "south korea", label: "South Korea", lat: 37.57, lng: 126.98 },
  { match: "north korea", label: "North Korea", lat: 39.03, lng: 125.75 },
  { match: "australia", label: "Australia", lat: -35.28, lng: 149.13 },
];

function safeArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function pickLocation(question: string) {
  const lowered = question.toLowerCase();
  return LOCATION_KEYWORDS.find((entry) => lowered.includes(entry.match));
}

export function computeEVScore(price: number, volume24h: number) {
  const centeredProbability = 1 - Math.abs(price - 0.5) * 2;
  return Number(((volume24h / 1000) * centeredProbability).toFixed(2));
}

export function isGeopoliticalQuestion(question: string) {
  const lowered = question.toLowerCase();
  return GEO_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

export function normalizeMarket(raw: RawMarket): Market | null {
  const conditionId = raw.conditionId ?? raw.condition_id ?? raw.id ?? "";
  const question = raw.question?.trim() ?? "";
  if (!conditionId || !question) return null;

  const prices = safeArray(raw.outcomePrices);
  const outcomes = safeArray(raw.outcomes);
  const tokenIds = safeArray(raw.clobTokenIds);
  const yesPrice = Number(prices[0] ?? raw.tokens?.[0]?.price ?? 0.5);
  const noPrice = Number(prices[1] ?? raw.tokens?.[1]?.price ?? 1 - yesPrice);
  const volume24h = Number(raw.volume24hr ?? raw.volume_24h ?? 0);
  const liquidity = Number(raw.liquidity ?? 0);
  const location = pickLocation(question);
  const geopolitical = isGeopoliticalQuestion(question);

  return {
    id: raw.id ?? conditionId,
    conditionId,
    slug: raw.slug ?? question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    question,
    yesPrice,
    noPrice,
    volume24h,
    liquidity,
    active: Boolean(raw.active ?? !raw.closed),
    endDate: raw.endDate ?? raw.end_date ?? "",
    outcomes: outcomes.length ? outcomes : ["Yes", "No"],
    description: raw.description ?? "",
    category: raw.category ?? (geopolitical ? "geopolitics" : "general"),
    tokenIds,
    geopolitical,
    location: location
      ? { label: location.label, lat: location.lat, lng: location.lng }
      : undefined,
    evScore: computeEVScore(yesPrice, volume24h),
    lastPrice: yesPrice,
  };
}

export function withMarketMeta(market: Market) {
  return {
    ...market,
    volume24hr: market.volume24h,
    easyWinScore: Number(((1 - Math.abs(market.yesPrice - 0.5) * 2) * 100).toFixed(2)),
    volumeScore: Number(Math.min(Math.log10(market.volume24h + 1) * 20, 100).toFixed(2)),
    volatilityScore: 0,
    mispricingScore: 0,
    overallScore: market.evScore,
    timeRemaining: market.endDate
      ? formatDistanceToNowStrict(new Date(market.endDate), { addSuffix: true })
      : "Open-ended",
    priceChange24h: 0,
  };
}
