"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PanelShell from "@/components/panels/PanelShell";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const ITEM_HEIGHT = 108;
const VIEWPORT_HEIGHT = 320;

export default function NewsFeed() {
  const articles = useAppStore((state) => state.newsArticles);
  const markets = useAppStore((state) => state.markets);
  const setSelectedMarket = useAppStore((state) => state.setSelectedMarket);
  const [scrollTop, setScrollTop] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [articles.length]);

  const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + 4;
  const visible = articles.slice(start, start + visibleCount);

  return (
    <PanelShell
      kicker="Panel 3"
      title="News Feed"
      action={
        <Badge className="border-[#1e1e3a] bg-[#0c101a] text-[#c8c8d4]">
          <Newspaper className="size-3" />
          5m poll
        </Badge>
      }
    >
      <div
        ref={viewportRef}
        className="relative h-[320px] overflow-auto rounded-xl border border-[#1e1e3a] bg-[#0b0f16]"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div style={{ height: articles.length * ITEM_HEIGHT, position: "relative" }}>
          <div style={{ transform: `translateY(${start * ITEM_HEIGHT}px)` }} className="absolute inset-x-0 top-0">
            {visible.map((article) => (
              <article
                key={article.id}
                className="h-[104px] border-b border-[#171b2b] px-4 py-3 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#7f849c]">
                      <span
                        className="inline-flex min-w-[42px] justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: `${article.sourceColor}1a`, color: article.sourceColor }}
                      >
                        {article.sourceIcon}
                      </span>
                      {article.source}
                    </div>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 line-clamp-2 text-sm text-[#f2f2f7] hover:text-white"
                    >
                      {article.title}
                    </a>
                  </div>
                  <div className="shrink-0 text-[11px] text-[#7f849c]">
                    {formatDistanceToNow(article.timestamp, { addSuffix: true })}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {article.matchedMarkets.slice(0, 3).map((match) => {
                    const market = markets.find((entry) => entry.conditionId === match.conditionId);
                    return (
                      <button
                        key={`${article.id}-${match.conditionId}`}
                        onClick={() => market && setSelectedMarket(market)}
                        className={cn(
                          "inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.14em]",
                          "border-[#1e1e3a] bg-[#121728] text-[#b8bfd4] hover:border-[#00ff88]/30 hover:text-white",
                        )}
                      >
                        <span className="truncate">{match.question.slice(0, 26)}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
