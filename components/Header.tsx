"use client";

import { Bell, Settings2, TerminalSquare, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPortfolioMetrics } from "@/lib/portfolio";
import { cn, formatUsd } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "red" | "amber";
}) {
  return (
    <div className="rounded-xl border border-[#1e1e3a] bg-[#10101b]/90 px-3 py-2 shadow-[0_0_0_1px_rgba(0,255,136,0.02)]">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[#73738d]">{label}</div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tracking-tight",
          tone === "green" && "text-[#00ff88] [text-shadow:0_0_16px_rgba(0,255,136,0.28)]",
          tone === "red" && "text-[#ff4444] [text-shadow:0_0_16px_rgba(255,68,68,0.24)]",
          tone === "amber" && "text-[#ffaa00] [text-shadow:0_0_16px_rgba(255,170,0,0.24)]",
          tone === "neutral" && "text-[#f1f1f7]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default function Header() {
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const markets = useAppStore((state) => state.markets);
  const paperPositions = useAppStore((state) => state.paperPositions);
  const livePrices = useAppStore((state) => state.livePrices);
  const alerts = useAppStore((state) => state.alerts);
  const signalEvents = useAppStore((state) => state.signalEvents);

  const metrics = getPortfolioMetrics(paperPositions, livePrices, markets);
  const activeAlerts = alerts.length + signalEvents.filter((signal) => signal.type === "price").length;

  return (
    <header className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[linear-gradient(135deg,rgba(15,15,26,0.97),rgba(8,12,20,0.96))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(255,255,255,0.18)_3px,rgba(255,255,255,0.18)_4px)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00ff88]/50 to-transparent" />

      <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[#1e1e3a] bg-[#0d111c] shadow-[0_0_30px_rgba(0,255,136,0.16)]">
            <TerminalSquare className="size-6 text-[#00ff88]" />
          </div>
          <div>
            <div className="font-heading text-2xl uppercase tracking-[0.28em] text-[#f3f3f8]">
              POLYINTEL
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.25em] text-[#6f6f88]">
              Browser-native Polymarket terminal
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 xl:min-w-[930px]">
          <Stat label="Portfolio Value" value={formatUsd(metrics.portfolioValue)} tone="green" />
          <Stat
            label="Daily P&L"
            value={`${metrics.dailyPnl >= 0 ? "+" : ""}${formatUsd(metrics.dailyPnl)}`}
            tone={metrics.dailyPnl > 0 ? "green" : metrics.dailyPnl < 0 ? "red" : "neutral"}
          />
          <Stat
            label="Win Rate"
            value={`${metrics.winRate.toFixed(0)}%`}
            tone={metrics.winRate >= 55 ? "green" : metrics.winRate >= 40 ? "amber" : "red"}
          />
          <div className="rounded-xl border border-[#1e1e3a] bg-[#10101b]/90 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[#73738d]">Alerts</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="border-[#ffaa00]/30 bg-[#ffaa00]/12 text-[#ffaa00]">
                <Bell className="size-3" />
                {activeAlerts}
              </Badge>
              <span className="text-sm text-[#d7d7e2]">
                {activeAlerts ? "Watching risk + price spikes" : "All clear"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[#1e1e3a] bg-[#10101b]/90 px-3 py-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#73738d]">Bias Tape</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-[#d7d7e2]">
                {metrics.dailyPnl >= 0 ? (
                  <TrendingUp className="size-4 text-[#00ff88]" />
                ) : (
                  <TrendingDown className="size-4 text-[#ff4444]" />
                )}
                Live paper flow
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="border-[#1e1e3a] bg-[#0b0e17] text-[#c8c8d4] hover:bg-[#141a2c] hover:text-white"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
