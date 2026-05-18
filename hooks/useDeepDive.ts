// ============================================================
// useDeepDive — Fetch news, chart, orderbook, trades for selected market
// ============================================================

'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { buildSearchQuery } from '@/lib/keywords';
import { analyzeSentiment } from '@/lib/sentiment';
import { deduplicateArticles } from '@/lib/dedup';
import { Article, PricePoint, Trade } from '@/types';

export function useDeepDive() {
  const selectedMarket = useAppStore(s => s.selectedMarket);
  const settings = useAppStore(s => s.settings);
  const setNews = useAppStore(s => s.setNews);
  const setPriceHistory = useAppStore(s => s.setPriceHistory);
  const setOrderbook = useAppStore(s => s.setOrderbook);
  const setTrades = useAppStore(s => s.setTrades);

  const fetchNews = useCallback(async () => {
    if (!selectedMarket) return;

    const query = buildSearchQuery(selectedMarket.question);
    const allArticles: Article[] = [];

    // Source 1: Google News RSS (via server proxy)
    try {
      const res = await fetch(`/api/news/google?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const articles = (data.articles || []).map((a: Partial<Article>) => ({
          ...a,
          source: a.source || 'Google News',
          sourceIcon: '🔍',
          sentiment: analyzeSentiment(`${a.title || ''} ${a.description || ''}`),
        }));
        allArticles.push(...articles);
      }
    } catch (err) {
      console.error('Google News fetch error:', err);
    }

    // Source 2: RSS feeds via rss2json
    if (settings.rss2jsonKey) {
      const feeds = [
        { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC', icon: '🌐' },
        { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', icon: '📡' },
        { url: 'https://www.theguardian.com/world/rss', name: 'Guardian', icon: '📋' },
        { url: 'https://rss.politico.com/politics-news.xml', name: 'Politico', icon: '🏛️' },
        { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN', icon: '⚽' },
      ];

      const queryWords = query.toLowerCase().split(/\s+/);

      await Promise.allSettled(
        feeds.map(async (feed) => {
          try {
            const res = await fetch(
              `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&api_key=${settings.rss2jsonKey}&count=10`
            );
            if (!res.ok) return;
            const data = await res.json();
            if (data.status !== 'ok') return;

            const items = (data.items || [])
              .filter((item: { title: string }) => {
                const titleWords = item.title.toLowerCase().split(/\s+/);
                const overlap = queryWords.filter(w => titleWords.some((tw: string) => tw.includes(w))).length;
                return overlap / queryWords.length > 0.2;
              })
              .map((item: { title: string; link: string; description: string; pubDate: string; guid: string }, i: number) => ({
                id: `rss-${feed.name}-${i}-${Date.now()}`,
                title: item.title,
                link: item.link,
                description: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
                source: feed.name,
                sourceIcon: feed.icon,
                pubDate: item.pubDate,
                timestamp: new Date(item.pubDate).getTime() || Date.now(),
                sentiment: analyzeSentiment(`${item.title} ${item.description || ''}`),
              }));

            allArticles.push(...items);
          } catch { /* skip failed feed */ }
        })
      );
    }

    // Source 3: NewsData.io (via server proxy)
    if (settings.newsdataKey) {
      try {
        const res = await fetch(`/api/news/newsdata?q=${encodeURIComponent(query)}&apikey=${settings.newsdataKey}`);
        if (res.ok) {
          const data = await res.json();
          const articles = (data.articles || []).map((a: Partial<Article>) => ({
            ...a,
            source: a.source || 'NewsData',
            sourceIcon: '📰',
            sentiment: analyzeSentiment(`${a.title || ''} ${a.description || ''}`),
          }));
          allArticles.push(...articles);
        }
      } catch (err) {
        console.error('NewsData fetch error:', err);
      }
    }

    // Deduplicate and sort by recency
    const deduped = deduplicateArticles(allArticles);
    deduped.sort((a, b) => b.timestamp - a.timestamp);
    setNews(selectedMarket.conditionId, deduped.slice(0, 30));
  }, [selectedMarket, settings, setNews]);

  const fetchPriceHistory = useCallback(async (interval = '1h') => {
    if (!selectedMarket?.conditionId) return;
    try {
      const res = await fetch(`/api/prices-history?market=${selectedMarket.conditionId}&interval=${interval}&fidelity=60`);
      if (!res.ok) return;
      const data = await res.json();
      const history: PricePoint[] = (data.history || data || []).map((p: { t: number; p: number }) => ({
        t: Number(p.t),
        p: Number(p.p),
      }));
      setPriceHistory(selectedMarket.conditionId, history);
    } catch (err) {
      console.error('Price history fetch error:', err);
    }
  }, [selectedMarket, setPriceHistory]);

  const fetchOrderbook = useCallback(async () => {
    if (!selectedMarket?.tokenIds?.[0]) return;
    try {
      const res = await fetch(`/api/orderbook?token_id=${selectedMarket.tokenIds[0]}`);
      if (!res.ok) return;
      const data = await res.json();
      setOrderbook(selectedMarket.conditionId, {
        bids: data.bids || [],
        asks: data.asks || [],
        bestBid: Number(data.bids?.[0]?.price || 0),
        bestAsk: Number(data.asks?.[0]?.price || 0),
        spread: Number(data.asks?.[0]?.price || 0) - Number(data.bids?.[0]?.price || 0),
      });
    } catch (err) {
      console.error('Orderbook fetch error:', err);
    }
  }, [selectedMarket, setOrderbook]);

  const fetchTrades = useCallback(async () => {
    if (!selectedMarket?.conditionId) return;
    try {
      const res = await fetch(`/api/trades?market=${selectedMarket.conditionId}&limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      const trades: Trade[] = (data.data || data || []).map((t: Record<string, unknown>) => ({
        ...t,
        sizeUSDC: Number(t.size || 0) * Number(t.price || 0),
        timestamp: new Date(String(t.match_time || '')).getTime() || Date.now(),
      }));
      setTrades(selectedMarket.conditionId, trades);
    } catch (err) {
      console.error('Trades fetch error:', err);
    }
  }, [selectedMarket, setTrades]);

  // Fetch all data when market is selected
  useEffect(() => {
    if (!selectedMarket) return;
    fetchNews();
    fetchPriceHistory();
    fetchOrderbook();
    fetchTrades();

    // Auto-refresh orderbook and trades
    const obInterval = setInterval(fetchOrderbook, 15000);
    const trInterval = setInterval(fetchTrades, 15000);

    return () => {
      clearInterval(obInterval);
      clearInterval(trInterval);
    };
  }, [selectedMarket, fetchNews, fetchPriceHistory, fetchOrderbook, fetchTrades]);

  return { fetchNews, fetchPriceHistory, fetchOrderbook, fetchTrades };
}
