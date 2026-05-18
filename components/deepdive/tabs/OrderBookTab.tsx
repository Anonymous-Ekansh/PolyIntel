'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeftRight, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

export default function OrderBookTab() {
  const selectedMarket = useAppStore(s => s.selectedMarket);
  const orderbooks = useAppStore(s => s.orderbooks);
  const allTrades = useAppStore(s => s.trades);
  const whaleThreshold = useAppStore(s => s.settings.whaleThreshold);

  const book = selectedMarket ? orderbooks[selectedMarket.conditionId] : null;
  const trades = selectedMarket ? allTrades[selectedMarket.conditionId] || [] : [];
  const isLoading = selectedMarket && !book;

  // Process orderbook for chart
  const bookData = useMemo(() => {
    if (!book) return [];
    const bids = (book.bids || []).slice(0, 10).map(b => ({
      price: Number(b.price),
      size: -Number(b.size),
      side: 'bid' as const,
    })).sort((a, b) => a.price - b.price);

    const asks = (book.asks || []).slice(0, 10).map(a => ({
      price: Number(a.price),
      size: Number(a.size),
      side: 'ask' as const,
    })).sort((a, b) => a.price - b.price);

    return [...bids, ...asks];
  }, [book]);

  // Order book stats
  const bestBid = book?.bids?.[0] ? Number(book.bids[0].price) : 0;
  const bestAsk = book?.asks?.[0] ? Number(book.asks[0].price) : 0;
  const spread = bestBid > 0 && bestAsk > 0 ? ((bestAsk - bestBid) / bestAsk * 10000).toFixed(0) : '—';

  if (!selectedMarket) return null;

  return (
    <div className="p-4 lg:p-6">
      {/* Stats row */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] px-4 py-2.5">
        <span className="font-mono text-xs text-[#00ff88]">Bid: {(bestBid * 100).toFixed(1)}¢</span>
        <span className="font-mono text-xs text-[#ff4444]">Ask: {(bestAsk * 100).toFixed(1)}¢</span>
        <span className="flex items-center gap-1 font-mono text-xs text-[#c8c8d4]/50">
          <ArrowLeftRight className="h-3 w-3" /> Spread: {spread} bps
        </span>
      </div>

      {/* Depth chart */}
      <div className="mb-6 rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-4">
        <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#c8c8d4]/50">Depth Chart</h3>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#00ff88]" />
          </div>
        ) : bookData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="font-mono text-xs text-[#c8c8d4]/30">No order book data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis dataKey="price" tick={{ fill: '#c8c8d4', fontSize: 10 }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}¢`} axisLine={{ stroke: '#1e1e3a' }} tickLine={false} />
              <YAxis tick={{ fill: '#c8c8d4', fontSize: 10 }} axisLine={{ stroke: '#1e1e3a' }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 6, fontSize: 11, color: '#c8c8d4' }}
                formatter={(value: number) => [`${Math.abs(value).toFixed(2)}`, value < 0 ? 'Bid Size' : 'Ask Size']}
                labelFormatter={(label: number) => `${(label * 100).toFixed(1)}¢`}
              />
              <Bar dataKey="size" animationDuration={300}>
                {bookData.map((entry, index) => (
                  <Cell key={index} fill={entry.side === 'bid' ? '#00ff8860' : '#ff444460'} stroke={entry.side === 'bid' ? '#00ff88' : '#ff4444'} strokeWidth={1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Trades */}
      <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-4">
        <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#c8c8d4]/50">Recent Trades</h3>
        {trades.length === 0 ? (
          <p className="py-8 text-center font-mono text-xs text-[#c8c8d4]/30">No trades data</p>
        ) : (
          <div className="space-y-1">
            {trades.slice(0, 20).map((trade, i) => {
              const size = Number(trade.size || 0) * Number(trade.price || 0);
              const isWhale = size >= whaleThreshold;
              const isBuy = trade.side === 'BUY';
              let timeAgo = '';
              try { timeAgo = formatDistanceToNow(new Date(trade.timestamp || trade.match_time), { addSuffix: true }); } catch { timeAgo = ''; }

              return (
                <div key={trade.id || i} className={`flex items-center justify-between rounded-md px-3 py-2 ${isWhale ? 'border border-[#ffaa00]/20 bg-[#ffaa00]/5' : 'hover:bg-[#1e1e3a]/20'}`}>
                  <div className="flex items-center gap-2">
                    {isWhale && <span>🐋</span>}
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold ${isBuy ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-[#ff4444]/10 text-[#ff4444]'}`}>
                      {isBuy ? <ArrowUp className="mr-0.5 inline h-2.5 w-2.5" /> : <ArrowDown className="mr-0.5 inline h-2.5 w-2.5" />}
                      {trade.outcome || (isBuy ? 'YES' : 'NO')}
                    </span>
                    <span className={`font-mono text-xs font-bold ${isWhale ? 'text-[#ffaa00]' : 'text-white'}`}>
                      ${size.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#c8c8d4]/40">@ {(Number(trade.price) * 100).toFixed(1)}¢</span>
                    <span className="font-mono text-[10px] text-[#c8c8d4]/25">{timeAgo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
