"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRSSArticles } from "@/lib/rss";
import { useAppStore } from "@/store/useAppStore";

export function useRSSFeeds() {
  const markets = useAppStore((state) => state.markets);
  const settings = useAppStore((state) => state.settings);
  const setNewsArticles = useAppStore((state) => state.setNewsArticles);
  const setNews = useAppStore((state) => state.setNews);

  const query = useQuery({
    queryKey: ["rss-feeds", markets.length, settings.rss2jsonKey],
    queryFn: () => fetchRSSArticles(markets, settings.rss2jsonKey),
    enabled: markets.length > 0,
    refetchInterval: 300_000,
    staleTime: 240_000,
  });

  useEffect(() => {
    if (!query.data) return;
    setNewsArticles(query.data);

    const grouped = new Map<string, typeof query.data>();
    query.data.forEach((article) => {
      article.matchedMarkets.forEach((match) => {
        grouped.set(match.conditionId, [...(grouped.get(match.conditionId) ?? []), article]);
      });
    });

    grouped.forEach((articles, conditionId) => {
      setNews(conditionId, articles);
    });
  }, [query.data, setNews, setNewsArticles]);

  return query;
}
