'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import OpportunityCard from './OpportunityCard';
import { Loader2, SearchX } from 'lucide-react';

export default function ScannerGrid() {
  const markets = useAppStore(s => s.markets);
  const activeFilter = useAppStore(s => s.activeFilter);
  const sortBy = useAppStore(s => s.sortBy);
  const searchQuery = useAppStore(s => s.searchQuery);
  const isLoadingMarkets = useAppStore(s => s.isLoadingMarkets);

  const filteredMarkets = useMemo(() => {
    let result = [...markets];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.question.toLowerCase().includes(q));
    }

    // Category filter
    switch (activeFilter) {
      case 'easywin':
        result = result.filter(m => m.easyWinScore > 0);
        break;
      case 'volume':
        result = result.filter(m => m.volumeScore >= 50);
        break;
      case 'volatile':
        result = result.filter(m => m.volatilityScore >= 30);
        break;
      case 'mispriced':
        result = result.filter(m => m.mispricingScore >= 20);
        break;
      case 'ending':
        result = result.filter(m => {
          if (!m.endDate) return false;
          const daysLeft = (new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return daysLeft > 0 && daysLeft <= 7;
        });
        break;
    }

    // Sort
    switch (sortBy) {
      case 'score':
        result.sort((a, b) => b.overallScore - a.overallScore);
        break;
      case 'volume':
        result.sort((a, b) => b.volume24hr - a.volume24hr);
        break;
      case 'ending':
        result.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'price_low':
        result.sort((a, b) => a.yesPrice - b.yesPrice);
        break;
      case 'price_high':
        result.sort((a, b) => b.yesPrice - a.yesPrice);
        break;
    }

    return result;
  }, [markets, activeFilter, sortBy, searchQuery]);

  if (isLoadingMarkets && markets.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
          <p className="font-mono text-xs text-[#c8c8d4]/40">Scanning Polymarket...</p>
        </div>
      </div>
    );
  }

  if (filteredMarkets.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <SearchX className="h-8 w-8 text-[#1e1e3a]" />
          <p className="font-mono text-xs text-[#c8c8d4]/40">No markets match your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMarkets.map((market, i) => (
          <OpportunityCard key={market.conditionId || market.id} market={market} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
