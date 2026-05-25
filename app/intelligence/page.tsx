"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Zap, GitCompare, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import { fetchAnomalies, fetchDivergences, fetchMarkets } from "@/lib/api";

const ANOMALY_ICON_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  VOLUME_SPIKE:   { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
  PRICE_JUMP:     { color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-500/20" },
  WHALE_TRADE:    { color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20" },
  LIQUIDITY_DROP: { color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-500/20" },
  BOOK_IMBALANCE: { color: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-500/20" },
};

export default function IntelligencePage() {
  const { data: anomalies } = useQuery({
    queryKey: ["anomalies"],
    queryFn: fetchAnomalies,
    refetchInterval: 60_000,
  });

  const { data: divergences } = useQuery({
    queryKey: ["divergences"],
    queryFn: fetchDivergences,
    refetchInterval: 120_000,
  });

  const { data: markets } = useQuery({
    queryKey: ["markets-all"],
    queryFn: () => fetchMarkets({ limit: 100 }),
    refetchInterval: 60_000,
  });

  // Top movers
  const topMovers = (() => {
    if (!markets || !Array.isArray(markets)) return [];
    return [...markets]
      .filter((m: any) => Math.abs(m.oneDayPriceChange ?? 0) > 0)
      .sort((a: any, b: any) => Math.abs(b.oneDayPriceChange ?? 0) - Math.abs(a.oneDayPriceChange ?? 0))
      .slice(0, 15);
  })();

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-widest text-white flex items-center gap-3">
          <Zap className="size-8 text-[#ffaa00]" />
          Intelligence Feed
        </h1>
        <p className="mt-2 text-sm text-[#8b93a7]">
          Live feed of everything unusual happening across all markets. Auto-refreshes every 60 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── ANOMALIES (Left) ───────────────── */}
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-[#ffaa00] font-bold flex items-center gap-2">
            <Zap className="size-4" /> Live Anomalies
          </h2>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {!anomalies || (Array.isArray(anomalies) && anomalies.length === 0) ? (
              <div className="text-xs text-[#6d7488] p-6 border border-[#1e1e3a] rounded-xl bg-[#0c1019] text-center">
                No anomalies detected yet. The scanner runs every 2 minutes.
              </div>
            ) : (
              (anomalies as any[]).map((anomaly: any, i: number) => {
                const style = ANOMALY_ICON_COLORS[anomaly.type] || { color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-500/20" };
                return (
                  <div
                    key={`${anomaly.marketId}-${anomaly.type}-${i}`}
                    className={`rounded-lg border p-3 ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-bold uppercase tracking-wider text-[10px] ${style.color}`}>
                        {anomaly.type.replace(/_/g, " ")}
                      </span>
                      <span className={`text-[10px] ${style.color} opacity-70`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <Link
                      href={`/market/${anomaly.marketId}`}
                      className="text-[11px] text-[#d7d7e2] hover:text-white transition-colors line-clamp-2 block mb-1"
                    >
                      {anomaly.question}
                    </Link>
                    <p className="text-[10px] text-[#6d7488]">{anomaly.detail}</p>
                    {anomaly.timestamp && (
                      <p className="text-[9px] text-[#4a4f5e] mt-1">
                        {new Date(anomaly.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── DIVERGENCES (Center) ────────────── */}
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-2">
            <GitCompare className="size-4" /> Divergences
          </h2>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {!divergences || (Array.isArray(divergences) && divergences.length === 0) ? (
              <div className="text-xs text-[#6d7488] p-6 border border-[#1e1e3a] rounded-xl bg-[#0c1019] text-center">
                <GitCompare className="mx-auto size-8 text-[#30385c] mb-3" />
                No divergences found. Correlated markets are moving in sync.
              </div>
            ) : (
              (divergences as any[]).map((div: any, i: number) => (
                <Card key={i} className="border-cyan-500/20 bg-cyan-400/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                      Divergence Alert — {div.divergencePct?.toFixed(1)}% split
                    </div>

                    <div className="space-y-2">
                      <Link href={`/market/${div.marketA?.conditionId}`} className="block">
                        <div className="text-xs text-[#d7d7e2] hover:text-white line-clamp-2">{div.marketA?.question}</div>
                        <div className="text-[10px] text-green-400 font-mono">{formatPercent(div.marketA?.yesPrice ?? 0, 0)}</div>
                      </Link>

                      <div className="flex items-center gap-2 text-[10px] text-[#6d7488]">
                        <span>Correlation: <span className="text-cyan-400 font-mono">{div.correlation?.toFixed(2)}</span></span>
                      </div>

                      <Link href={`/market/${div.marketB?.conditionId}`} className="block">
                        <div className="text-xs text-[#d7d7e2] hover:text-white line-clamp-2">{div.marketB?.question}</div>
                        <div className="text-[10px] text-green-400 font-mono">{formatPercent(div.marketB?.yesPrice ?? 0, 0)}</div>
                      </Link>
                    </div>

                    <p className="text-[10px] text-[#6d7488] italic">
                      These markets usually move together but have split — potential mispricing.
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* ── TOP MOVERS (Right) ──────────────── */}
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-[#00ff88] font-bold flex items-center gap-2">
            <TrendingUp className="size-4" /> Top Movers (24h)
          </h2>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {topMovers.length === 0 ? (
              <div className="text-xs text-[#6d7488] p-6 border border-[#1e1e3a] rounded-xl bg-[#0c1019] text-center">
                No movers data available yet.
              </div>
            ) : (
              topMovers.map((market: any, i: number) => {
                const change = market.oneDayPriceChange ?? 0;
                const isUp = change > 0;

                return (
                  <Link key={market.conditionId} href={`/market/${market.conditionId}`}>
                    <div className="rounded-lg border border-[#1e1e3a] bg-[#0c1019] p-3 hover:border-[#334066] transition-all group flex items-center gap-3">
                      <div className={`flex size-8 items-center justify-center rounded-lg ${isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {isUp ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#d7d7e2] truncate group-hover:text-white transition-colors">
                          {market.question}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-green-400 font-mono">{formatPercent(market.yesPrice, 0)}</span>
                        </div>
                      </div>
                      <div className={`text-sm font-mono font-bold shrink-0 ${isUp ? "text-green-400" : "text-red-400"}`}>
                        {isUp ? "+" : ""}{change.toFixed(1)}%
                      </div>
                      <ArrowRight className="size-3 text-[#6d7488] shrink-0 group-hover:text-white" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
