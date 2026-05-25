"use client";

import { useState, useMemo } from "react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

interface ProbabilityChartProps {
  history: any[];
}

type Timeframe = "1d" | "7d" | "30d" | "all";

export default function ProbabilityChart({ history }: ProbabilityChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("7d");

  const data = useMemo(() => {
    if (!history || !Array.isArray(history)) return [];
    
    const now = Date.now();
    let startTs = 0;
    if (timeframe === "1d") startTs = now - 24 * 60 * 60 * 1000;
    else if (timeframe === "7d") startTs = now - 7 * 24 * 60 * 60 * 1000;
    else if (timeframe === "30d") startTs = now - 30 * 24 * 60 * 60 * 1000;

    return history
      .filter((h) => {
        const t = h.t * 1000; // backend returns seconds typically, but check if it's already ms
        // ensure t is in ms
        const msT = t < 10000000000 ? t * 1000 : t;
        return startTs === 0 || msT >= startTs;
      })
      .map((h) => {
         const t = h.t < 10000000000 ? h.t * 1000 : h.t;
         return {
           t,
           p: h.p * 100, // convert 0-1 to 0-100
         };
      });
  }, [history, timeframe]);

  return (
    <div className="w-full flex flex-col h-[400px]">
      <div className="flex justify-end mb-4">
        <div className="flex bg-[#101422] rounded-lg border border-[#1e1e3a] p-1">
          {(["1d", "7d", "30d", "all"] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
                timeframe === tf 
                  ? "bg-[#1e1e3a] text-white" 
                  : "text-[#6d7488] hover:text-[#d7d7e2]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {!data || data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#6d7488] border border-[#1e1e3a] rounded-xl bg-[#0c1019]">
          No price history available.
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="t" 
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(val) => {
                  if (timeframe === "1d") return format(val, "HH:mm");
                  return format(val, "MMM dd");
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6d7488" }}
                dy={10}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
                tick={{ fontSize: 10, fill: "#6d7488" }}
              />
              <Tooltip
                cursor={{ stroke: '#30385c', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload;
                    const isAbove50 = pt.p >= 50;
                    return (
                      <div className="rounded-lg border border-[#1e1e3a] bg-[#0c1019] p-3 shadow-xl">
                        <div className="text-[10px] uppercase text-[#8b93a7] mb-1">
                          {format(pt.t, timeframe === "1d" ? "MMM dd, HH:mm" : "MMM dd, yyyy")}
                        </div>
                        <div className={`font-mono text-xl font-bold ${isAbove50 ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
                          {pt.p.toFixed(1)}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={50} stroke="#30385c" strokeDasharray="3 3" />
              <Area 
                type="stepAfter" 
                dataKey="p" 
                stroke={data[data.length - 1].p >= 50 ? "#00ff88" : "#ff4444"} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={data[data.length - 1].p >= 50 ? "url(#colorPos)" : "url(#colorNeg)"}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
