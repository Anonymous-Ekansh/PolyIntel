'use client';

import { useAppStore } from '@/store/useAppStore';
import { ScoredMarket } from '@/types';

interface Props {
  market: ScoredMarket;
  isActive: boolean;
}

export default function SidebarCard({ market, isActive }: Props) {
  const selectMarket = useAppStore(s => s.selectMarket);

  const scoreColor =
    market.overallScore >= 70 ? '#00ff88' :
    market.overallScore >= 40 ? '#ffaa00' : '#ff4444';

  return (
    <button
      onClick={() => selectMarket(market)}
      className={`mb-1 w-full rounded-md px-3 py-2 text-left transition-all ${
        isActive
          ? 'border border-[#00ff88]/20 bg-[#00ff88]/5'
          : 'border border-transparent hover:bg-[#1e1e3a]/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold" style={{ color: scoreColor }}>
          {market.overallScore.toFixed(0)}
        </span>
        <span className={`font-mono text-[10px] ${market.yesPrice > 0.6 ? 'text-[#00ff88]' : market.yesPrice < 0.4 ? 'text-[#ff4444]' : 'text-[#ffaa00]'}`}>
          {(market.yesPrice * 100).toFixed(0)}¢
        </span>
      </div>
      <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-relaxed text-[#c8c8d4]/70">
        {market.question}
      </p>
    </button>
  );
}
