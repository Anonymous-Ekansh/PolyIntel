"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PanelShell from "@/components/panels/PanelShell";
import { formatPercent, formatUsd, truncateMiddle } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function WhaleTrades() {
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const whaleTrades = useAppStore((state) => state.whaleTrades);
  const threshold = useAppStore((state) => state.settings.whaleThreshold);
  const [isHovering, setIsHovering] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!feedRef.current || isHovering) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [isHovering, whaleTrades]);

  return (
    <PanelShell
      kicker="Panel 6"
      title="Whale Trades"
      action={
        <Badge className="border-[#1e1e3a] bg-[#0c101a] text-[#c8c8d4]">
          <Waves className="size-3" />
          {formatUsd(threshold)}
        </Badge>
      }
    >
      <div
        ref={feedRef}
        className="h-[320px] space-y-2 overflow-auto rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {selectedMarket ? (
          whaleTrades.length ? (
            whaleTrades.map((trade) => (
              <div
                key={trade.id}
                className={`rounded-xl border px-3 py-3 ${
                  trade.sizeUSDC >= 25_000
                    ? "border-[#ffaa00]/35 bg-[#ffaa00]/10"
                    : "border-[#1e1e3a] bg-[#0d111c]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-[#f0f2f8]">{truncateMiddle(trade.maker_address)}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge className="border-[#1e1e3a] bg-[#121729] text-[#d4d8e7]">{trade.outcome}</Badge>
                      <Badge className="border-[#1e1e3a] bg-[#0b0f16] text-[#8f96ac]">{trade.side}</Badge>
                      {trade.sizeUSDC >= 25_000 ? (
                        <Badge className="border-[#ffaa00]/30 bg-[#ffaa00]/12 text-[#ffaa00]">WHALE</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#f0f2f8]">{formatUsd(trade.sizeUSDC)}</div>
                    <div className="mt-1 text-xs text-[#7c8298]">
                      {formatPercent(Number(trade.price), 2)} ·{" "}
                      {formatDistanceToNow(trade.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#7d8398]">
              No trades above the current whale threshold for this market yet.
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#7d8398]">
            Select a market to monitor large prints.
          </div>
        )}
      </div>
    </PanelShell>
  );
}
