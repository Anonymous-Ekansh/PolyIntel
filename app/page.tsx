"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent, formatUsd } from "@/lib/utils";
import WatchlistButton from "@/components/WatchlistButton";

// Need to duplicate the type here or import it if exported
interface DashboardData {
  metrics: {
    totalActiveMarkets: number;
    topVolumeMarket: { question: string; volume: number } | null;
    biggestYesMover: { question: string; change: number } | null;
    biggestNoMover: { question: string; change: number } | null;
  };
  trending: Array<{
    id: string;
    conditionId: string;
    question: string;
    yesPrice: number;
    noPrice: number;
    volume24hr: number;
    endDate: string;
  }>;
  topScored: Array<{
    conditionId: string;
    question: string;
    yesPrice: number;
    noPrice: number;
    volume24hr: number;
    advisor: any;
  }>;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    refetchInterval: 60_000, // refresh every minute
  });

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-widest text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-[#8b93a7]">
          Live Polymarket Intelligence — Server-side aggregated to bypass network restrictions.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-[#1e1e3a]/30" />)}
          </div>
          <div className="h-64 rounded-2xl bg-[#1e1e3a]/30" />
        </div>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-[#ff4444]/20 bg-[#2a1014] p-6 text-center text-[#ffc2c2]">
          Failed to load dashboard data. Please ensure the backend is running and can access Polymarket.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-[#1e1e3a] bg-[#0c1019]">
              <CardContent className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Total Active Markets</div>
                <div className="mt-2 text-3xl font-semibold text-white">{data.metrics.totalActiveMarkets}</div>
              </CardContent>
            </Card>
            
            <Card className="border-[#1e1e3a] bg-[#0c1019]">
              <CardContent className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Top Volume (24h)</div>
                <div className="mt-2 text-xl font-semibold text-[#00ff88] truncate" title={data.metrics.topVolumeMarket?.question}>
                  {formatUsd(data.metrics.topVolumeMarket?.volume || 0, true)}
                </div>
                <div className="mt-1 text-xs text-[#8b93a7] truncate">{data.metrics.topVolumeMarket?.question}</div>
              </CardContent>
            </Card>

            <Card className="border-[#1e1e3a] bg-[#0c1019]">
              <CardContent className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Biggest YES Mover</div>
                <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-[#00ff88]">
                  <TrendingUp className="size-5" />
                  +{formatPercent(data.metrics.biggestYesMover?.change || 0, 1)}
                </div>
                <div className="mt-1 text-xs text-[#8b93a7] truncate">{data.metrics.biggestYesMover?.question}</div>
              </CardContent>
            </Card>

            <Card className="border-[#1e1e3a] bg-[#0c1019]">
              <CardContent className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Biggest NO Mover</div>
                <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-[#ff4444]">
                  <TrendingDown className="size-5" />
                  {formatPercent(data.metrics.biggestNoMover?.change || 0, 1)}
                </div>
                <div className="mt-1 text-xs text-[#8b93a7] truncate">{data.metrics.biggestNoMover?.question}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Trending Markets */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg uppercase tracking-widest text-white flex items-center gap-2">
                  <BarChart3 className="size-5 text-[#00ff88]" />
                  Trending Markets
                </h2>
                <Link href="/markets" className="text-xs text-[#00ff88] hover:underline flex items-center gap-1">
                  View All <ArrowUpRight className="size-3" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.trending.map((market) => (
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

            {/* Top Scored (Advisor) */}
            <div className="space-y-4">
              <h2 className="text-lg uppercase tracking-widest text-white flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6]">
                  ★
                </span>
                Advisor Picks
              </h2>
              
              <div className="space-y-3">
                {data.topScored.map((market) => (
                  <Link key={market.conditionId} href={`/market/${market.conditionId}`}>
                    <Card className="border-[#1e1e3a] bg-[#0c1019] hover:border-[#8b5cf6]/50 transition-all group">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={
                              market.advisor.recommendation === "LEAN_YES" 
                                ? "border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/10" 
                                : "border-[#ff4444]/30 text-[#ff4444] bg-[#ff4444]/10"
                            }
                          >
                            {market.advisor.recommendation.replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] text-[#8b93a7]">Score: {market.advisor.finalScore > 0 ? "+" : ""}{market.advisor.finalScore}</span>
                        </div>
                        <h3 className="text-xs text-[#d7d7e2] line-clamp-2 mb-3 group-hover:text-white transition-colors">
                          {market.question}
                        </h3>
                        <p className="text-[10px] text-[#6d7488] line-clamp-2 leading-relaxed">
                          {market.advisor.summary}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
