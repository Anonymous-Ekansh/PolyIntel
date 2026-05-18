'use client';

import { useAppStore } from '@/store/useAppStore';
import { FilterType, SortType } from '@/types';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'easywin', label: 'EASY WIN' },
  { key: 'volume', label: 'HIGH VOL' },
  { key: 'volatile', label: 'VOLATILE' },
  { key: 'mispriced', label: 'MISPRICED' },
  { key: 'ending', label: 'ENDING SOON' },
];

const SORTS: { key: SortType; label: string }[] = [
  { key: 'score', label: 'Best Score' },
  { key: 'volume', label: 'Volume' },
  { key: 'ending', label: 'Ending Soon' },
  { key: 'price_low', label: 'Price ↑' },
  { key: 'price_high', label: 'Price ↓' },
];

export default function FilterBar() {
  const activeFilter = useAppStore(s => s.activeFilter);
  const setActiveFilter = useAppStore(s => s.setActiveFilter);
  const sortBy = useAppStore(s => s.sortBy);
  const setSortBy = useAppStore(s => s.setSortBy);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] bg-[#0a0a0f] px-4 py-2.5 lg:px-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`rounded-md px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all ${
              activeFilter === f.key
                ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.1)]'
                : 'text-[#c8c8d4]/40 hover:bg-[#1e1e3a]/50 hover:text-[#c8c8d4]/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as SortType)}
        className="rounded-md border border-[#1e1e3a] bg-[#0f0f1a] px-3 py-1.5 font-mono text-[10px] text-[#c8c8d4] focus:border-[#00ff88]/40 focus:outline-none"
      >
        {SORTS.map(s => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
