"use client";

import { Layers } from "lucide-react";
import { formatUsd } from "@/lib/utils";

interface OrderBookPanelProps {
  book: {
    bids: any[];
    asks: any[];
  };
}

export default function OrderBookPanel({ book }: OrderBookPanelProps) {
  if (!book || (!book.bids.length && !book.asks.length)) {
    return (
      <div className="rounded-xl border border-[#1e1e3a] bg-[#101422] p-6 text-center text-sm text-[#8b93a7]">
        Orderbook temporarily unavailable.
      </div>
    );
  }

  // Top 5 asks (reversed so lowest price is at bottom, near spread)
  const asks = [...book.asks]
    .map(a => ({ price: Number(a.price), size: Number(a.size) }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 5)
    .reverse();

  // Top 5 bids (highest price at top, near spread)
  const bids = [...book.bids]
    .map(b => ({ price: Number(b.price), size: Number(b.size) }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 5);

  const bestAsk = asks.length > 0 ? asks[asks.length - 1].price : 0;
  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk && bestBid ? (spread / bestBid) * 100 : 0;

  const maxAskSize = Math.max(...asks.map(a => a.size), 1);
  const maxBidSize = Math.max(...bids.map(b => b.size), 1);
  const maxSize = Math.max(maxAskSize, maxBidSize);

  return (
    <div className="rounded-xl border border-[#1e1e3a] bg-[#0c1019] overflow-hidden">
      <div className="bg-[#101422] border-b border-[#1e1e3a] px-4 py-3 flex items-center gap-2">
        <Layers className="size-4 text-[#8b93a7]" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#d7d7e2]">Order Book (YES)</h3>
      </div>

      <div className="p-3 space-y-[2px]">
        {/* Asks */}
        <div className="space-y-[2px]">
          <div className="grid grid-cols-3 text-[10px] uppercase text-[#6d7488] px-2 pb-1">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>
          {asks.map((ask, i) => (
            <div key={`ask-${i}`} className="relative grid grid-cols-3 items-center text-xs px-2 py-1 z-10">
              <div 
                className="absolute top-0 right-0 bottom-0 bg-[#ff4444]/15 -z-10"
                style={{ width: `${(ask.size / maxSize) * 100}%` }}
              />
              <span className="text-[#ff4444] font-mono">${ask.price.toFixed(3)}</span>
              <span className="text-right font-mono text-[#d7d7e2]">{Math.floor(ask.size).toLocaleString()}</span>
              <span className="text-right font-mono text-[#8b93a7]">{formatUsd(ask.price * ask.size)}</span>
            </div>
          ))}
          {asks.length === 0 && <div className="text-center py-2 text-xs text-[#6d7488]">No asks</div>}
        </div>

        {/* Spread */}
        <div className="my-2 py-1.5 border-y border-[#1e1e3a] flex items-center justify-between px-2 text-[10px] font-semibold text-[#8b93a7] uppercase tracking-widest bg-[#101422]/50">
          <span>Spread</span>
          <span className={spreadPct < 2 ? "text-[#00ff88]" : spreadPct > 5 ? "text-[#ff4444]" : ""}>
            ${spread.toFixed(3)} ({spreadPct.toFixed(1)}%)
          </span>
        </div>

        {/* Bids */}
        <div className="space-y-[2px]">
          {bids.map((bid, i) => (
            <div key={`bid-${i}`} className="relative grid grid-cols-3 items-center text-xs px-2 py-1 z-10">
              <div 
                className="absolute top-0 right-0 bottom-0 bg-[#00ff88]/15 -z-10"
                style={{ width: `${(bid.size / maxSize) * 100}%` }}
              />
              <span className="text-[#00ff88] font-mono">${bid.price.toFixed(3)}</span>
              <span className="text-right font-mono text-[#d7d7e2]">{Math.floor(bid.size).toLocaleString()}</span>
              <span className="text-right font-mono text-[#8b93a7]">{formatUsd(bid.price * bid.size)}</span>
            </div>
          ))}
          {bids.length === 0 && <div className="text-center py-2 text-xs text-[#6d7488]">No bids</div>}
        </div>
      </div>
    </div>
  );
}
