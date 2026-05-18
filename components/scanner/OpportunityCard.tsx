'use client';

import { ScoredMarket } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { ChevronRight, Clock } from 'lucide-react';

interface Props {
  market: ScoredMarket;
  rank: number;
}

export default function OpportunityCard({ market, rank }: Props) {
  const selectMarket = useAppStore(s => s.selectMarket);

  const scoreColor =
    market.overallScore >= 70 ? '#00ff88' :
    market.overallScore >= 40 ? '#ffaa00' : '#ff4444';

  const priceColor = (p: number) =>
    p > 0.6 ? 'text-[#00ff88]' : p < 0.4 ? 'text-[#ff4444]' : 'text-[#ffaa00]';

  const formatVol = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` :
    v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  return (
    <button
      onClick={() => selectMarket(market)}
      className="group relative w-full overflow-hidden rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] text-left transition-all duration-200 hover:border-[#1e1e3a] hover:shadow-[0_0_20px_rgba(0,255,136,0.03)]"
    >
      {/* Top colored strip */}
      <div className="h-1" style={{ backgroundColor: scoreColor }} />

      <div className="p-4">
        {/* Score + Time remaining */}
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#c8c8d4]/25">#{rank}</span>
            <span
              className="rounded-md px-2 py-0.5 font-mono text-sm font-bold"
              style={{ color: scoreColor, backgroundColor: `${scoreColor}15`, textShadow: `0 0 8px ${scoreColor}30` }}
            >
              {market.overallScore.toFixed(0)}
            </span>
          </div>
          {market.timeRemaining && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#c8c8d4]/40">
              <Clock className="h-3 w-3" />
              {market.timeRemaining}
            </span>
          )}
        </div>

        {/* Question */}
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[#c8c8d4] transition-colors group-hover:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          {market.question}
        </p>

        {/* YES / NO prices */}
        <div className="mb-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase text-[#c8c8d4]/40">YES</span>
            <span className={`font-mono text-lg font-bold ${priceColor(market.yesPrice)}`}>
              {(market.yesPrice * 100).toFixed(0)}¢
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase text-[#c8c8d4]/40">NO</span>
            <span className={`font-mono text-lg font-bold ${priceColor(market.noPrice)}`}>
              {(market.noPrice * 100).toFixed(0)}¢
            </span>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
          <span className="font-mono text-[10px] text-[#c8c8d4]/40">
            📈 Vol: <span className="text-[#c8c8d4]/60">{market.volumeScore.toFixed(0)}</span>
          </span>
          <span className="font-mono text-[10px] text-[#c8c8d4]/40">
            ⚡ Volatile: <span className="text-[#c8c8d4]/60">{market.volatilityScore.toFixed(0)}</span>
          </span>
          <span className="font-mono text-[10px] text-[#c8c8d4]/40">
            🎯 EasyWin: <span className="text-[#c8c8d4]/60">{market.easyWinScore.toFixed(0)}</span>
          </span>
          <span className="font-mono text-[10px] text-[#c8c8d4]/40">
            🔮 Mispriced: <span className="text-[#c8c8d4]/60">{market.mispricingScore.toFixed(0)}</span>
          </span>
        </div>

        {/* Bottom row: Volume + Analyze button */}
        <div className="flex items-center justify-between border-t border-[#1e1e3a]/50 pt-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#c8c8d4]/35">
              Vol 24h: <span className="text-[#c8c8d4]/55">{formatVol(market.volume24hr)}</span>
            </span>
            <span className="font-mono text-[10px] text-[#c8c8d4]/35">
              💧 {formatVol(market.liquidity)}
            </span>
          </div>
          <span className="flex items-center gap-0.5 font-mono text-[10px] font-semibold text-[#00ff88] opacity-0 transition-opacity group-hover:opacity-100">
            ANALYZE <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}
