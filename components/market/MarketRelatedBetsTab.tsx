"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LiveBetMarket } from "@/lib/market-helpers";
import { formatPercent, formatUsd } from "@/lib/utils";

export default function MarketRelatedBetsTab({ markets }: { markets: LiveBetMarket[] }) {
  return (
    <Card className="border border-[#1e1e3a] bg-[#0f0f1a]">
      <CardContent className="p-5">
        {markets.length ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {markets.map((market) => (
              <Link key={market.id} href={`/market/${market.id}`} className="block">
                <div className="rounded-2xl border border-[#1e1e3a] bg-[#111523] p-4 transition-colors hover:border-[#344066]">
                  <div className="line-clamp-3 text-base leading-6 text-white">{market.question}</div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#aeb5c8]">
                    <span>YES {formatPercent(market.yesPrice)}</span>
                    <span>VOL {formatUsd(market.volume24hr, true)}</span>
                    <span>SCORE {market.score}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#1e1e3a] bg-[#111523] p-6 text-sm text-[#98a0b4]">
            No closely related bets found from the current market list.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
