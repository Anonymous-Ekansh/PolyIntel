// ============================================================
// GET /api/market/[conditionId] — Fetch single market metadata
// ============================================================

import { NextRequest } from "next/server";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/cache";
import { resilientFetch } from "@/lib/fetch";

export const dynamic = "force-dynamic";

const GAMMA_API = process.env.POLYMARKET_GAMMA_API || "https://gamma-api.polymarket.com";

function parseMaybeJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { conditionId: string } }
) {
  const { conditionId } = params;

  if (!conditionId) {
    return Response.json({ error: "conditionId is required" }, { status: 400 });
  }

  const cacheKey = `market:${conditionId}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  try {
    // We use ?condition_id= or ?id= or ?slug= 
    // Usually Gamma API can be queried by condition_id
    const url = `${GAMMA_API}/markets?condition_id=${encodeURIComponent(conditionId)}`;
    const res = await resilientFetch(url);
    const data = await res.json() as any[];

    if (!Array.isArray(data) || data.length === 0) {
      // Fallback: try by id
      const url2 = `${GAMMA_API}/markets?id=${encodeURIComponent(conditionId)}`;
      const res2 = await resilientFetch(url2);
      const data2 = await res2.json() as any[];
      
      if (!Array.isArray(data2) || data2.length === 0) {
        return Response.json({ error: "Market not found" }, { status: 404 });
      }
      data.push(...data2);
    }

    const raw = data[0];
    const outcomePrices = parseMaybeJsonArray(raw.outcomePrices);
    const tokenIds = parseMaybeJsonArray(raw.clobTokenIds);
    const yesPrice = parseFloat(outcomePrices[0] ?? "0.5");

    const market = {
      id: String(raw.id ?? conditionId),
      conditionId: String(raw.conditionId ?? raw.condition_id ?? conditionId),
      question: String(raw.question ?? ""),
      slug: String(raw.slug ?? ""),
      yesPrice,
      noPrice: parseFloat(outcomePrices[1] ?? `${1 - yesPrice}`),
      volume24hr: Number(raw.volume24hr ?? raw.volume_24h ?? 0),
      liquidity: Number(raw.liquidity ?? 0),
      endDate: String(raw.endDate ?? raw.end_date ?? ""),
      outcomes: parseMaybeJsonArray(raw.outcomes),
      tokenIds,
      description: String(raw.description ?? ""),
      category: String(raw.category ?? ""),
      volume: Number(raw.volume ?? raw.volumeNum ?? 0),
    };

    cacheSet(cacheKey, market, CACHE_TTL.MARKET_SINGLE);
    return Response.json(market);
  } catch (error) {
    console.error(`Market single API error for ${conditionId}:`, error);
    return Response.json({ error: "Failed to fetch market details" }, { status: 502 });
  }
}
