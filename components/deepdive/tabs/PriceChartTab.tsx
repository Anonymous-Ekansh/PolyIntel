'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';

const INTERVALS = [
  { key: '1h', label: '1H' },
  { key: '6h', label: '6H' },
  { key: '1d', label: '1D' },
  { key: 'max', label: '7D' },
];

export default function PriceChartTab() {
  const selectedMarket = useAppStore(s => s.selectedMarket);
  const priceHistory = useAppStore(s => s.priceHistory);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  const [activeInterval, setActiveInterval] = useState('1d');
  const [isLoading, setIsLoading] = useState(false);

  const history = selectedMarket ? priceHistory[selectedMarket.conditionId] || [] : [];

  const loadChart = useCallback(async () => {
    if (!selectedMarket?.conditionId || !chartContainerRef.current) return;
    setIsLoading(true);

    try {
      // Fetch price history for selected interval
      const res = await fetch(`/api/prices-history?market=${selectedMarket.conditionId}&interval=${activeInterval}&fidelity=60`);
      if (!res.ok) return;
      const data = await res.json();
      const points = (data.history || data || []).map((p: { t: number; p: number }) => ({
        time: Number(p.t) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        value: Number(p.p),
      })).sort((a: { time: number }, b: { time: number }) => (a.time as number) - (b.time as number));

      if (points.length === 0) { setIsLoading(false); return; }

      const { createChart, ColorType, LineStyle } = await import('lightweight-charts');
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#c8c8d4', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 },
        grid: { vertLines: { color: '#1e1e3a', style: LineStyle.Dotted }, horzLines: { color: '#1e1e3a', style: LineStyle.Dotted } },
        crosshair: { vertLine: { color: '#00ff8840', labelBackgroundColor: '#0f0f1a' }, horzLine: { color: '#00ff8840', labelBackgroundColor: '#0f0f1a' } },
        rightPriceScale: { borderColor: '#1e1e3a', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: '#1e1e3a', timeVisible: true },
      });

      const areaSeries = chart.addAreaSeries({
        lineColor: '#00ff88', topColor: 'rgba(0, 255, 136, 0.15)', bottomColor: 'rgba(0, 255, 136, 0.01)', lineWidth: 2,
        priceFormat: { type: 'custom', formatter: (price: number) => `${(price * 100).toFixed(0)}¢` },
      });

      areaSeries.setData(points);
      chart.timeScale().fitContent();
      chartRef.current = chart;

      const resizeObserver = new ResizeObserver(() => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      });
      resizeObserver.observe(chartContainerRef.current);
    } catch (err) {
      console.error('Chart error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMarket, activeInterval]);

  useEffect(() => {
    loadChart();
    return () => { if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, [loadChart]);

  if (!selectedMarket) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Chart header */}
      <div className="flex items-center justify-between border-b border-[#1e1e3a] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xl font-bold ${selectedMarket.yesPrice > 0.6 ? 'text-[#00ff88]' : selectedMarket.yesPrice < 0.4 ? 'text-[#ff4444]' : 'text-[#ffaa00]'}`}
            style={{ textShadow: '0 0 12px rgba(0,255,136,0.2)' }}>
            {(selectedMarket.yesPrice * 100).toFixed(1)}¢
          </span>
          <span className="font-mono text-[10px] text-[#c8c8d4]/40">YES Price</span>
        </div>

        {/* Interval toggle */}
        <div className="flex gap-1">
          {INTERVALS.map(iv => (
            <button
              key={iv.key}
              onClick={() => setActiveInterval(iv.key)}
              className={`rounded-md px-2.5 py-1 font-mono text-[10px] font-semibold transition-all ${
                activeInterval === iv.key
                  ? 'bg-[#00ff88]/10 text-[#00ff88]'
                  : 'text-[#c8c8d4]/30 hover:text-[#c8c8d4]/60'
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="relative min-h-[350px] flex-1">
        <div ref={chartContainerRef} className="absolute inset-0" />
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0f]/80">
            <Loader2 className="h-6 w-6 animate-spin text-[#00ff88]" />
          </div>
        )}
        {!isLoading && history.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <p className="font-mono text-xs text-[#c8c8d4]/30">No price history available</p>
          </div>
        )}
      </div>
    </div>
  );
}
