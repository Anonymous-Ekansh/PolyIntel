// ============================================================
// GET /api/trades?conditionId=xxx&limit=50
// Fetch recent trades from CLOB API
// ============================================================

import { NextRequest } from "next/server";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/cache";
import { resilientFetch } from "@/lib/fetch";

export const dynamic = "force-dynamic";

const CLOB_API = process.env.POLYMARKET_CLOB_API || "https://clob.polymarket.com";

export async function GET(request: NextRequest) {
  const conditionId = request.nextUrl.searchParams.get("conditionId");
  const limit = request.nextUrl.searchParams.get("limit") || "50";

  if (!conditionId) {
    return Response.json({ error: "conditionId is required" }, { status: 400 });
  }

  const cacheKey = `trades:${conditionId}:${limit}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  try {
    const url = `${CLOB_API}/trades?market=${encodeURIComponent(conditionId)}&limit=${limit}`;
    const res = await resilientFetch(url);
    const json = await res.json();

    // Normalize response — CLOB API may return { data: [...] } or [...]
    const rows = Array.isArray(json) ? json : (json.data ?? []);

    const trades = rows.map((entry: Record<string, unknown>) => {
      const price = Number(entry.price ?? 0);
      const size = Number(entry.size ?? 0);
      return {
        id: String(entry.id ?? entry.transaction_hash ?? `${entry.match_time}-${entry.price}`),
        market: String(entry.market ?? conditionId),
        asset_id: typeof entry.asset_id === "string" ? entry.asset_id : undefined,
        side: String(entry.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY",
        size,
        price,
        match_time: String(entry.match_time ?? new Date().toISOString()),
        outcome: String(entry.outcome ?? "YES"),
        maker_address: String(entry.maker_address ?? entry.trader ?? "unknown"),
        trader: typeof entry.trader === "string" ? entry.trader : undefined,
        sizeUSDC: Number((size * price).toFixed(2)),
        timestamp: new Date(String(entry.match_time ?? Date.now())).getTime(),
      };
    });

    cacheSet(cacheKey, trades, CACHE_TTL.TRADES);
    return Response.json(trades);
  } catch (error) {
    console.error("Trades API error:", error);
    return Response.json(
      { error: "Trades data temporarily unavailable" },
      { status: 502 }
    );
  }
}
