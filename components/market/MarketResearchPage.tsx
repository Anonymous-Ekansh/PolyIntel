"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatUsd } from "@/lib/utils";
import WatchlistButton from "@/components/WatchlistButton";
import { fetchMarketFull } from "@/lib/api";

import ProbabilityChart from "./ProbabilityChart";
import VolumeChart from "./VolumeChart";
import OrderBookPanel from "./OrderBookPanel";
import TradesTable from "./TradesTable";
import AdvisorPanel from "./AdvisorPanel";
import NewsPanel from "./NewsPanel";

export default function MarketResearchPage({ marketId }: { marketId: string }) {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ["marketFull", marketId],
    queryFn: () => fetchMarketFull(marketId),
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1680px]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 rounded-lg border border-[#1e1e3a] bg-[#101422] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#8b93a7] transition-colors hover:border-[#334066] hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Markets
          </Link>
          
          {dataUpdatedAt && (
             <div className="flex items-center gap-2 text-xs text-[#6d7488]">
               <Clock className="size-3" />
               Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
             </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 rounded-2xl bg-[#1e1e3a]/30" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[500px] rounded-2xl bg-[#1e1e3a]/30" />
              <div className="h-[500px] rounded-2xl bg-[#1e1e3a]/30" />
            </div>
          </div>
        ) : isError || !data || !data.market ? (
          <div className="rounded-2xl border border-[#ff4444]/20 bg-[#2a1014] p-8 text-center text-sm text-[#ffc2c2]">
            Market not found or failed to load. Ensure backend is running.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-[#1e1e3a] bg-[linear-gradient(135deg,rgba(15,15,26,0.98),rgba(12,16,25,0.98))]">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-[10px] uppercase tracking-widest text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded border border-[#8b5cf6]/20">
                        {data.market.category || "General"}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">
                        ID: {data.market.conditionId.slice(0, 10)}...
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <h1 className="font-heading text-2xl leading-snug text-white max-w-3xl">
                        {data.market.question}
                      </h1>
                      <WatchlistButton conditionId={data.market.conditionId} size="md" className="shrink-0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 shrink-0">
                    <div className="rounded-xl border border-[#133423] bg-[#0b1611] p-4 text-center">
                      <div className="text-[10px] uppercase tracking-widest text-[#5f8d76]">YES</div>
                      <div className="mt-1 text-2xl font-bold text-[#00ff88]">{formatPercent(data.market.yesPrice, 0)}</div>
                    </div>
                    <div className="rounded-xl border border-[#3d171b] bg-[#170b0e] p-4 text-center">
                      <div className="text-[10px] uppercase tracking-widest text-[#b47a82]">NO</div>
                      <div className="mt-1 text-2xl font-bold text-[#ff4444]">{formatPercent(data.market.noPrice, 0)}</div>
                    </div>
                    <div className="rounded-xl border border-[#1e1e3a] bg-[#101422] p-4 text-center">
                      <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Volume</div>
                      <div className="mt-1 text-xl font-mono text-white">{formatUsd(data.market.volume24hr, true)}</div>
                    </div>
                    <div className="rounded-xl border border-[#1e1e3a] bg-[#101422] p-4 text-center">
                      <div className="text-[10px] uppercase tracking-widest text-[#6d7488]">Ends</div>
                      <div className="mt-1 text-sm font-mono text-white mt-2">
                        {data.market.endDate ? formatDistanceToNowStrict(new Date(data.market.endDate), { addSuffix: true }) : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Charts */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-[#1e1e3a] bg-[#0c1019]">
                  <CardContent className="p-6">
                    <ProbabilityChart history={data.priceHistory} />
                    <VolumeChart volume24h={data.market.volume24hr} />
                  </CardContent>
                </Card>

                {/* Advisor Panel */}
                <AdvisorPanel score={data.score} />
              </div>

              {/* Right Column: Orderbook & Trades */}
              <div className="space-y-6">
                <OrderBookPanel book={data.orderbook} />
                <TradesTable trades={data.trades} />
              </div>

            </div>

            {/* Bottom Row: News */}
            <div className="pt-4">
              <h2 className="text-lg uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-sm bg-[#00ff88]/20 text-[#00ff88]">
                  📰
                </span>
                Related News
              </h2>
              <NewsPanel news={data.news} />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
