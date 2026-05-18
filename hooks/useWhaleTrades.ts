"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTrades } from "@/lib/polymarket";
import { useAppStore } from "@/store/useAppStore";

export function useWhaleTrades() {
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const whaleThreshold = useAppStore((state) => state.settings.whaleThreshold);
  const setWhaleTrades = useAppStore((state) => state.setWhaleTrades);
  const setTrades = useAppStore((state) => state.setTrades);
  const recordSignal = useAppStore((state) => state.recordSignal);

  const query = useQuery({
    queryKey: ["whale-trades", selectedMarket?.conditionId],
    queryFn: () => fetchTrades(selectedMarket!.conditionId, 100),
    enabled: Boolean(selectedMarket?.conditionId),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!selectedMarket || !query.data) return;

    setTrades(selectedMarket.conditionId, query.data);
    const whales = query.data.filter((trade) => trade.sizeUSDC >= whaleThreshold);
    setWhaleTrades(whales);

    whales.forEach((trade) => {
      recordSignal({
        id: `whale-${trade.id}`,
        marketId: selectedMarket.conditionId,
        type: "whale",
        direction: trade.side === "BUY" ? "up" : "down",
        timestamp: trade.timestamp,
        title: `${trade.side} ${trade.outcome}`,
        description: `Large ${trade.side.toLowerCase()} for ${trade.sizeUSDC.toLocaleString()} USDC`,
        relatedId: trade.id,
      });
    });
  }, [
    query.data,
    recordSignal,
    selectedMarket,
    setTrades,
    setWhaleTrades,
    whaleThreshold,
  ]);

  return query;
}
