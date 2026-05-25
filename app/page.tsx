"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BarChart3, TrendingDown, TrendingUp, Zap, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatUsd } from "@/lib/utils";
import { fetchBestBets, fetchMarkets, fetchAnomalies } from "@/lib/api";
import WatchlistButton from "@/components/WatchlistButton";
import ScoreBadge from "@/components/shared/ScoreBadge";
import ConfidenceDots from "@/components/shared/ConfidenceDots";

const ANOMALY_COLORS: Record<string, string> = {
  VOLUME_SPIKE: "text-yellow-400 bg-yellow-400/10 border-yellow-500/20",
  PRICE_JUMP: "text-blue-400 bg-blue-400/10 border-blue-500/20",
  WHALE_TRADE: "text-purple-400 bg-purple-400/10 border-purple-500/20",
  LIQUIDITY_DROP: "text-red-400 bg-red-400/10 border-red-500/20",
  BOOK_IMBALANCE: "text-cyan-400 bg-cyan-400/10 border-cyan-500/20",
};

export default function DashboardPage() {
  // Fetch markets for metric computations
  const { data: markets } = useQuery({
    queryKey: ["markets-all"],
    queryFn: () => fetchMarkets({ limit: 100 }),
    refetchInterval: 60_000,
  });

  // Best bets from analyzer
  const { data: bestBets, isLoading: betsLoading } = useQuery({
    queryKey: ["best-bets"],
    queryFn: fetchBestBets,
    refetchInterval: 120_000,
  });

  // Anomalies
  const { data: anomalies } = useQuery({
    queryKey: ["anomalies"],
    queryFn: fetchAnomalies,
    refetchInterval: 60_000,
  });

  // Compute metrics from markets
  const metrics = (() => {
    if (!markets || !Array.isArray(markets)) return null;
    const total = markets.length;
    const sorted = [...markets].sort((a: any, b: any) => b.volume24hr - a.volume24hr);
    const topVolume = sorted[0] ?? null;

    // Biggest movers
    const withChange = markets.filter((m: any) => Math.abs(m.oneDayPriceChange ?? 0) > 0);
    withChange.sort((a: any, b: any) => (b.oneDayPriceChange ?? 0) - (a.oneDayPriceChange ?? 0));
    const biggestYes = withChange[0] ?? null;
    const biggestNo = withChange[withChange.length - 1] ?? null;

    return {
      total,
      topVolume,
      biggestYes,
      biggestNo,
      anomalyCount: Array.isArray(anomalies) ? anomalies.length : 0,
    };
  })();

  const trending = markets ? [...(markets as any[])].sort((a, b) => b.volume24hr - a.volume24hr).slice(0, 6) : [];

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-widest text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-[#8b93a7]">
          Live Polymarket Intelligence — Server-side aggregated to bypass network restrictions.
        </p>
      </div>

      {/* ── Stat Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-[#1e1e3a] bg-[#0c1019]">
          <CardContent className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Active Markets</div>
            <div className="mt-2 text-3xl font-semibold text-white">{metrics?.total ?? "—"}</div>
          </CardContent>
        </Card>

        <Card className="border-[#1e1e3a] bg-[#0c1019]">
          <CardContent className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Top Volume (24h)</div>
            <div className="mt-2 text-xl font-semibold text-[#00ff88] truncate">
              {metrics?.topVolume ? formatUsd(metrics.topVolume.volume24hr, true) : "—"}
            </div>
            <div className="mt-1 text-xs text-[#8b93a7] truncate">{metrics?.topVolume?.question}</div>
          </CardContent>
        </Card>

        <Card className="border-[#1e1e3a] bg-[#0c1019]">
          <CardContent className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Biggest Mover ↑</div>
            <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-[#00ff88]">
              <TrendingUp className="size-5" />
              {metrics?.biggestYes ? `+${(metrics.biggestYes.oneDayPriceChange ?? 0).toFixed(1)}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-[#8b93a7] truncate">{metrics?.biggestYes?.question}</div>
          </CardContent>
        </Card>

        <Card className="border-[#1e1e3a] bg-[#0c1019]">
          <CardContent className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Anomalies Detected</div>
            <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-[#ffaa00]">
              <AlertTriangle className="size-5" />
              {metrics?.anomalyCount ?? 0}
            </div>
            <div className="mt-1 text-xs text-[#8b93a7]">
              <Link href="/intelligence" className="hover:text-white transition-colors flex items-center gap-1">
                View feed <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Best Bets Today ──────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg uppercase tracking-widest text-white flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6]">★</span>
              Best Bets Today
            </h2>
            <Link href="/analyze" className="text-xs text-[#00ff88] hover:underline flex items-center gap-1">
              Full Analysis <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {betsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-2xl bg-[#1e1e3a]/30" />)}
            </div>
          ) : bestBets ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* YES picks */}
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-widest text-green-400 font-bold flex items-center gap-2">
                  <TrendingUp className="size-3.5" /> Lean YES Picks
                </div>
                {(bestBets.yesPicks ?? []).length === 0 ? (
                  <div className="text-xs text-[#6d7488] p-4 border border-[#1e1e3a] rounded-xl bg-[#0c1019]">
                    No strong YES picks found today.
                  </div>
                ) : (
                  (bestBets.yesPicks ?? []).map((pick: any) => (
                    <Link key={pick.conditionId} href={`/market/${pick.conditionId}`}>
                      <Card className="border-[#1e1e3a] bg-[#0c1019] hover:border-green-500/30 transition-all group">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <ScoreBadge recommendation={pick.advisor.recommendation} color={pick.advisor.recommendationColor} size="sm" />
                            <ConfidenceDots level={pick.advisor.confidence} />
                          </div>
                          <h3 className="text-xs text-[#d7d7e2] line-clamp-2 mb-2 group-hover:text-white">{pick.question}</h3>
                          <div className="flex items-center gap-3 text-[10px] text-[#6d7488]">
                            <span className="text-green-400 font-mono font-bold">{formatPercent(pick.yesPrice, 0)}</span>
                            <span>•</span>
                            <span>{pick.daysLeft}d left</span>
                            <span>•</span>
                            <span>Score: {pick.advisor.finalScore > 0 ? "+" : ""}{pick.advisor.finalScore}</span>
                          </div>
                          <p className="mt-2 text-[10px] text-[#6d7488] line-clamp-2 leading-relaxed">
                            {typeof pick.advisor.reasoning === 'string' ? pick.advisor.reasoning : pick.advisor.reasoning?.inference}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>

              {/* NO picks */}
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-widest text-red-400 font-bold flex items-center gap-2">
                  <TrendingDown className="size-3.5" /> Lean NO Picks
                </div>
                {(bestBets.noPicks ?? []).length === 0 ? (
                  <div className="text-xs text-[#6d7488] p-4 border border-[#1e1e3a] rounded-xl bg-[#0c1019]">
                    No strong NO picks found today.
                  </div>
                ) : (
                  (bestBets.noPicks ?? []).map((pick: any) => (
                    <Link key={pick.conditionId} href={`/market/${pick.conditionId}`}>
                      <Card className="border-[#1e1e3a] bg-[#0c1019] hover:border-red-500/30 transition-all group">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <ScoreBadge recommendation={pick.advisor.recommendation} color={pick.advisor.recommendationColor} size="sm" />
                            <ConfidenceDots level={pick.advisor.confidence} />
                          </div>
                          <h3 className="text-xs text-[#d7d7e2] line-clamp-2 mb-2 group-hover:text-white">{pick.question}</h3>
                          <div className="flex items-center gap-3 text-[10px] text-[#6d7488]">
                            <span className="text-red-400 font-mono font-bold">{formatPercent(pick.yesPrice, 0)}</span>
                            <span>•</span>
                            <span>{pick.daysLeft}d left</span>
                            <span>•</span>
                            <span>Score: {pick.advisor.finalScore}</span>
                          </div>
                          <p className="mt-2 text-[10px] text-[#6d7488] line-clamp-2 leading-relaxed">
                            {typeof pick.advisor.reasoning === 'string' ? pick.advisor.reasoning : pick.advisor.reasoning?.inference}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {/* Trending Markets */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg uppercase tracking-widest text-white flex items-center gap-2">
                <BarChart3 className="size-5 text-[#00ff88]" /> Trending Markets
              </h2>
              <Link href="/markets" className="text-xs text-[#00ff88] hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="size-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trending.map((market: any) => (
                <Link key={market.conditionId} href={`/market/${market.conditionId}`}>
                  <Card className="h-full border-[#1e1e3a] bg-[#0c1019] hover:bg-[#131b2b] hover:border-[#334066] transition-all">
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h3 className="text-sm text-white line-clamp-2 leading-snug flex-1">{market.question}</h3>
                        <WatchlistButton conditionId={market.conditionId} />
                      </div>
                      <div className="mt-auto grid grid-cols-3 gap-2">
                        <div className="rounded bg-[#101422] p-2 text-center border border-[#1e1e3a]">
                          <div className="text-[9px] text-[#00ff88] mb-1">YES</div>
                          <div className="text-sm font-semibold">{formatPercent(market.yesPrice, 0)}</div>
                        </div>
                        <div className="rounded bg-[#101422] p-2 text-center border border-[#1e1e3a]">
                          <div className="text-[9px] text-[#ff4444] mb-1">NO</div>
                          <div className="text-sm font-semibold">{formatPercent(market.noPrice, 0)}</div>
                        </div>
                        <div className="rounded bg-[#101422] p-2 text-center border border-[#1e1e3a]">
                          <div className="text-[9px] text-[#8b93a7] mb-1">VOL</div>
                          <div className="text-sm font-semibold">{formatUsd(market.volume24hr, true)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Live Anomaly Feed ────────────────── */}
        <div className="space-y-4">
          <h2 className="text-lg uppercase tracking-widest text-white flex items-center gap-2">
            <Zap className="size-5 text-[#ffaa00]" /> Live Anomaly Feed
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {!anomalies || (Array.isArray(anomalies) && anomalies.length === 0) ? (
              <div className="text-xs text-[#6d7488] p-4 border border-[#1e1e3a] rounded-xl bg-[#0c1019] text-center">
                No anomalies detected yet. The scanner runs every 2 minutes.
              </div>
            ) : (
              (anomalies as any[]).slice(0, 20).map((anomaly: any, i: number) => (
                <div
                  key={`${anomaly.marketId}-${anomaly.type}-${i}`}
                  className={`rounded-lg border p-3 text-xs ${ANOMALY_COLORS[anomaly.type] || "text-gray-400 bg-gray-400/10 border-gray-500/20"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      {anomaly.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] opacity-60">
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 line-clamp-1 mb-1">{anomaly.question}</p>
                  <p className="text-[10px] opacity-60">{anomaly.detail}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
