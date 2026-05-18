"use client";

import { Activity, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PanelShell from "@/components/panels/PanelShell";
import { cn, formatPercent, formatUsd } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function EVOpportunities() {
  const markets = useAppStore((state) => state.markets);
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const setSelectedMarket = useAppStore((state) => state.setSelectedMarket);

  const topMarkets = markets.slice(0, 12);

  return (
    <PanelShell
      kicker="Panel 1"
      title="Top EV Opportunities"
      action={
        <Badge className="border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]">
          <Activity className="size-3" />
          60s
        </Badge>
      }
    >
      <div className="space-y-2">
        {topMarkets.map((market, index) => (
          <button
            key={market.conditionId}
            onClick={() => setSelectedMarket(market)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
              selectedMarket?.conditionId === market.conditionId
                ? "border-[#00ff88]/35 bg-[#00ff88]/8"
                : "border-[#1e1e3a] bg-[#0c0f17] hover:border-[#2c3158] hover:bg-[#101420]",
            )}
          >
            <div className="w-8 text-sm text-[#6d738c]">#{index + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-[#f2f2f7]">
                {market.question.slice(0, 60)}
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#8d93a7]">
                <span>YES {formatPercent(market.yesPrice)}</span>
                <span>VOL {formatUsd(market.volume24h, true)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-[#ffaa00]/20 bg-[#ffaa00]/10 text-[#ffaa00]">
                EV {market.evScore.toFixed(1)}
              </Badge>
              <ChevronRight className="size-4 text-[#4a5070]" />
            </div>
          </button>
        ))}
      </div>
    </PanelShell>
  );
}
