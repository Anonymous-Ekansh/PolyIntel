// ============================================================
// GET /api/markets — Fetch all active markets from Gamma API
// Server-side only — bypasses Indian ISP blocks
// ============================================================

import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/cache";
import { resilientFetch } from "@/lib/fetch";

export const dynamic = "force-dynamic";

const GAMMA_API = process.env.POLYMARKET_GAMMA_API || "https://gamma-api.polymarket.com";
const CACHE_KEY = "markets-list";

function parseMaybeJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeMarketShape(market: Record<string, unknown>) {
  const outcomes = Array.isArray(market.outcomes)
    ? market.outcomes
    : parseMaybeJsonArray(market.outcomes);
  const outcomePrices = Array.isArray(market.outcomePrices)
    ? market.outcomePrices
    : parseMaybeJsonArray(market.outcomePrices);
  const tokenIds = Array.isArray(market.clobTokenIds)
    ? market.clobTokenIds
    : parseMaybeJsonArray(market.clobTokenIds);

  return {
    ...market,
    id: String(market.id ?? market.conditionId ?? market.condition_id ?? ""),
    conditionId: String(market.conditionId ?? market.condition_id ?? market.id ?? ""),
    question: String(market.question ?? ""),
    slug: String(market.slug ?? ""),
    active: Boolean(market.active ?? true),
    closed: Boolean(market.closed ?? false),
    endDate: String(market.endDate ?? market.end_date ?? ""),
    volume24hr: Number(market.volume24hr ?? market.volume_24h ?? market.volume ?? 0),
    liquidity: Number(market.liquidity ?? 0),
    outcomePrices,
    outcomes,
    clobTokenIds: tokenIds,
    description: String(market.description ?? ""),
    category: String(market.category ?? ""),
    oneDayPriceChange: Number(market.oneDayPriceChange ?? 0),
    volume: Number(market.volume ?? market.volumeNum ?? 0),
  };
}

export async function GET() {
  // Check cache first
  const cached = cacheGet<unknown[]>(CACHE_KEY);
  if (cached) {
    return Response.json(cached);
  }

  try {
    // Fetch multiple pages from Gamma API
    const offsets = [0, 200, 400];
    const allMarkets: unknown[] = [];

    for (const offset of offsets) {
      const url = `${GAMMA_API}/markets?active=true&closed=false&limit=200&offset=${offset}`;
      try {
        const res = await resilientFetch(url);
        const data = (await res.json()) as unknown[];
        if (Array.isArray(data)) {
          allMarkets.push(...data);
        }
      } catch (err) {
        console.warn(`Failed to fetch markets at offset ${offset}:`, err);
        // Continue with other pages
      }
    }

    if (allMarkets.length === 0) {
      return Response.json(
        {
          error: "Market data unavailable from your network. Deploy the backend to a EU/US server (Railway or Render) for reliable access from India.",
        },
        { status: 502 }
      );
    }

    // Deduplicate by conditionId
    const deduped = new Map<string, unknown>();
    for (const raw of allMarkets) {
      const market = normalizeMarketShape(raw as Record<string, unknown>);
      if (market.id && market.question) {
        deduped.set(market.conditionId, market);
      }
    }

    const normalized = Array.from(deduped.values());
    cacheSet(CACHE_KEY, normalized, CACHE_TTL.MARKET_LIST);
    return Response.json(normalized);
  } catch (error) {
    console.error("Markets API error:", error);
    return Response.json(
      {
        error: "Market data unavailable from your network. Deploy the backend to a EU/US server (Railway or Render) for reliable access from India.",
      },
      { status: 502 }
    );
  }
}
