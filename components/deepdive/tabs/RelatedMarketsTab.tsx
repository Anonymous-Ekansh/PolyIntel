'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { keywordOverlap } from '@/lib/keywords';
import { ChevronRight } from 'lucide-react';

export default function RelatedMarketsTab() {
  const selectedMarket = useAppStore(s => s.selectedMarket);
  const markets = useAppStore(s => s.markets);
  const selectMarket = useAppStore(s => s.selectMarket);

  const relatedMarkets = useMemo(() => {
    if (!selectedMarket) return [];

    return markets
      .filter(m => m.conditionId !== selectedMarket.conditionId)
      .map(m => ({
        market: m,
        overlap: keywordOverlap(selectedMarket.question, m.question),
      }))
      .filter(r => r.overlap > 0.3)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 10);
  }, [selectedMarket, markets]);

  if (!selectedMarket) return null;

  return (
    <div className="p-4 lg:p-6">
      {relatedMarkets.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="font-mono text-xs text-[#c8c8d4]/30">No related markets found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {relatedMarkets.map(({ market, overlap }) => {
            const scoreColor =
              market.overallScore >= 70 ? '#00ff88' :
              market.overallScore >= 40 ? '#ffaa00' : '#ff4444';

            const category = overlap > 0.5 ? 'Same Topic' : 'Related';
            const catColor = overlap > 0.5 ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : 'bg-[#ffaa00]/10 text-[#ffaa00] border-[#ffaa00]/20';

            return (
              <button
                key={market.conditionId}
                onClick={() => selectMarket(market)}
                className="group flex w-full items-center gap-4 rounded-lg border border-[#1e1e3a]/50 bg-[#0f0f1a] px-4 py-3 text-left transition-all hover:border-[#1e1e3a]"
              >
                {/* Score */}
                <span className="font-mono text-sm font-bold" style={{ color: scoreColor }}>
                  {market.overallScore.toFixed(0)}
                </span>

                {/* Question */}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm text-[#c8c8d4] transition-colors group-hover:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {market.question}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold ${catColor}`}>
                      {category}
                    </span>
                    <span className="font-mono text-[10px] text-[#c8c8d4]/30">
                      {(overlap * 100).toFixed(0)}% match
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <span className={`font-mono text-sm font-bold ${market.yesPrice > 0.6 ? 'text-[#00ff88]' : market.yesPrice < 0.4 ? 'text-[#ff4444]' : 'text-[#ffaa00]'}`}>
                    {(market.yesPrice * 100).toFixed(0)}¢
                  </span>
                  <p className="font-mono text-[10px] text-[#c8c8d4]/30">
                    Vol: ${market.volume24hr >= 1000 ? `${(market.volume24hr / 1000).toFixed(0)}K` : market.volume24hr.toFixed(0)}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-[#c8c8d4]/20 transition-colors group-hover:text-[#00ff88]" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
