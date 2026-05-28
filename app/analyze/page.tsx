"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Brain, ChevronDown, ChevronUp, AlertTriangle, Shield, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatUsd } from "@/lib/utils";
import { fetchAnalyzeTop } from "@/lib/api";
import ScoreBadge from "@/components/shared/ScoreBadge";
import FactorBar from "@/components/shared/FactorBar";
import ConfidenceDots from "@/components/shared/ConfidenceDots";

const FILTERS = ["ALL", "STRONG YES", "LEAN YES", "WEAK YES", "SKIP", "WEAK NO", "LEAN NO", "STRONG NO"];
const SORT_OPTIONS = ["score", "volume", "confidence", "daysLeft"] as const;
const CONFIDENCE_FILTERS = ["Any", "MEDIUM", "HIGH"];

export default function AnalyzePage() {
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]>("score");
  const [minConfidence, setMinConfidence] = useState("Any");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: scoredMarkets, isLoading, isError } = useQuery({
    queryKey: ["analyze-top"],
    queryFn: fetchAnalyzeTop,
    refetchInterval: 120_000,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!scoredMarkets || !Array.isArray(scoredMarkets)) return [];
    let result = [...scoredMarkets];

    // Filter by recommendation
    if (filter !== "ALL") {
      result = result.filter((m: any) => m.score?.recommendation === filter);
    }

    // Filter by confidence
    if (minConfidence !== "Any") {
      const levels = minConfidence === "HIGH" ? ["HIGH"] : ["HIGH", "MEDIUM"];
      result = result.filter((m: any) => levels.includes(m.score?.confidence));
    }

    // Filter by category
    if (categoryFilter !== "All") {
      const catLower = categoryFilter.toLowerCase();
      result = result.filter((m: any) => {
        const cat = String(m.category || "").toLowerCase();
        const q = String(m.question || "").toLowerCase();
        return cat.includes(catLower) || q.includes(catLower);
      });
    }

    // Sort
    result.sort((a: any, b: any) => {
      if (sort === "score") return (b.score?.finalScore ?? 0) - (a.score?.finalScore ?? 0);
      if (sort === "volume") return (b.volume24hr ?? 0) - (a.volume24hr ?? 0);
      if (sort === "confidence") return (b.score?.confidenceScore ?? 0) - (a.score?.confidenceScore ?? 0);
      if (sort === "daysLeft") return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
      return 0;
    });

    return result;
  }, [scoredMarkets, filter, sort, minConfidence, categoryFilter]);

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-widest text-white flex items-center gap-3">
          <Brain className="size-8 text-[#8b5cf6]" />
          Full Analysis Hub
        </h1>
        <p className="mt-2 text-sm text-[#8b93a7]">
          All markets scored and ranked by PolyIntel&apos;s 6-factor deterministic engine. No AI, pure math.
        </p>
      </div>

      {/* ── Controls ──────────────────────── */}
      <div className="mb-6 space-y-4">
        {/* Recommendation Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30"
                  : "bg-[#101422] text-[#8b93a7] border border-[#1e1e3a] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2 text-xs text-[#6d7488]">
            <span>Sort:</span>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded px-2 py-1 text-xs capitalize ${
                  sort === s ? "bg-[#1e1e3a] text-white" : "text-[#6d7488] hover:text-white"
                }`}
              >
                {s === "daysLeft" ? "Days Left" : s}
              </button>
            ))}
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-2 text-xs text-[#6d7488]">
            <span>Min Confidence:</span>
            {CONFIDENCE_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => setMinConfidence(c)}
                className={`rounded px-2 py-1 text-xs ${
                  minConfidence === c ? "bg-[#1e1e3a] text-white" : "text-[#6d7488] hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────── */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl bg-[#1e1e3a]/30" />)}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-[#ff4444]/20 bg-[#2a1014] p-6 text-center text-[#ffc2c2]">
          Failed to load analysis. Is the backend running?
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c1019] py-16 text-center">
          <Brain className="mx-auto size-12 text-[#30385c] mb-4" />
          <h3 className="text-lg text-white font-medium">No markets match your filters</h3>
          <p className="text-[#6d7488] mt-1 text-sm">Try broadening your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs tracking-wider text-[#6d7488] mb-4">
            {filtered.length} MARKETS SCORED
          </div>

          {filtered.map((market: any) => {
            const s = market.score;
            const isExpanded = expandedIds.has(market.conditionId);

            return (
              <Card key={market.conditionId} className="border-[#1e1e3a] bg-[#0c1019] overflow-hidden">
                <CardContent className="p-0">
                  {/* Main Card Body */}
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT: Market Info */}
                    <div className="lg:col-span-3 space-y-3">
                      <Link href={`/market/${market.conditionId}`} className="hover:text-white transition-colors">
                        <h3 className="text-sm text-[#d7d7e2] leading-snug hover:text-white">{market.question}</h3>
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded border border-[#8b5cf6]/20">
                          {market.category || "Other"}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-[#6d7488] bg-[#101422] px-2 py-0.5 rounded border border-[#1e1e3a]">
                          {market.daysLeft ?? "?"}d left
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-[#6d7488] bg-[#101422] px-2 py-0.5 rounded border border-[#1e1e3a]">
                          {formatUsd(market.volume24hr, true)} vol
                        </span>
                      </div>
                    </div>

                    {/* CENTER: Score Breakdown */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <ScoreBadge recommendation={s?.recommendation ?? "SKIP"} color={s?.recommendationColor ?? "gray"} size="lg" />
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-mono font-bold text-white">
                            {(s?.finalScore ?? 0) > 0 ? "+" : ""}{(s?.finalScore ?? 0).toFixed(1)}
                          </span>
                          <ConfidenceDots level={s?.confidence ?? "LOW"} />
                        </div>
                      </div>

                      {/* 6 Factor Bars */}
                      {s?.factors && (
                        <div className="space-y-0.5">
                          <FactorBar name="Momentum" score={s.factors.momentum?.score ?? 0} label={s.factors.momentum?.label ?? ""} weight={s.factors.momentum?.weight ?? "20%"} />
                          <FactorBar name="Volume" score={s.factors.volume?.score ?? 0} label={s.factors.volume?.label ?? ""} weight={s.factors.volume?.weight ?? "20%"} />
                          <FactorBar name="Order Flow" score={s.factors.orderFlow?.score ?? 0} label={s.factors.orderFlow?.label ?? ""} weight={s.factors.orderFlow?.weight ?? "20%"} />
                          <FactorBar name="Edge" score={s.factors.edge?.score ?? 0} label={s.factors.edge?.label ?? ""} weight={s.factors.edge?.weight ?? "20%"} />
                          <FactorBar name="Orderbook" score={s.factors.orderbook?.score ?? 0} label={s.factors.orderbook?.label ?? ""} weight={s.factors.orderbook?.weight ?? "10%"} />
                          <FactorBar name="Time Value" score={s.factors.timeValue?.score ?? 0} label={s.factors.timeValue?.label ?? ""} weight={s.factors.timeValue?.weight ?? "10%"} />
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Intelligence */}
                    <div className="lg:col-span-4 space-y-3">
                      {/* Reasoning */}
                      <div className="space-y-2">
                        {typeof s?.reasoning === 'string' ? (
                          <p className="text-xs text-[#8b93a7] leading-relaxed">{s?.reasoning}</p>
                        ) : s?.reasoning ? (
                          <div className="space-y-1.5 text-[11px] text-[#8b93a7]">
                            <p><span className="text-white font-semibold uppercase tracking-wider text-[10px]">Facts:</span> {s.reasoning.facts}</p>
                            <p><span className="text-white font-semibold uppercase tracking-wider text-[10px]">Inference:</span> {s.reasoning.inference}</p>
                            <p><span className="text-white font-semibold uppercase tracking-wider text-[10px]">Assumptions:</span> {s.reasoning.assumptions}</p>
                            <p><span className="text-white font-semibold uppercase tracking-wider text-[10px]">Confidence:</span> {s.reasoning.confidence}</p>
                          </div>
                        ) : null}
                      </div>

                      {/* Counter-Arguments */}
                      {s?.counterArguments?.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="size-3" /> Counter-Arguments
                          </div>
                          {s.counterArguments.map((ca: string, i: number) => (
                            <p key={i} className="text-[11px] text-[#6d7488] leading-relaxed pl-4 border-l border-orange-500/20">
                              {ca}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Position Sizing */}
                      {s?.positionSizing && (
                        <div className="rounded-lg border border-[#1e1e3a] bg-[#101422] p-3">
                          <div className="text-[10px] uppercase tracking-widest text-[#6d7488] mb-1 flex items-center gap-1">
                            <Target className="size-3" /> Position Sizing
                          </div>
                          <div className="flex gap-4 text-xs">
                            <span className="text-white">
                              Half-Kelly: <span className="font-mono text-[#00ff88]">{s.positionSizing.suggestedSizePct}%</span>
                            </span>
                            <span className="text-[#6d7488]">
                              Max: <span className="font-mono">{s.positionSizing.maxSizePct}%</span>
                            </span>
                          </div>
                          <p className="text-[10px] text-[#6d7488] mt-1">{s.positionSizing.note}</p>
                        </div>
                      )}

                      {/* Invalidating Conditions */}
                      {s?.invalidatingConditions?.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase tracking-widest text-red-400 font-bold flex items-center gap-1">
                            <Shield className="size-3" /> Invalidating Conditions
                          </div>
                          {s.invalidatingConditions.map((ic: string, i: number) => (
                            <p key={i} className="text-[11px] text-[#6d7488] leading-relaxed pl-4 border-l border-red-500/20">
                              {ic}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(market.conditionId)}
                    className="w-full border-t border-[#1e1e3a] py-2 text-xs text-[#6d7488] hover:text-white hover:bg-[#101422] transition-colors flex items-center justify-center gap-1"
                  >
                    {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    {isExpanded ? "Collapse Details" : "Expand Factor Details"}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && s?.factors && (
                    <div className="border-t border-[#1e1e3a] p-5 bg-[#080c14] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(s.factors).map(([key, factor]: [string, any]) => (
                          <div key={key} className="rounded-lg border border-[#1e1e3a] bg-[#0c1019] p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs uppercase tracking-widest text-white font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className={`text-sm font-mono font-bold ${factor.score > 0 ? "text-green-400" : factor.score < 0 ? "text-red-400" : "text-gray-400"}`}>
                                {factor.score > 0 ? "+" : ""}{factor.score?.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#8b93a7] leading-relaxed">{factor.detail}</p>
                          </div>
                        ))}
                      </div>

                      {/* Data Quality */}
                      {s.dataQuality && (
                        <div className="flex gap-3 text-[10px] text-[#6d7488]">
                          <span>History: {s.dataQuality.hasHistory ? "✓" : "✗"}</span>
                          <span>Trades: {s.dataQuality.hasTrades ? "✓" : "✗"}</span>
                          <span>Orderbook: {s.dataQuality.hasOrderbook ? "✓" : "✗"}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
