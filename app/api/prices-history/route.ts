// ============================================================
// GET /api/prices-history?market=xxx&interval=1d&fidelity=60
// Fetch price history from CLOB API
// ============================================================

import { NextRequest } from "next/server";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/cache";
import { resilientFetch } from "@/lib/fetch";

export const dynamic = "force-dynamic";

const CLOB_API = process.env.POLYMARKET_CLOB_API || "https://clob.polymarket.com";

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market");
  const interval = request.nextUrl.searchParams.get("interval") || "1d";
  const fidelity = request.nextUrl.searchParams.get("fidelity") || "60";
  const startTs = request.nextUrl.searchParams.get("startTs");

  if (!market) {
    return Response.json({ error: "market is required" }, { status: 400 });
  }

  const cacheKey = `price-history:${market}:${interval}:${fidelity}:${startTs || ""}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  try {
    const params = new URLSearchParams({ market, interval, fidelity });
    if (startTs) params.set("startTs", startTs);

    const url = `${CLOB_API}/prices-history?${params.toString()}`;
    const res = await resilientFetch(url);
    const data = await res.json();
    cacheSet(cacheKey, data, CACHE_TTL.PRICE_HISTORY);
    return Response.json(data);
  } catch (error) {
    console.error("Price history API error:", error);
    return Response.json(
      { error: "Price history temporarily unavailable" },
      { status: 502 }
    );
  }
}
