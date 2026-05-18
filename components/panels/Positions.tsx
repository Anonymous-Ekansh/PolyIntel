"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PanelShell from "@/components/panels/PanelShell";
import { getPositionMetrics } from "@/lib/portfolio";
import { cn, formatPercent, formatUsd } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function Positions() {
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const markets = useAppStore((state) => state.markets);
  const paperPositions = useAppStore((state) => state.paperPositions);
  const livePrices = useAppStore((state) => state.livePrices);
  const addPosition = useAppStore((state) => state.addPosition);
  const closePosition = useAppStore((state) => state.closePosition);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [size, setSize] = useState("100");

  const marketMap = new Map(markets.map((market) => [market.conditionId, market]));
  const openPositions = paperPositions.filter((position) => !position.closedAt);

  function handleBuy() {
    if (!selectedMarket) return;
    const sizeValue = Number(size);
    if (!sizeValue || sizeValue <= 0) return;

    const entryPrice = side === "YES" ? selectedMarket.yesPrice : selectedMarket.noPrice;
    addPosition({
      id: crypto.randomUUID(),
      marketId: selectedMarket.conditionId,
      marketQuestion: selectedMarket.question,
      marketSlug: selectedMarket.slug,
      tokenId: selectedMarket.tokenIds[0],
      side,
      size: sizeValue,
      shares: sizeValue / Math.max(entryPrice, 0.01),
      category: selectedMarket.category,
      entryPrice,
      createdAt: Date.now(),
    });
  }

  return (
    <PanelShell kicker="Panel 7" title="Positions & Paper Trading">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3">
          <div className="text-xs uppercase tracking-[0.22em] text-[#6d7288]">New ticket</div>
          <div className="mt-2 text-sm text-[#f2f2f7]">
            {selectedMarket?.question ?? "Select a market from the EV panel to place a paper trade."}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["YES", "NO"] as const).map((value) => (
              <Button
                key={value}
                variant="outline"
                onClick={() => setSide(value)}
                className={
                  side === value
                    ? "border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]"
                    : "border-[#1e1e3a] bg-[#0b0f16] text-[#c8c8d4]"
                }
              >
                {value}
              </Button>
            ))}
            <Input
              type="number"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="w-[140px] border-[#1e1e3a] bg-[#090c15] text-white"
              placeholder="USDC"
            />
            <Button className="bg-[#00ff88]/12 text-[#00ff88] hover:bg-[#00ff88]/18" onClick={handleBuy}>
              Buy
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {openPositions.length ? (
            openPositions.map((position) => {
              const market = marketMap.get(position.marketId);
              const metrics = getPositionMetrics(position, livePrices, market);
              return (
                <div key={position.id} className="rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-[#f2f2f7]">{position.marketQuestion}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          className={cn(
                            "border px-2",
                            position.side === "YES"
                              ? "border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]"
                              : "border-[#ffaa00]/30 bg-[#ffaa00]/10 text-[#ffaa00]",
                          )}
                        >
                          {position.side}
                        </Badge>
                        <Badge className="border-[#1e1e3a] bg-[#121729] text-[#cfd5e5]">
                          Entry {formatPercent(position.entryPrice, 2)}
                        </Badge>
                        <Badge className="border-[#1e1e3a] bg-[#121729] text-[#cfd5e5]">
                          Now {formatPercent(metrics.currentContractPrice, 2)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#f2f2f7]">{formatUsd(metrics.currentValue)}</div>
                      <div className={cn("mt-1 text-xs", metrics.pnl >= 0 ? "text-[#00ff88]" : "text-[#ff4444]")}>
                        {metrics.pnl >= 0 ? "+" : ""}
                        {formatUsd(metrics.pnl)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm("Close this paper position?")) {
                          closePosition(position.id);
                        }
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-[#1e1e3a] bg-[#0b0f16] p-6 text-center text-sm text-[#7f869d]">
              No open paper positions yet.
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  );
}
