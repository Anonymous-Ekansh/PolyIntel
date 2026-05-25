"use client";

import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdvisorPanelProps {
  score: any;
}

export default function AdvisorPanel({ score }: AdvisorPanelProps) {
  if (!score) {
    return null;
  }

  const { recommendation, confidence, finalScore, components, factors, summary } = score;

  const isPositive = finalScore > 0;
  const isNeutral = finalScore === 0;

  // Use components or factors depending on backend representation
  const fact = factors || components || {};
  
  return (
    <Card className="border-[#1e1e3a] bg-[#0c1019] overflow-hidden">
      <div className="border-b border-[#1e1e3a] bg-[#101422] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#8b5cf6]/20 text-[#8b5cf6]">
            ★
          </div>
          <div>
            <h3 className="font-heading uppercase tracking-widest text-white text-sm">Smart Bet Advisor</h3>
            <p className="text-[10px] text-[#8b93a7] uppercase tracking-widest">Algorithmic Scoring Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#6d7488] mb-1">Recommendation</div>
            <Badge 
              variant="outline" 
              className={
                recommendation === "LEAN_YES" || recommendation === "STRONG_YES" ? "border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/10" :
                recommendation === "LEAN_NO" || recommendation === "STRONG_NO" ? "border-[#ff4444]/30 text-[#ff4444] bg-[#ff4444]/10" :
                "border-[#8b93a7]/30 text-[#8b93a7] bg-[#8b93a7]/10"
              }
            >
              {recommendation?.replace("_", " ") ?? "UNKNOWN"}
            </Badge>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#6d7488] mb-1">Confidence</div>
            <div className="flex gap-1">
              <div className={`h-1.5 w-6 rounded-full ${confidence !== "LOW" ? "bg-white" : "bg-white/20"}`} />
              <div className={`h-1.5 w-6 rounded-full ${confidence === "HIGH" || confidence === "MEDIUM" ? "bg-white" : "bg-[#1e1e3a]"}`} />
              <div className={`h-1.5 w-6 rounded-full ${confidence === "HIGH" ? "bg-white" : "bg-[#1e1e3a]"}`} />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="mb-8">
          <div className="flex justify-between text-xs text-[#8b93a7] mb-2 font-mono">
            <span>-10 (STRONG NO)</span>
            <span className="text-white font-bold">SCORE: {finalScore > 0 ? "+" : ""}{finalScore}</span>
            <span>+10 (STRONG YES)</span>
          </div>
          <div className="relative h-2 w-full rounded-full bg-[#1e1e3a]">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -ml-[1px] bg-[#30385c] z-10" />
            
            {/* Fill bar */}
            <div 
              className={`absolute top-0 bottom-0 rounded-full transition-all duration-1000 ${
                isPositive ? "bg-[#00ff88]" : isNeutral ? "bg-[#8b93a7]" : "bg-[#ff4444]"
              }`}
              style={{
                left: isPositive ? "50%" : `${50 + (finalScore / 20) * 100}%`,
                right: isPositive ? `${50 - (finalScore / 20) * 100}%` : "50%"
              }}
            />
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {fact.momentum && <ScoreRow name="Momentum" data={fact.momentum} />}
          {fact.volume && <ScoreRow name="Volume Trend" data={fact.volume} />}
          {fact.orderFlow && <ScoreRow name="Order Flow" data={fact.orderFlow} />}
          {fact.edge && <ScoreRow name="Edge" data={fact.edge} />}
          {fact.orderbook && <ScoreRow name="Orderbook" data={fact.orderbook} />}
          {fact.timeValue && <ScoreRow name="Time Value" data={fact.timeValue} />}
        </div>

        <div className="rounded-xl bg-[#101422] border border-[#1e1e3a] p-4 text-sm text-[#d7d7e2] leading-relaxed relative">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#8b5cf6] rounded-l-xl" />
          {typeof (summary || score.reasoning) === 'string' ? (
            <span>{summary || score.reasoning}</span>
          ) : (score.reasoning ? (
            <div className="space-y-2 text-xs">
              <p><span className="text-white font-semibold uppercase tracking-wider text-[10px]">Facts:</span> {score.reasoning.facts}</p>
              <p><span className="text-white font-semibold uppercase tracking-wider text-[10px]">Inference:</span> {score.reasoning.inference}</p>
              <p><span className="text-white font-semibold uppercase tracking-wider text-[10px]">Assumptions:</span> {score.reasoning.assumptions}</p>
              <p><span className="text-white font-semibold uppercase tracking-wider text-[10px]">Confidence:</span> {score.reasoning.confidence}</p>
            </div>
          ) : null)}
        </div>

        <div className="mt-4 flex items-center gap-2 text-[10px] text-[#6d7488]">
          <Info className="size-3" />
          This is algorithmic scoring based on historical market data, not financial advice.
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreRow({ name, data }: { name: string, data: { score: number, label: string, detail: string } }) {
  const isPos = data.score > 0;
  const isNeu = data.score === 0;

  return (
    <div className="grid grid-cols-[100px_1fr] md:grid-cols-[120px_100px_1fr] items-center gap-4 py-2 border-b border-[#1e1e3a]/50 last:border-0">
      <div className="text-xs uppercase tracking-wider text-[#8b93a7]">{name}</div>
      
      <div className="hidden md:block relative h-1.5 w-full rounded-full bg-[#1e1e3a]">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#30385c] z-10" />
        <div 
          className={`absolute top-0 bottom-0 rounded-full ${
            isPos ? "bg-[#00ff88]" : isNeu ? "bg-[#8b93a7]" : "bg-[#ff4444]"
          }`}
          style={{
            left: isPos ? "50%" : `${50 + (data.score / 20) * 100}%`,
            right: isPos ? `${50 - (data.score / 20) * 100}%` : "50%"
          }}
        />
      </div>

      <div>
        <div className="text-sm text-white mb-0.5">{data.label} <span className="text-xs text-[#6d7488] ml-2">({data.score > 0 ? "+" : ""}{data.score})</span></div>
        <div className="text-xs text-[#6d7488]">{data.detail}</div>
      </div>
    </div>
  );
}
