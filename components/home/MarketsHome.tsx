"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  filterMarkets,
  formatTimeRemaining,
  getHighVolumeThreshold,
  getScoreTone,
  LiveBetMarket,
  MarketFilter,
  normalizeMarket,
} from "@/lib/market-helpers";
import { cn, formatPercent, formatUsd } from "@/lib/utils";
import { RawMarket } from "@/types";

async function fetchMarkets() {
  const res = await fetch("/api/markets");
  if (!res.ok) throw new Error("Failed to load markets");
  const data = (await res.json()) as RawMarket[];
  return data
    .map(normalizeMarket)
    .filter((market): market is LiveBetMarket => Boolean(market))
    .sort((a, b) => b.score - a.score || b.volume24hr - a.volume24hr);
}

const FILTERS: Array<{ key: MarketFilter; label: string }> = [
  { key: "all", label: "ALL" },
  { key: "easy-win", label: "EASY WIN" },
  { key: "high-volume", label: "HIGH VOLUME" },
  { key: "ending-soon", label: "ENDING SOON" },
];

export default function MarketsHome() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<MarketFilter>("all");
  const deferredSearch = useDeferredValue(search);

  const marketsQuery = useQuery({
    queryKey: ["markets-home"],
    queryFn: fetchMarkets,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const markets = marketsQuery.data ?? [];
  const filteredMarkets = useMemo(
    () => filterMarkets(markets, activeFilter, deferredSearch),
    [activeFilter, deferredSearch, markets],
  );
  const highVolumeThreshold = useMemo(() => getHighVolumeThreshold(markets), [markets]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 text-[#c8c8d4] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1680px]">
        <header className="mb-6 rounded-3xl border border-[#1e1e3a] bg-[linear-gradient(135deg,rgba(15,15,26,0.97),rgba(12,16,25,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="font-heading text-3xl uppercase tracking-[0.28em] text-white">
                POLYINTEL
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#9da5bb]">
                Live Polymarket bets only. Search the board, score the best setups, and click into a
                full research page for any market.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,420px)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6d7488]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search bets by keyword"
                  className="h-11 border-[#1e1e3a] bg-[#0c1019] pl-10 text-white placeholder:text-[#6d7488]"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#1e1e3a] bg-[#0c1019] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#8b93a7]">
                <TimerReset className="size-4 text-[#00ff88]" />
                Refresh 60s
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs tracking-[0.2em] transition-colors",
                  activeFilter === filter.key
                    ? "border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]"
                    : "border-[#1e1e3a] bg-[#101422] text-[#98a0b4] hover:border-[#30385c] hover:text-white",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#7d8497]">
          <Badge className="border-[#1e1e3a] bg-[#0f1421] text-[#c8c8d4]">
            {markets.length} live bets
          </Badge>
          <Badge className="border-[#1e1e3a] bg-[#0f1421] text-[#c8c8d4]">
            High volume {formatUsd(highVolumeThreshold, true)}+
          </Badge>
          <Badge className="border-[#1e1e3a] bg-[#0f1421] text-[#c8c8d4]">
            Showing {filteredMarkets.length}
          </Badge>
        </div>

        {marketsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="h-[220px] animate-pulse rounded-3xl border border-[#1e1e3a] bg-[#0f0f1a]"
              />
            ))}
          </div>
        ) : marketsQuery.isError ? (
          <div className="rounded-3xl border border-[#ff4444]/25 bg-[#2a1014] p-6 text-sm text-[#ffc2c2]">
            Failed to load Polymarket markets from `/api/markets`.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredMarkets.map((market) => {
              const scoreTone = getScoreTone(market.score);
              return (
                <Link key={market.id} href={`/market/${market.id}`} className="block">
                  <Card
                    className={cn(
                      "h-full border border-[#1e1e3a] bg-[linear-gradient(180deg,rgba(15,15,26,0.98),rgba(11,14,22,0.98))] transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#334066]",
                      scoreTone === "green" && "border-l-4 border-l-[#00ff88]",
                      scoreTone === "amber" && "border-l-4 border-l-[#ffaa00]",
                      scoreTone === "red" && "border-l-4 border-l-[#ff4444]",
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="line-clamp-3 text-base leading-6 text-white">{market.question}</h2>
                        <Badge
                          className={cn(
                            "shrink-0 border",
                            scoreTone === "green" && "border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]",
                            scoreTone === "amber" && "border-[#ffaa00]/35 bg-[#ffaa00]/10 text-[#ffaa00]",
                            scoreTone === "red" && "border-[#ff4444]/35 bg-[#ff4444]/10 text-[#ff4444]",
                          )}
                        >
                          {market.score}
                        </Badge>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-[#133423] bg-[#0b1611] p-3">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-[#5f8d76]">YES</div>
                          <div className="mt-2 text-3xl font-semibold text-[#00ff88]">
                            {formatPercent(market.yesPrice)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-[#3d171b] bg-[#170b0e] p-3">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-[#b47a82]">NO</div>
                          <div className="mt-2 text-3xl font-semibold text-[#ff4444]">
                            {formatPercent(market.noPrice)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-[#b2bbcf]">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-[#6d7488]">24h Volume</div>
                          <div className="mt-1">{formatUsd(market.volume24hr, true)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-[#6d7488]">Time Remaining</div>
                          <div className="mt-1">{formatTimeRemaining(market.endDate)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
