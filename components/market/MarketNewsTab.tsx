"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveBetMarket, ResearchArticle } from "@/lib/market-helpers";
import { analyzeSentiment } from "@/lib/sentiment";

async function fetchNews(question: string) {
  const [google, rss, newsdata] = await Promise.all([
    fetch(`/api/news/google?question=${encodeURIComponent(question)}`).then((res) => res.json()),
    fetch(`/api/news/rss?question=${encodeURIComponent(question)}`).then((res) => res.json()),
    fetch(`/api/news/newsdata?question=${encodeURIComponent(question)}`).then((res) => res.json()),
  ]);

  const combined = [...google, ...rss, ...newsdata] as ResearchArticle[];
  const deduped = new Map<string, ResearchArticle>();

  combined.forEach((article) => {
    const key = article.title.trim().toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, article);
    }
  });

  return Array.from(deduped.values()).sort((a, b) => b.timestamp - a.timestamp);
}

function getSentimentTone(title: string) {
  const sentiment = analyzeSentiment(title);
  if (sentiment === "bullish") return "BULLISH";
  if (sentiment === "bearish") return "BEARISH";
  return "NEUTRAL";
}

export default function MarketNewsTab({ market }: { market: LiveBetMarket }) {
  const newsQuery = useQuery({
    queryKey: ["market-news", market.id],
    queryFn: () => fetchNews(market.question),
    staleTime: 240_000,
    refetchInterval: 300_000,
  });

  const articles = useMemo(() => newsQuery.data ?? [], [newsQuery.data]);

  return (
    <Card className="border border-[#1e1e3a] bg-[#0f0f1a]">
      <CardContent className="space-y-3 p-5">
        {newsQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-[#1e1e3a] bg-[#121524]" />
          ))
        ) : articles.length ? (
          articles.map((article) => {
            const tone = getSentimentTone(article.title);
            return (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-[#1e1e3a] bg-[#111523] p-4 transition-colors hover:border-[#344066]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-[#7e869d]">{article.source}</div>
                  <div className="text-xs text-[#8f97ac]">
                    {formatDistanceToNow(article.timestamp, { addSuffix: true })}
                  </div>
                </div>
                <div className="mt-2 text-lg leading-7 text-white">{article.title}</div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#aeb5c8]">{article.description}</p>
                <div className="mt-3">
                  <Badge
                    className={
                      tone === "BULLISH"
                        ? "border-[#00ff88]/35 bg-[#00ff88]/10 text-[#00ff88]"
                        : tone === "BEARISH"
                          ? "border-[#ff4444]/35 bg-[#ff4444]/10 text-[#ff4444]"
                          : "border-[#ffaa00]/35 bg-[#ffaa00]/10 text-[#ffaa00]"
                    }
                  >
                    {tone}
                  </Badge>
                </div>
              </a>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#1e1e3a] bg-[#111523] p-6 text-sm text-[#98a0b4]">
            No matched news yet for this market.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
