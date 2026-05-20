import { Market, OrderBook, PricePoint, RawMarket, Trade } from "@/types";
import { normalizeMarket } from "@/lib/ev";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const CLOB_BASE_URL = "https://clob.polymarket.com";

const withProxy = (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;

function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

function parseNumeric(value: string | number | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeTradeSize(size: number) {
  if (size > 1_000_000) return size / 1_000_000;
  return size;
}

function normalizeTimestamp(value: number) {
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

export async function fetchAllMarkets(): Promise<Market[]> {
  const pageSize = 200;
  const pages = [0, 200, 400];

  const responses = await Promise.all(
    pages.map(async (offset) => {
      const url = `${GAMMA_BASE_URL}/markets?active=true&closed=false&limit=${pageSize}&offset=${offset}`;
      const response = await fetch(withProxy(url), { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch markets");
      return (await response.json()) as RawMarket[];
    }),
  );

  const deduped = new Map<string, Market>();
  responses.flat().forEach((raw) => {
    const market = normalizeMarket(raw);
    if (!market?.active || !market.tokenIds[0]) return;
    deduped.set(market.conditionId, market);
  });

  return Array.from(deduped.values()).sort((a, b) => b.evScore - a.evScore);
}

export async function fetchOrderBook(tokenId: string): Promise<OrderBook> {
  const url = `${CLOB_BASE_URL}/book?token_id=${encodeURIComponent(tokenId)}`;
  const response = await fetch(withProxy(url), {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch order book");

  const json = (await response.json()) as {
    bids?: Array<{ price: string | number; size: string | number }>;
    asks?: Array<{ price: string | number; size: string | number }>;
  };

  const bids = parseArray<{ price: string | number; size: string | number }>(json.bids);
  const asks = parseArray<{ price: string | number; size: string | number }>(json.asks);
  const bestBid = parseNumeric(bids[0]?.price);
  const bestAsk = parseNumeric(asks[0]?.price);

  return {
    tokenId,
    bids,
    asks,
    bestBid,
    bestAsk,
    spread: bestBid && bestAsk ? bestAsk - bestBid : 0,
  };
}

export async function fetchPriceHistory(tokenId: string, startTs: number): Promise<PricePoint[]> {
  const params = new URLSearchParams({
    market: tokenId,
    interval: "1m",
    startTs: `${startTs}`,
  });
  const url = `${CLOB_BASE_URL}/prices-history?${params.toString()}`;
  const response = await fetch(withProxy(url), {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch price history");

  const json = (await response.json()) as unknown;
  const rows = Array.isArray(json)
    ? (json as Array<{ t?: number; p?: number; close?: number; timestamp?: number }>)
    : ((json as { history?: Array<{ t?: number; p?: number; close?: number; timestamp?: number }> })
        .history ?? []);
  return rows
    .map((row) => ({
      t: normalizeTimestamp(Number(row.t ?? row.timestamp ?? 0)),
      p: Number(row.p ?? row.close ?? 0),
    }))
    .filter((point) => point.t > 0 && point.p >= 0 && point.p <= 1)
    .sort((a, b) => a.t - b.t);
}

export async function fetchTrades(conditionId: string, limit = 100): Promise<Trade[]> {
  const url = `${CLOB_BASE_URL}/trades?market=${encodeURIComponent(conditionId)}&limit=${limit}`;
  const response = await fetch(withProxy(url), { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch trades");

  const json = (await response.json()) as { data?: unknown[] } | unknown[];
  const rows = Array.isArray(json) ? json : parseArray(json.data);

  return rows
    .map((row) => {
      const entry = row as Record<string, unknown>;
      const price = parseNumeric(entry.price as string | number | undefined);
      const rawSize = normalizeTradeSize(parseNumeric(entry.size as string | number | undefined));
      return {
        id: String(entry.id ?? entry.transaction_hash ?? `${entry.match_time}-${entry.price}`),
        market: String(entry.market ?? conditionId),
        asset_id: typeof entry.asset_id === "string" ? entry.asset_id : undefined,
        side: String(entry.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY",
        size: rawSize,
        price,
        match_time: String(entry.match_time ?? new Date().toISOString()),
        outcome: String(entry.outcome ?? "YES"),
        maker_address: String(entry.maker_address ?? entry.trader ?? "unknown"),
        trader: typeof entry.trader === "string" ? entry.trader : undefined,
        sizeUSDC: Number((rawSize * price).toFixed(2)),
        timestamp: new Date(String(entry.match_time ?? Date.now())).getTime(),
      } as Trade;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}
