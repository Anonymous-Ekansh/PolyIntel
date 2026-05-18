"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

const WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";

type MarketEvent = {
  asset_id?: string;
  market?: string;
  price?: number | string;
  side?: string;
  event_type?: string;
  type?: string;
  last_trade_price?: number | string;
};

export function useMarketStream() {
  const markets = useAppStore((state) => state.markets);
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const paperPositions = useAppStore((state) => state.paperPositions);
  const setLivePrice = useAppStore((state) => state.setLivePrice);
  const recordSignal = useAppStore((state) => state.recordSignal);
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const historyRef = useRef<Record<string, Array<{ timestamp: number; price: number }>>>({});

  useEffect(() => {
    const assetIds = Array.from(
      new Set(
        [
          selectedMarket?.tokenIds[0],
          ...paperPositions.filter((position) => !position.closedAt).map((position) => position.tokenId),
        ].filter(Boolean),
      ),
    ) as string[];

    if (!assetIds.length) return;

    const assetToMarket = new Map<string, string>();
    markets.forEach((market) => {
      if (market.tokenIds[0]) assetToMarket.set(market.tokenIds[0], market.conditionId);
    });

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          channel: "market",
          assets_ids: assetIds,
        }),
      );

      heartbeatRef.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 15_000);
    });

    socket.addEventListener("message", (event) => {
      let payload: MarketEvent | MarketEvent[];
      try {
        payload = JSON.parse(event.data) as MarketEvent | MarketEvent[];
      } catch {
        return;
      }

      const events = Array.isArray(payload) ? payload : [payload];
      events.forEach((entry) => {
        const assetId = entry.asset_id;
        const marketId = entry.market ?? (assetId ? assetToMarket.get(assetId) : undefined);
        const price = Number(entry.price ?? entry.last_trade_price ?? 0);
        if (!marketId || !price || Number.isNaN(price)) return;

        if (assetId) setLivePrice(assetId, price);
        setLivePrice(marketId, price);

        const currentHistory = historyRef.current[marketId] ?? [];
        const nextHistory = [...currentHistory, { timestamp: Date.now(), price }].filter(
          (point) => point.timestamp >= Date.now() - 5 * 60 * 1000,
        );
        historyRef.current[marketId] = nextHistory;

        const first = nextHistory[0];
        if (!first) return;

        const move = price - first.price;
        if (Math.abs(move) >= 0.03) {
          recordSignal({
            id: `price-${marketId}-${Math.floor(Date.now() / 300000)}`,
            marketId,
            type: "price",
            direction: move > 0 ? "up" : "down",
            timestamp: Date.now(),
            title: "5m price anomaly",
            description: `${move > 0 ? "Up" : "Down"} ${(Math.abs(move) * 100).toFixed(1)}% in under 5 minutes`,
            relatedId: `${Math.floor(Date.now() / 300000)}`,
          });
        }
      });
    });

    return () => {
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      socket.close();
    };
  }, [markets, paperPositions, recordSignal, selectedMarket, setLivePrice]);
}
