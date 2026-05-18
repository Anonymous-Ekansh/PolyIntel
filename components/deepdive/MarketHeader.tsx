'use client';

import { useAppStore } from '@/store/useAppStore';
import { Clock, BarChart3, Droplets } from 'lucide-react';

export default function MarketHeader() {
  const market = useAppStore(s => s.selectedMarket);
  if (!market) return null;

  const scoreColor =
    market.overallScore >= 70 ? '#00ff88' :
    market.overallScore >= 40 ? '#ffaa00' : '#ff4444';

  const formatVol = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` :
    v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  return (
    <div className="border-b border-[#1e1e3a] bg-[#0f0f1a] px-4 py-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Question + Score */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded-md px-2.5 py-1 font-mono text-sm font-bold"
              style={{ color: scoreColor, backgroundColor: `${scoreColor}15` }}
            >
              SCORE {market.overallScore.toFixed(0)}
            </span>
            {market.timeRemaining && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-[#c8c8d4]/40">
                <Clock className="h-3 w-3" /> {market.timeRemaining} remaining
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold leading-relaxed text-white lg:text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
            {market.question}
          </h2>
        </div>

        {/* Prices */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase text-[#c8c8d4]/40">YES</p>
            <p className={`font-mono text-2xl font-bold ${market.yesPrice > 0.6 ? 'text-[#00ff88]' : market.yesPrice < 0.4 ? 'text-[#ff4444]' : 'text-[#ffaa00]'}`}
              style={{ textShadow: '0 0 12px rgba(0,255,136,0.2)' }}>
              {(market.yesPrice * 100).toFixed(0)}¢
            </p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase text-[#c8c8d4]/40">NO</p>
            <p className={`font-mono text-2xl font-bold ${market.noPrice > 0.6 ? 'text-[#00ff88]' : market.noPrice < 0.4 ? 'text-[#ff4444]' : 'text-[#ffaa00]'}`}>
              {(market.noPrice * 100).toFixed(0)}¢
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[#1e1e3a]/50 pt-3">
        <span className="flex items-center gap-1 font-mono text-[10px] text-[#c8c8d4]/50">
          <BarChart3 className="h-3 w-3" /> Vol 24h: {formatVol(market.volume24hr)}
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-[#c8c8d4]/50">
          <Droplets className="h-3 w-3" /> Liquidity: {formatVol(market.liquidity)}
        </span>
        <span className="font-mono text-[10px] text-[#c8c8d4]/40">
          📈 Vol: {market.volumeScore.toFixed(0)} · ⚡ Volatile: {market.volatilityScore.toFixed(0)} · 🎯 EasyWin: {market.easyWinScore.toFixed(0)} · 🔮 Mispriced: {market.mispricingScore.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
