"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PanelShell from "@/components/panels/PanelShell";
import { fetchOrderBook } from "@/lib/polymarket";
import { formatPercent } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function OrderBook() {
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const setOrderbook = useAppStore((state) => state.setOrderbook);
  const cachedBook = useAppStore((state) =>
    selectedMarket ? state.orderbooks[selectedMarket.conditionId] : undefined,
  );

  const query = useQuery({
    queryKey: ["order-book", selectedMarket?.conditionId],
    queryFn: () => fetchOrderBook(selectedMarket!.tokenIds[0]),
    enabled: Boolean(selectedMarket?.tokenIds[0]),
    refetchInterval: 5_000,
    staleTime: 2_000,
  });

  useEffect(() => {
    if (selectedMarket && query.data) {
      setOrderbook(selectedMarket.conditionId, query.data);
    }
  }, [query.data, selectedMarket, setOrderbook]);

  const book = query.data ?? cachedBook;

  if (!selectedMarket) {
    return <PanelShell kicker="Panel 5" title="Order Book">Select a market to inspect depth.</PanelShell>;
  }

  const bids = (book?.bids ?? []).slice(0, 8).reverse();
  const asks = (book?.asks ?? []).slice(0, 8);
  const rows = Array.from({ length: Math.max(bids.length, asks.length) }).map((_, index) => {
    const bid = bids[index];
    const ask = asks[index];
    return {
      level: `${bid?.price ?? ask?.price ?? index}`,
      bid: -(Number(bid?.size ?? 0)),
      ask: Number(ask?.size ?? 0),
    };
  });
  const maxSize = Math.max(
    1,
    ...rows.flatMap((row) => [Math.abs(row.bid), Math.abs(row.ask)]),
  );
  const spreadBps = (book?.spread ?? 0) * 10_000;

  return (
    <PanelShell
      kicker="Panel 5"
      title="Order Book"
      action={
        <Badge className="border-[#1e1e3a] bg-[#0c101a] text-[#c8c8d4]">
          <Layers3 className="size-3" />
          5s
        </Badge>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#747a91]">Best Bid</div>
            <div className="mt-1 text-lg text-[#00ff88]">{formatPercent(book?.bestBid ?? 0, 2)}</div>
          </div>
          <div className="rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#747a91]">Best Ask</div>
            <div className="mt-1 text-lg text-[#ff4444]">{formatPercent(book?.bestAsk ?? 0, 2)}</div>
          </div>
          <div className="rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#747a91]">Spread</div>
            <div className="mt-1 text-lg text-[#ffaa00]">{spreadBps.toFixed(0)} bps</div>
          </div>
        </div>

        <div className="h-[220px] rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical">
              <CartesianGrid stroke="rgba(30,30,58,0.4)" horizontal={false} />
              <XAxis type="number" hide domain={[-maxSize, maxSize]} />
              <YAxis dataKey="level" type="category" width={58} tick={{ fill: "#8b91a8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0f0f1a", border: "1px solid #1e1e3a", color: "#c8c8d4" }}
                formatter={(value: number) => Math.abs(Number(value)).toFixed(2)}
              />
              <Bar dataKey="bid" fill="#00ff88" radius={[4, 0, 0, 4]} animationDuration={450} />
              <Bar dataKey="ask" fill="#ff4444" radius={[0, 4, 4, 0]} animationDuration={450} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PanelShell>
  );
}
