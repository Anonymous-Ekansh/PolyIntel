'use client';

import { useAppStore } from '@/store/useAppStore';
import { Zap, Settings, ArrowLeft, Search } from 'lucide-react';

export default function Header() {
  const view = useAppStore(s => s.view);
  const goBack = useAppStore(s => s.goBack);
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen);
  const markets = useAppStore(s => s.markets);
  const isLoadingMarkets = useAppStore(s => s.isLoadingMarkets);
  const searchQuery = useAppStore(s => s.searchQuery);
  const setSearchQuery = useAppStore(s => s.setSearchQuery);
  const selectedMarket = useAppStore(s => s.selectedMarket);

  return (
    <header className="relative border-b border-[#1e1e3a] bg-[#0a0a0f]">
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }}
      />

      <div className="relative z-10 flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left: Logo / Back button */}
        <div className="flex items-center gap-3">
          {view === 'deepdive' && (
            <button onClick={goBack} className="mr-1 rounded-md p-1.5 text-[#c8c8d4] transition-colors hover:bg-[#1e1e3a] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Zap className="h-5 w-5 text-[#00ff88]" />
              <div className="absolute inset-0 animate-pulse blur-sm">
                <Zap className="h-5 w-5 text-[#00ff88]" />
              </div>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              POLYINTEL
            </h1>
          </div>

          {view === 'scanner' && (
            <span className="hidden items-center gap-1.5 rounded-full border border-[#1e1e3a] bg-[#0f0f1a] px-3 py-1 font-mono text-[10px] text-[#00ff88] sm:inline-flex">
              <span className={`h-1.5 w-1.5 rounded-full ${isLoadingMarkets ? 'animate-pulse bg-[#ffaa00]' : 'bg-[#00ff88]'}`} />
              Scanning {markets.length} markets
            </span>
          )}

          {view === 'deepdive' && selectedMarket && (
            <p className="hidden max-w-[400px] truncate font-mono text-xs text-[#c8c8d4]/60 md:block">
              {selectedMarket.question}
            </p>
          )}
        </div>

        {/* Right: Search + Settings */}
        <div className="flex items-center gap-2">
          {view === 'scanner' && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#c8c8d4]/30" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[180px] rounded-md border border-[#1e1e3a] bg-[#0f0f1a] py-1.5 pl-8 pr-3 font-mono text-xs text-white placeholder:text-[#c8c8d4]/25 focus:border-[#00ff88]/40 focus:outline-none sm:w-[250px]"
              />
            </div>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md p-2 text-[#c8c8d4] transition-colors hover:bg-[#1e1e3a] hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
