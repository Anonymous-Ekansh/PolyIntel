'use client';

import { useAppStore } from '@/store/useAppStore';
import { useDeepDive } from '@/hooks/useDeepDive';
import { TabType } from '@/types';
import { Newspaper, LineChart, Link2, BookOpen, Sparkles } from 'lucide-react';
import MarketHeader from './MarketHeader';
import NewsTab from './tabs/NewsTab';
import PriceChartTab from './tabs/PriceChartTab';
import RelatedMarketsTab from './tabs/RelatedMarketsTab';
import OrderBookTab from './tabs/OrderBookTab';
import AIVerdictTab from './tabs/AIVerdictTab';
import SidebarCard from './SidebarCard';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'news', label: 'News', icon: <Newspaper className="h-3.5 w-3.5" /> },
  { key: 'chart', label: 'Chart', icon: <LineChart className="h-3.5 w-3.5" /> },
  { key: 'related', label: 'Related', icon: <Link2 className="h-3.5 w-3.5" /> },
  { key: 'orderbook', label: 'Book & Whales', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { key: 'ai', label: 'AI Verdict', icon: <Sparkles className="h-3.5 w-3.5" /> },
];

export default function DeepDiveLayout() {
  const selectedMarket = useAppStore(s => s.selectedMarket);
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const markets = useAppStore(s => s.markets);

  // Activate deep dive data fetching
  useDeepDive();

  if (!selectedMarket) return null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar — market list (hidden on mobile) */}
      <div className="hidden w-[280px] flex-shrink-0 overflow-auto border-r border-[#1e1e3a] bg-[#0a0a0f] lg:block">
        <div className="p-2">
          {markets.slice(0, 30).map(m => (
            <SidebarCard key={m.conditionId} market={m} isActive={m.conditionId === selectedMarket.conditionId} />
          ))}
        </div>
      </div>

      {/* Right — main research area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Market header */}
        <MarketHeader />

        {/* Tab bar */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#1e1e3a] bg-[#0a0a0f] px-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'border-[#00ff88] text-[#00ff88]'
                  : 'border-transparent text-[#c8c8d4]/40 hover:text-[#c8c8d4]/70'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'news' && <NewsTab />}
          {activeTab === 'chart' && <PriceChartTab />}
          {activeTab === 'related' && <RelatedMarketsTab />}
          {activeTab === 'orderbook' && <OrderBookTab />}
          {activeTab === 'ai' && <AIVerdictTab />}
        </div>
      </div>
    </div>
  );
}
