'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { countSentiments } from '@/lib/sentiment';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Loader2 } from 'lucide-react';

export default function NewsTab() {
  const selectedMarket = useAppStore(s => s.selectedMarket);
  const allNews = useAppStore(s => s.news);

  const articles = selectedMarket ? allNews[selectedMarket.conditionId] || [] : [];
  const isLoading = selectedMarket && !allNews[selectedMarket.conditionId];

  const sentimentCounts = useMemo(() => {
    return countSentiments(articles.map(a => a.sentiment));
  }, [articles]);

  if (!selectedMarket) return null;

  return (
    <div className="p-4 lg:p-6">
      {/* Sentiment summary */}
      {articles.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#c8c8d4]/40">Sentiment:</span>
          <span className="font-mono text-xs text-[#00ff88]">🟢 {sentimentCounts.bullish} bullish</span>
          <span className="font-mono text-xs text-[#ff4444]">🔴 {sentimentCounts.bearish} bearish</span>
          <span className="font-mono text-xs text-[#c8c8d4]/50">⚪ {sentimentCounts.neutral} neutral</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#00ff88]" />
            <p className="font-mono text-xs text-[#c8c8d4]/40">Fetching news from 3 sources...</p>
          </div>
        </div>
      )}

      {/* No results */}
      {!isLoading && articles.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <p className="font-mono text-xs text-[#c8c8d4]/30">No matching news found for this market</p>
        </div>
      )}

      {/* Articles */}
      <div className="space-y-2">
        {articles.map((article) => {
          let timeAgo = '';
          try { timeAgo = formatDistanceToNow(new Date(article.timestamp), { addSuffix: true }); } catch { timeAgo = 'recently'; }

          const sentimentColor =
            article.sentiment === 'bullish' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' :
            article.sentiment === 'bearish' ? 'bg-[#ff4444]/10 text-[#ff4444] border-[#ff4444]/20' :
            'bg-[#c8c8d4]/5 text-[#c8c8d4]/50 border-[#c8c8d4]/10';

          const sentimentLabel =
            article.sentiment === 'bullish' ? '🟢 BULLISH' :
            article.sentiment === 'bearish' ? '🔴 BEARISH' : '⚪ NEUTRAL';

          return (
            <div key={article.id} className="group rounded-lg border border-[#1e1e3a]/50 bg-[#0f0f1a] px-4 py-3 transition-all hover:border-[#1e1e3a]">
              {/* Source + Time + Sentiment */}
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm">{article.sourceIcon}</span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#ffaa00]">{article.source}</span>
                <span className="font-mono text-[10px] text-[#c8c8d4]/30">{timeAgo}</span>
                <span className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold ${sentimentColor}`}>
                  {sentimentLabel}
                </span>
              </div>

              {/* Headline */}
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="group/link flex items-start gap-1.5">
                <p className="text-sm leading-relaxed text-[#c8c8d4] transition-colors group-hover/link:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {article.title}
                </p>
                <ExternalLink className="mt-1 h-3 w-3 flex-shrink-0 text-[#c8c8d4]/20 transition-colors group-hover/link:text-[#00ff88]" />
              </a>

              {/* Description */}
              {article.description && (
                <p className="mt-1 line-clamp-2 font-mono text-[11px] leading-relaxed text-[#c8c8d4]/40">
                  {article.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
