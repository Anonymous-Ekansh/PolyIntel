"use client";

import dynamic from "next/dynamic";
import { Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PanelShell from "@/components/panels/PanelShell";
import { useAppStore } from "@/store/useAppStore";

const MarketMapCanvas = dynamic(() => import("@/components/panels/MarketMapCanvas"), {
  ssr: false,
});

export default function MarketMap() {
  const markets = useAppStore((state) => state.markets);
  const setSelectedMarket = useAppStore((state) => state.setSelectedMarket);

  const geopoliticalMarkets = markets.filter((market) => market.geopolitical && market.location);

  return (
    <PanelShell
      kicker="Panel 2"
      title="Live Market Map"
      action={
        <Badge className="border-[#1e1e3a] bg-[#0c101a] text-[#c8c8d4]">
          <Globe2 className="size-3" />
          {geopoliticalMarkets.length} markers
        </Badge>
      }
      className="min-h-[360px]"
    >
      <div className="h-[320px] overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0b0f16]">
        <MarketMapCanvas
          markets={geopoliticalMarkets}
          onSelect={(market) => setSelectedMarket(market)}
        />
      </div>
    </PanelShell>
  );
}
