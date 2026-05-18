"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import PanelShell from "@/components/panels/PanelShell";
import { getPortfolioMetrics } from "@/lib/portfolio";
import { cn, formatUsd } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

function statusTone(value: number) {
  if (value >= 100) return "red";
  if (value >= 75) return "amber";
  return "green";
}

function Row({
  label,
  value,
  ratio,
}: {
  label: string;
  value: string;
  ratio: number;
}) {
  const tone = statusTone(ratio);
  return (
    <div className="rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm text-[#f1f2f8]">{label}</div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              tone === "green" && "bg-[#00ff88]",
              tone === "amber" && "bg-[#ffaa00]",
              tone === "red" && "bg-[#ff4444]",
            )}
          />
          <span className="text-xs text-[#8a91a8]">{value}</span>
        </div>
      </div>
      <Progress value={Math.min(100, ratio)} className="gap-0">
      </Progress>
    </div>
  );
}

export default function RiskDashboard() {
  const paperPositions = useAppStore((state) => state.paperPositions);
  const livePrices = useAppStore((state) => state.livePrices);
  const markets = useAppStore((state) => state.markets);
  const settings = useAppStore((state) => state.settings);
  const resetPaperPortfolio = useAppStore((state) => state.resetPaperPortfolio);

  const metrics = getPortfolioMetrics(paperPositions, livePrices, markets);
  const openPositions = metrics.openPositions;

  const risk = useMemo(() => {
    const totalExposure = openPositions.reduce((sum, position) => sum + position.size, 0);
    const byMarket = new Map<string, number>();
    const byCategory = new Map<string, number>();

    openPositions.forEach((position) => {
      byMarket.set(position.marketId, (byMarket.get(position.marketId) ?? 0) + position.size);
      byCategory.set(position.category, (byCategory.get(position.category) ?? 0) + position.size);
    });

    const maxSingleMarket = Math.max(0, ...Array.from(byMarket.values()));
    const maxCategoryExposure = Math.max(0, ...Array.from(byCategory.values()));
    const categoryPercent = totalExposure ? (maxCategoryExposure / totalExposure) * 100 : 0;
    const dailyLoss = Math.max(0, -metrics.dailyPnl);

    return {
      totalExposure,
      maxSingleMarket,
      categoryPercent,
      dailyLoss,
    };
  }, [metrics.dailyPnl, openPositions]);

  const limits = settings.riskLimits;

  return (
    <PanelShell
      kicker="Panel 9"
      title="Risk Dashboard"
      action={
        <div className="flex items-center gap-2 text-xs text-[#8a91a8]">
          <AlertTriangle className="size-3 text-[#ffaa00]" />
          Limits
        </div>
      }
    >
      <div className="space-y-3">
        <Row
          label="Max portfolio exposure"
          value={`${formatUsd(risk.totalExposure)} / ${formatUsd(limits.maxPortfolioExposure)}`}
          ratio={(risk.totalExposure / limits.maxPortfolioExposure) * 100}
        />
        <Row
          label="Max single market"
          value={`${formatUsd(risk.maxSingleMarket)} / ${formatUsd(limits.maxSingleMarket)}`}
          ratio={(risk.maxSingleMarket / limits.maxSingleMarket) * 100}
        />
        <Row
          label="Max category"
          value={`${risk.categoryPercent.toFixed(1)}% / ${limits.maxCategoryPercent}%`}
          ratio={(risk.categoryPercent / limits.maxCategoryPercent) * 100}
        />
        <Row
          label="Daily loss limit"
          value={`${formatUsd(risk.dailyLoss)} / ${formatUsd(limits.dailyLossLimit)}`}
          ratio={(risk.dailyLoss / limits.dailyLossLimit) * 100}
        />

        <Button
          variant="destructive"
          className="mt-3 w-full"
          onClick={() => {
            if (window.confirm("Reset the local paper portfolio?")) {
              resetPaperPortfolio();
            }
          }}
        >
          Reset Paper Portfolio
        </Button>
      </div>
    </PanelShell>
  );
}
