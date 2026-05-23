"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Eye, Info, Trash2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatUsd } from "@/lib/utils";
import { useWatchlist } from "@/hooks/useWatchlist";
import WatchlistButton from "@/components/WatchlistButton";

interface Market {
  id: string;
  conditionId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
  liquidity: number;
  endDate: string;
}

export default function WatchlistPage() {
  const { watchlist, clearAll } = useWatchlist();

  const { data: markets, isLoading, isError } = useQuery<Market[]>({
    queryKey: ["markets-all"], // Reuse the same query key as browser to share cache
    queryFn: async () => {
      const res = await fetch("/api/markets");
      if (!res.ok) throw new Error("Failed to fetch markets");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const watchedMarkets = markets ? markets.filter((m) => watchlist.includes(m.conditionId)) : [];

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl uppercase tracking-widest text-white flex items-center gap-3">
            <Eye className="size-8 text-[#00ff88]" />
            Watchlist
          </h1>
          <p className="mt-2 text-sm text-[#8b93a7]">
            Your saved Polymarket contracts. Stored locally in your browser.
          </p>
        </div>
        
        {watchlist.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 rounded-lg border border-[#ff4444]/20 bg-[#2a1014] px-4 py-2 text-xs uppercase tracking-widest text-[#ff4444] transition-colors hover:bg-[#ff4444]/20"
          >
            <Trash2 className="size-3.5" />
            Clear All
          </button>
        )}
      </div>

      {watchlist.length === 0 ? (
        <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c1019] py-20 text-center">
          <StarOutline className="mx-auto size-12 text-[#30385c] mb-4" />
          <h3 className="text-lg text-white font-medium">Your watchlist is empty</h3>
          <p className="text-[#6d7488] mt-1 text-sm mb-6">Star markets to track them here.</p>
          <Link 
            href="/markets" 
            className="inline-flex items-center gap-2 rounded-lg bg-[#131b2b] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/10 transition-colors"
          >
            Browse Markets <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watchlist.map(id => <div key={id} className="h-[280px] rounded-2xl bg-[#1e1e3a]/30 animate-pulse" />)}
        </div>
      ) : isError ? (
         <div className="rounded-2xl border border-[#ff4444]/20 bg-[#2a1014] p-6 text-center text-[#ffc2c2]">
          Failed to load live data for watched markets.
        </div>
      ) : watchedMarkets.length === 0 ? (
        <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c1019] py-12 text-center text-[#8b93a7]">
          Some markets on your watchlist may have been closed or are no longer available.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watchedMarkets.map((market) => (
            <Card key={market.conditionId} className="flex flex-col border-[#1e1e3a] bg-[#0c1019] hover:border-[#334066] transition-all group">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h3 className="text-sm text-[#d7d7e2] line-clamp-3 leading-snug group-hover:text-white flex-1 min-h-[60px]">
                    {market.question}
                  </h3>
                  <WatchlistButton conditionId={market.conditionId} />
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[#00ff88]">YES {formatPercent(market.yesPrice, 0)}</span>
                    <span className="text-[#ff4444]">NO {formatPercent(market.noPrice, 0)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1e1e3a] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#00ff88]" style={{ width: `${market.yesPrice * 100}%` }} />
                    <div className="h-full bg-[#ff4444]" style={{ width: `${market.noPrice * 100}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 mt-auto text-xs">
                  <div className="bg-[#101422] p-2.5 rounded-lg border border-[#1e1e3a]">
                    <div className="text-[9px] uppercase tracking-wider text-[#6d7488] mb-1">24h Volume</div>
                    <div className="font-mono text-white">{formatUsd(market.volume24hr, true)}</div>
                  </div>
                  <div className="bg-[#101422] p-2.5 rounded-lg border border-[#1e1e3a]">
                    <div className="text-[9px] uppercase tracking-wider text-[#6d7488] mb-1">Liquidity</div>
                    <div className="font-mono text-white">{formatUsd(market.liquidity, true)}</div>
                  </div>
                  <div className="bg-[#101422] p-2.5 rounded-lg border border-[#1e1e3a] col-span-2">
                    <div className="text-[9px] uppercase tracking-wider text-[#6d7488] mb-1">Time Left</div>
                    <div className="font-mono text-[#8b93a7]">
                      {market.endDate ? formatDistanceToNowStrict(new Date(market.endDate), { addSuffix: true }) : "No end date"}
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/market/${market.conditionId}`}
                  className="w-full py-2.5 rounded-lg bg-[#131b2b] text-[#00ff88] text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-[#00ff88]/10 transition-colors border border-[#00ff88]/20"
                >
                  Analyze Market <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StarOutline(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
