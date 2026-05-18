"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Newspaper, Wallet, Zap } from "lucide-react";
import PanelShell from "@/components/panels/PanelShell";
import { inferImpactDirection } from "@/lib/matching";
import { useAppStore } from "@/store/useAppStore";

export default function SignalTimeline() {
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const news = useAppStore((state) => state.news);
  const whaleTrades = useAppStore((state) => state.whaleTrades);
  const signalEvents = useAppStore((state) => state.signalEvents);

  const newsEvents = selectedMarket
    ? (news[selectedMarket.conditionId] ?? []).map((article) => ({
        id: `news-${article.id}`,
        timestamp: article.timestamp,
        title: article.title,
        description: article.source,
        direction: inferImpactDirection(`${article.title} ${article.description}`),
        kind: "news" as const,
      }))
    : [];

  const whaleEvents = whaleTrades.map((trade) => ({
    id: `whale-${trade.id}`,
    timestamp: trade.timestamp,
    title: `${trade.side} ${trade.outcome}`,
    description: `${trade.sizeUSDC.toLocaleString()} USDC`,
    direction: trade.side === "BUY" ? "up" : "down",
    kind: "whale" as const,
  }));

  const priceEvents = signalEvents
    .filter((event) => event.type === "price" && event.marketId === selectedMarket?.conditionId)
    .map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      title: event.title,
      description: event.description,
      direction: event.direction,
      kind: "price" as const,
    }));

  const timeline = [...newsEvents, ...whaleEvents, ...priceEvents]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 18);

  return (
    <PanelShell kicker="Panel 8" title="Signal Timeline">
      <div className="relative space-y-3 pl-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-[#1e1e3a]">
        {selectedMarket ? (
          timeline.length ? (
            timeline.map((event) => {
              const isUp = event.direction === "up";
              const isDown = event.direction === "down";

              return (
                <div key={event.id} className="relative rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3">
                  <span className="absolute -left-[18px] top-4 flex size-4 items-center justify-center rounded-full border border-[#1e1e3a] bg-[#0a0a0f]">
                    {event.kind === "news" ? (
                      <Newspaper className="size-2.5 text-[#00ff88]" />
                    ) : event.kind === "whale" ? (
                      <Wallet className="size-2.5 text-[#ffaa00]" />
                    ) : (
                      <Zap className="size-2.5 text-[#ff4444]" />
                    )}
                  </span>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-[#f1f2f8]">{event.title}</div>
                      <div className="mt-1 text-xs text-[#8a91a8]">{event.description}</div>
                    </div>
                    <div className="text-right text-xs text-[#7d8398]">
                      <div className="flex items-center justify-end gap-1">
                        {isUp ? (
                          <ArrowUpRight className="size-3 text-[#00ff88]" />
                        ) : isDown ? (
                          <ArrowDownRight className="size-3 text-[#ff4444]" />
                        ) : null}
                        {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-[#1e1e3a] bg-[#0b0f16] p-6 text-center text-sm text-[#7d8398]">
              Waiting for matched news, whale prints, or price anomalies.
            </div>
          )
        ) : (
          <div className="rounded-xl border border-dashed border-[#1e1e3a] bg-[#0b0f16] p-6 text-center text-sm text-[#7d8398]">
            Select a market to assemble the signal tape.
          </div>
        )}
      </div>
    </PanelShell>
  );
}
