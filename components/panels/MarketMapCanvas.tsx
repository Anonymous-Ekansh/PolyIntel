"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { Market } from "@/types";
import { formatUsd } from "@/lib/utils";

function markerColor(price: number) {
  if (price > 0.6) return "#00ff88";
  if (price < 0.4) return "#ff4444";
  return "#ffaa00";
}

export default function MarketMapCanvas({
  markets,
  onSelect,
}: {
  markets: Market[];
  onSelect: (market: Market) => void;
}) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      attributionControl={false}
      zoomControl={false}
      className="h-full w-full rounded-xl"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markets.map((market) => {
        if (!market.location) return null;
        const radius = Math.max(8, Math.min(24, Math.log10(market.volume24h + 10) * 6));
        return (
          <CircleMarker
            key={market.conditionId}
            center={[market.location.lat, market.location.lng]}
            radius={radius}
            pathOptions={{
              color: markerColor(market.yesPrice),
              fillColor: markerColor(market.yesPrice),
              fillOpacity: 0.55,
              weight: 1.2,
            }}
            eventHandlers={{ click: () => onSelect(market) }}
          >
            <Tooltip>
              <div className="space-y-1 font-mono text-xs">
                <div>{market.location.label}</div>
                <div>{market.question}</div>
                <div>YES {(market.yesPrice * 100).toFixed(1)}%</div>
                <div>VOL {formatUsd(market.volume24h, true)}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
