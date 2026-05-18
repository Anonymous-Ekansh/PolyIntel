"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createChart, IChartApi, UTCTimestamp } from "lightweight-charts";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PanelShell from "@/components/panels/PanelShell";
import { generateMarketSummary } from "@/lib/anthropic";
import { fetchPriceHistory } from "@/lib/polymarket";
import { cn, formatPercent } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function ProbabilityChart() {
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const settings = useAppStore((state) => state.settings);
  const livePrices = useAppStore((state) => state.livePrices);
  const news = useAppStore((state) => state.news);
  const setPriceHistory = useAppStore((state) => state.setPriceHistory);
  const cachedHistory = useAppStore((state) =>
    selectedMarket ? state.priceHistory[selectedMarket.conditionId] : [],
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const historyQuery = useQuery({
    queryKey: ["price-history", selectedMarket?.conditionId, settings.refreshInterval],
    queryFn: () => fetchPriceHistory(selectedMarket!.tokenIds[0], Date.now() - 24 * 60 * 60 * 1000),
    enabled: Boolean(selectedMarket?.tokenIds[0]),
    refetchInterval: settings.refreshInterval * 1000,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (selectedMarket && historyQuery.data) {
      setPriceHistory(selectedMarket.conditionId, historyQuery.data);
    }
  }, [historyQuery.data, selectedMarket, setPriceHistory]);

  const history = historyQuery.data ?? cachedHistory ?? [];
  const matchedArticles = selectedMarket ? news[selectedMarket.conditionId] ?? [] : [];
  const currentPrice =
    (selectedMarket && livePrices[selectedMarket.conditionId]) ||
    history[history.length - 1]?.p ||
    selectedMarket?.yesPrice ||
    0;
  const baseline = history[0]?.p ?? selectedMarket?.yesPrice ?? 0;
  const delta = currentPrice - baseline;

  useEffect(() => {
    if (!containerRef.current || !history.length) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca4b8",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(30,30,58,0.55)" },
        horzLines: { color: "rgba(30,30,58,0.55)" },
      },
      rightPriceScale: {
        borderColor: "rgba(30,30,58,0.8)",
      },
      timeScale: {
        borderColor: "rgba(30,30,58,0.8)",
        timeVisible: true,
      },
      crosshair: {
        vertLine: { color: "rgba(255,170,0,0.35)" },
        horzLine: { color: "rgba(255,170,0,0.35)" },
      },
    });
    chartRef.current = chart;

    const series = chart.addAreaSeries({
      lineColor: "#00ff88",
      topColor: "rgba(0,255,136,0.35)",
      bottomColor: "rgba(0,255,136,0.02)",
      lineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 3,
        minMove: 0.001,
      },
    });

    series.setData(
      history.map((point) => ({
        time: Math.floor(point.t / 1000) as UTCTimestamp,
        value: point.p,
      })),
    );

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [history]);

  const startTs = history[0]?.t ?? 0;
  const endTs = history[history.length - 1]?.t ?? 0;

  async function handleGenerateSummary() {
    if (!selectedMarket || !settings.anthropicKey) return;
    setIsGenerating(true);
    try {
      const result = await generateMarketSummary({
        apiKey: settings.anthropicKey,
        question: selectedMarket.question,
        headlines: matchedArticles.map((article) => article.title),
      });
      setSummary(result);
    } catch {
      setSummary("The direct Anthropic browser request failed. Check the key and browser network policy.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (!selectedMarket) {
    return <PanelShell kicker="Panel 4" title="Probability Chart">Select a market to load price history.</PanelShell>;
  }

  return (
    <PanelShell
      kicker="Panel 4"
      title="Probability Chart"
      action={
        <Badge className="border-[#1e1e3a] bg-[#0c101a] text-[#c8c8d4]">
          LIVE {formatPercent(currentPrice)}
        </Badge>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#6e738a]">Selected market</div>
            <div className="mt-1 text-sm text-[#f2f2f7]">{selectedMarket.question}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-[#00ff88] [text-shadow:0_0_20px_rgba(0,255,136,0.26)]">
              {formatPercent(currentPrice, 2)}
            </div>
            <div className={cn("text-xs", delta >= 0 ? "text-[#00ff88]" : "text-[#ff4444]")}>
              {delta >= 0 ? "+" : ""}
              {formatPercent(delta, 2)} vs 24h ago
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0b0f16]">
          <div ref={containerRef} className="h-[250px] w-full" />
          {startTs > 0 && endTs > startTs && (
            <div className="pointer-events-none absolute inset-0">
              {matchedArticles.slice(0, 10).map((article) => {
                const pct = ((article.timestamp - startTs) / (endTs - startTs)) * 100;
                if (pct < 0 || pct > 100) return null;
                return (
                  <div
                    key={article.id}
                    className="absolute bottom-0 top-0 w-px bg-[#ffaa00]/55"
                    style={{ left: `${pct}%` }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {settings.anthropicKey ? (
          <div className="space-y-3">
            <Button
              onClick={handleGenerateSummary}
              className="bg-[#00ff88]/12 text-[#00ff88] hover:bg-[#00ff88]/18"
              disabled={isGenerating}
            >
              <Sparkles className="size-4" />
              {isGenerating ? "Generating..." : "Generate AI Summary"}
            </Button>
            {summary ? (
              <div className="rounded-xl border border-[#1e1e3a] bg-[#0b0f16] p-3 text-sm leading-6 text-[#d3d7e5]">
                {summary}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </PanelShell>
  );
}
