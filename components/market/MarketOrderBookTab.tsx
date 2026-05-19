"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { LiveBetMarket } from "@/lib/market-helpers";
import { formatPercent } from "@/lib/utils";

async function fetchOrderBook(tokenId: string) {
  const res = await fetch(`/api/orderbook?token_id=${encodeURIComponent(tokenId)}`);
  if (!res.ok) throw new Error("Failed to load order book");
  return (await res.json()) as {
    bids?: Array<{ price: string | number; size: string | number }>;
    asks?: Array<{ price: string | number; size: string | number }>;
  };
}

export default function MarketOrderBookTab({ market }: { market: LiveBetMarket }) {
  const tokenId = market.tokenIds[0];
  const orderBookQuery = useQuery({
    queryKey: ["order-book", tokenId],
    queryFn: () => fetchOrderBook(tokenId),
    enabled: Boolean(tokenId),
    staleTime: 3_000,
    refetchInterval: 5_000,
  });

  const levels = useMemo(() => {
    const bids = (orderBookQuery.data?.bids ?? []).slice(0, 10).map((entry) => ({
      side: "BID",
      price: Number(entry.price),
      size: Number(entry.size),
    }));
    const asks = (orderBookQuery.data?.asks ?? []).slice(0, 10).map((entry) => ({
      side: "ASK",
      price: Number(entry.price),
      size: Number(entry.size),
    }));
    return [...bids, ...asks];
  }, [orderBookQuery.data]);

  const maxSize = Math.max(1, ...levels.map((level) => level.size));

  return (
    <Card className="border border-[#1e1e3a] bg-[#0f0f1a]">
      <CardContent className="p-5">
        {!tokenId ? (
          <div className="rounded-2xl border border-dashed border-[#1e1e3a] bg-[#111523] p-6 text-sm text-[#98a0b4]">
            No token id available for this market.
          </div>
        ) : orderBookQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-2xl border border-[#1e1e3a] bg-[#111523]" />
            ))}
          </div>
        ) : orderBookQuery.isError ? (
          <div className="rounded-2xl border border-[#ff4444]/25 bg-[#2a1014] p-6 text-sm text-[#ffc2c2]">
            Failed to load order book data.
          </div>
        ) : (
          <div className="space-y-3">
            {levels.map((level, index) => (
              <div key={`${level.side}-${index}`} className="rounded-2xl border border-[#1e1e3a] bg-[#111523] p-3">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#7d8498]">
                  <span className={level.side === "BID" ? "text-[#00ff88]" : "text-[#ff4444]"}>{level.side}</span>
                  <span>{formatPercent(level.price, 2)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#0b0e16]">
                  <div
                    className={level.side === "BID" ? "h-full bg-[#00ff88]" : "h-full bg-[#ff4444]"}
                    style={{ width: `${(level.size / maxSize) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-[#c7cedf]">Size {level.size.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
