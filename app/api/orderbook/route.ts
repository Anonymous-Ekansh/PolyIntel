// ============================================================
// GET /api/orderbook?token_id=xxx — Fetch order book from CLOB API
// ============================================================

import { NextRequest } from "next/server";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/cache";
import { resilientFetch } from "@/lib/fetch";

export const dynamic = "force-dynamic";

const CLOB_API = process.env.POLYMARKET_CLOB_API || "https://clob.polymarket.com";

export async function GET(request: NextRequest) {
  const tokenId = request.nextUrl.searchParams.get("token_id");

  if (!tokenId) {
    return Response.json({ error: "token_id is required" }, { status: 400 });
  }

  const cacheKey = `orderbook:${tokenId}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  try {
    const url = `${CLOB_API}/book?token_id=${encodeURIComponent(tokenId)}`;
    const res = await resilientFetch(url);
    const data = await res.json();
    cacheSet(cacheKey, data, CACHE_TTL.ORDERBOOK);
    return Response.json(data);
  } catch (error) {
    console.error("Orderbook API error:", error);
    return Response.json(
      { error: "Orderbook temporarily unavailable" },
      { status: 502 }
    );
  }
}
