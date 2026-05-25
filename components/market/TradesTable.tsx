"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import { formatUsd } from "@/lib/utils";

interface TradesTableProps {
  trades: any[];
}

export default function TradesTable({ trades }: TradesTableProps) {
  if (!trades || trades.length === 0) {
    return (
      <div className="rounded-xl border border-[#1e1e3a] bg-[#101422] p-6 text-center text-sm text-[#8b93a7]">
        No recent trades available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1e1e3a] bg-[#0c1019] overflow-hidden flex flex-col h-[400px]">
      <div className="bg-[#101422] border-b border-[#1e1e3a] px-4 py-3 flex items-center gap-2">
        <History className="size-4 text-[#8b93a7]" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#d7d7e2]">Recent Trades</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1e1e3a] scrollbar-track-transparent">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-[#0c1019] text-[10px] uppercase tracking-wider text-[#6d7488] shadow-sm z-20">
            <tr>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Side</th>
              <th className="px-4 py-2 font-medium text-right">Price</th>
              <th className="px-4 py-2 font-medium text-right">Shares</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e3a]/50">
            {trades.map((trade: any, i: number) => {
              const isBuy = trade.side === "BUY";
              return (
                <tr key={trade.id || i} className="hover:bg-[#131b2b] transition-colors">
                  <td className="px-4 py-2.5 text-[#8b93a7]">
                    {trade.timestamp ? formatDistanceToNowStrict(trade.timestamp, { addSuffix: true }) : "-"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isBuy ? "bg-[#00ff88]/10 text-[#00ff88]" : "bg-[#ff4444]/10 text-[#ff4444]"
                    }`}>
                      {isBuy ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#d7d7e2]">
                    ${Number(trade.price).toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#d7d7e2]">
                    {Number(trade.size).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">
                    {formatUsd(trade.sizeUSDC ?? (Number(trade.price) * Number(trade.size)))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
