"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { createChart, IChartApi, UTCTimestamp } from "lightweight-charts";
import { Card, CardContent } from "@/components/ui/card";
import { LiveBetMarket } from "@/lib/market-helpers";

async function fetchHistory(marketId: string) {
  const res = await fetch(`/api/prices-history?market=${encodeURIComponent(marketId)}`);
  if (!res.ok) throw new Error("Failed to load price history");
  const payload = (await res.json()) as {
    history?: Array<{ t?: number; p?: number; close?: number; timestamp?: number }>;
  };

  const rows = Array.isArray(payload) ? payload : payload.history ?? [];
  return rows
    .map((row) => ({
      time: Math.floor(Number(row.t ?? row.timestamp ?? 0) / 1000) as UTCTimestamp,
      value: Number(row.p ?? row.close ?? 0),
    }))
    .filter((row) => row.time > 0 && row.value >= 0 && row.value <= 1);
}

export default function MarketPriceChartTab({ market }: { market: LiveBetMarket }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const historyQuery = useQuery({
    queryKey: ["price-history", market.conditionId],
    queryFn: () => fetchHistory(market.conditionId),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!containerRef.current || !historyQuery.data?.length) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#a7afc3",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(30,30,58,0.45)" },
        horzLines: { color: "rgba(30,30,58,0.45)" },
      },
      rightPriceScale: {
        borderColor: "rgba(30,30,58,0.8)",
      },
      timeScale: {
        borderColor: "rgba(30,30,58,0.8)",
        timeVisible: true,
      },
    });

    const series = chart.addAreaSeries({
      lineColor: "#00ff88",
      topColor: "rgba(0,255,136,0.28)",
      bottomColor: "rgba(0,255,136,0.02)",
      lineWidth: 2,
    });

    series.setData(historyQuery.data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [historyQuery.data]);

  return (
    <Card className="border border-[#1e1e3a] bg-[#0f0f1a]">
      <CardContent className="p-5">
        {historyQuery.isLoading ? (
          <div className="h-[420px] animate-pulse rounded-2xl border border-[#1e1e3a] bg-[#111523]" />
        ) : historyQuery.isError ? (
          <div className="rounded-2xl border border-[#ff4444]/25 bg-[#2a1014] p-6 text-sm text-[#ffc2c2]">
            Failed to load price history for this market.
          </div>
        ) : (
          <div ref={containerRef} className="h-[420px] w-full rounded-2xl border border-[#1e1e3a] bg-[#111523]" />
        )}
      </CardContent>
    </Card>
  );
}
