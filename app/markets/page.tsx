"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Search, Clock, ArrowRight, BarChart3, Info } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPercent, formatUsd } from "@/lib/utils";
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
  category: string;
}

const CATEGORIES = ["All", "Politics", "Crypto", "Sports", "Economics", "Science", "Other"];
type SortOption = "volume" | "liquidity" | "ends-soon" | "newest";

export default function MarketsBrowserPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("volume");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: markets, isLoading, isError, dataUpdatedAt } = useQuery<Market[]>({
    queryKey: ["markets-all"],
    queryFn: async () => {
      const res = await fetch("/api/markets");
      if (!res.ok) throw new Error("Failed to fetch markets");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (dataUpdatedAt) setLastUpdated(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  const filteredAndSorted = useMemo(() => {
    if (!markets) return [];

    let result = [...markets];

    // Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(m => m.question.toLowerCase().includes(lowerSearch));
    }

    // Category filter (simplified matching based on string inclusion for now, or just generic matching)
    if (category !== "All") {
      const lowerCat = category.toLowerCase();
      result = result.filter(m => {
        const cat = (m.category || "").toLowerCase();
        const q = m.question.toLowerCase();
        
        if (lowerCat === "politics" && /\b(trump|biden|election|senate|congress|political)\b/.test(q)) return true;
        if (lowerCat === "crypto" && /\b(bitcoin|crypto|eth|sol|token|blockchain)\b/.test(q)) return true;
        if (lowerCat === "sports" && /\b(nba|nfl|soccer|tennis|ufc|boxing|championship)\b/.test(q)) return true;
        if (lowerCat === "economics" && /\b(gdp|inflation|fed|economy|rate)\b/.test(q)) return true;
        if (lowerCat === "science" && /\b(space|nasa|ai|openai|science|moon)\b/.test(q)) return true;
        
        return cat.includes(lowerCat);
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "volume") return b.volume24hr - a.volume24hr;
      if (sortBy === "liquidity") return b.liquidity - a.liquidity;
      if (sortBy === "ends-soon") {
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }
      if (sortBy === "newest") {
        // We don't have createdAt easily, so proxy by conditionId or ID if numerical
        return b.id.localeCompare(a.id); 
      }
      return 0;
    });

    return result;
  }, [markets, search, category, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginated = filteredAndSorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, category, sortBy]);

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl uppercase tracking-widest text-white flex items-center gap-3">
            <BarChart3 className="size-8 text-[#00ff88]" />
            Market Browser
          </h1>
          <p className="mt-2 text-sm text-[#8b93a7]">
            Scan all active Polymarket contracts and find trading opportunities.
          </p>
        </div>
        
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-[#6d7488]">
            <Clock className="size-3" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#1e1e3a] bg-[#0c1019] p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6d7488]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search market question..."
            className="h-10 border-[#1e1e3a] bg-[#101422] pl-10 text-white placeholder:text-[#6d7488]"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20"
                  : "bg-[#101422] text-[#8b93a7] border border-[#1e1e3a] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="w-full lg:w-48 shrink-0">
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
            <SelectTrigger className="h-10 border-[#1e1e3a] bg-[#101422] text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="border-[#1e1e3a] bg-[#0c1019] text-white">
              <SelectItem value="volume">Volume (24h)</SelectItem>
              <SelectItem value="liquidity">Liquidity</SelectItem>
              <SelectItem value="ends-soon">Ends Soonest</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-[280px] rounded-2xl bg-[#1e1e3a]/30 animate-pulse" />)}
        </div>
      ) : isError ? (
         <div className="rounded-2xl border border-[#ff4444]/20 bg-[#2a1014] p-6 text-center text-[#ffc2c2]">
          Failed to load markets.
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c1019] py-20 text-center">
          <Info className="mx-auto size-12 text-[#30385c] mb-4" />
          <h3 className="text-lg text-white font-medium">No markets found</h3>
          <p className="text-[#6d7488] mt-1 text-sm">Try adjusting your search or category filters.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-xs tracking-wider text-[#6d7488]">
            SHOWING {paginated.length} OF {filteredAndSorted.length} MARKETS
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((market) => (
              <Card key={market.conditionId} className="flex flex-col border-[#1e1e3a] bg-[#0c1019] hover:border-[#334066] transition-all group">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="text-sm text-[#d7d7e2] line-clamp-3 leading-snug group-hover:text-white flex-1 min-h-[60px]">
                      {market.question}
                    </h3>
                    <WatchlistButton conditionId={market.conditionId} />
                  </div>

                  {/* Probabilities Bar */}
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

                  {/* Stats Grid */}
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

                  {/* Analyze Button */}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded bg-[#101422] border border-[#1e1e3a] text-sm text-white disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-sm text-[#8b93a7] mx-4">
                Page {page} of {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded bg-[#101422] border border-[#1e1e3a] text-sm text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
