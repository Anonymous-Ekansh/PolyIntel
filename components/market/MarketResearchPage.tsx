"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketNewsTab from "@/components/market/MarketNewsTab";
import MarketPriceChartTab from "@/components/market/MarketPriceChartTab";
import MarketRelatedBetsTab from "@/components/market/MarketRelatedBetsTab";
import MarketOrderBookTab from "@/components/market/MarketOrderBookTab";
import { formatTimeRemaining, getRelatedMarkets, LiveBetMarket, normalizeMarket } from "@/lib/market-helpers";
import { formatPercent, formatUsd } from "@/lib/utils";
import { RawMarket } from "@/types";

async function fetchMarkets() {
  const res = await fetch("/api/markets");
  if (!res.ok) throw new Error("Failed to load markets");
  const data = (await res.json()) as RawMarket[];
  return data
    .map(normalizeMarket)
    .filter((market): market is LiveBetMarket => Boolean(market));
}

export default function MarketResearchPage({ marketId }: { marketId: string }) {
  const marketsQuery = useQuery({
    queryKey: ["markets", marketId],
    queryFn: fetchMarkets,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const market = useMemo(
    () => marketsQuery.data?.find((entry) => entry.id === marketId),
    [marketId, marketsQuery.data],
  );
  const relatedMarkets = useMemo(
    () => (market && marketsQuery.data ? getRelatedMarkets(marketsQuery.data, market) : []),
    [market, marketsQuery.data],
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 text-[#c8c8d4] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#1e1e3a] bg-[#0f1421] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#b4bbce] hover:border-[#334066] hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to all bets
          </Link>
        </div>

        {marketsQuery.isLoading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-3xl border border-[#1e1e3a] bg-[#0f0f1a]" />
            <div className="h-[520px] animate-pulse rounded-3xl border border-[#1e1e3a] bg-[#0f0f1a]" />
          </div>
        ) : !market ? (
          <div className="rounded-3xl border border-[#1e1e3a] bg-[#0f0f1a] p-8 text-sm text-[#aab2c7]">
            Market not found.
          </div>
        ) : (
          <div className="space-y-5">
            <Card className="border border-[#1e1e3a] bg-[linear-gradient(135deg,rgba(15,15,26,0.98),rgba(12,16,25,0.98))]">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-4xl">
                    <div className="text-[10px] uppercase tracking-[0.26em] text-[#6f768c]">Market research</div>
                    <h1 className="mt-3 font-heading text-3xl leading-tight text-white">{market.question}</h1>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-[#133423] bg-[#0b1611] p-4">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#5f8d76]">YES</div>
                      <div className="mt-2 text-3xl font-semibold text-[#00ff88]">{formatPercent(market.yesPrice)}</div>
                    </div>
                    <div className="rounded-2xl border border-[#3d171b] bg-[#170b0e] p-4">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#b47a82]">NO</div>
                      <div className="mt-2 text-3xl font-semibold text-[#ff4444]">{formatPercent(market.noPrice)}</div>
                    </div>
                    <div className="rounded-2xl border border-[#1e1e3a] bg-[#0f1421] p-4">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#6f768c]">Volume</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{formatUsd(market.volume24hr, true)}</div>
                    </div>
                    <div className="rounded-2xl border border-[#1e1e3a] bg-[#0f1421] p-4">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#6f768c]">Time Left</div>
                      <div className="mt-2 text-lg font-semibold text-white">{formatTimeRemaining(market.endDate)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="news" className="gap-4">
              <TabsList variant="line" className="w-full justify-start gap-2 rounded-2xl border border-[#1e1e3a] bg-[#0f1421] p-2">
                <TabsTrigger className="rounded-xl px-4 py-2 data-active:bg-[#131b2b] data-active:text-white" value="news">
                  NEWS
                </TabsTrigger>
                <TabsTrigger className="rounded-xl px-4 py-2 data-active:bg-[#131b2b] data-active:text-white" value="chart">
                  PRICE CHART
                </TabsTrigger>
                <TabsTrigger className="rounded-xl px-4 py-2 data-active:bg-[#131b2b] data-active:text-white" value="related">
                  RELATED BETS
                </TabsTrigger>
                <TabsTrigger className="rounded-xl px-4 py-2 data-active:bg-[#131b2b] data-active:text-white" value="orderbook">
                  ORDER BOOK
                </TabsTrigger>
              </TabsList>

              <TabsContent value="news">
                <MarketNewsTab market={market} />
              </TabsContent>
              <TabsContent value="chart">
                <MarketPriceChartTab market={market} />
              </TabsContent>
              <TabsContent value="related">
                <MarketRelatedBetsTab markets={relatedMarkets} />
              </TabsContent>
              <TabsContent value="orderbook">
                <MarketOrderBookTab market={market} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
