"use client";

import { cn } from "@/lib/utils";

interface FactorBarProps {
  score: number;   // -10 to +10
  label: string;
  weight: string;  // e.g. "20%"
  name: string;    // e.g. "Momentum"
  className?: string;
}

export default function FactorBar({ score, label, weight, name, className }: FactorBarProps) {
  // Normalize score from [-10, 10] to [0, 100]
  const normalized = ((score + 10) / 20) * 100;
  const isPositive = score > 0;
  const isNeutral = Math.abs(score) < 1;

  const barColor = isNeutral
    ? "bg-gray-500"
    : isPositive
      ? score > 5
        ? "bg-emerald-500"
        : "bg-green-500"
      : score < -5
        ? "bg-rose-500"
        : "bg-orange-500";

  return (
    <div className={cn("flex items-center gap-3 py-1.5", className)}>
      {/* Factor name + weight */}
      <div className="w-28 shrink-0">
        <div className="text-xs text-white font-medium">{name}</div>
        <div className="text-[10px] text-[#6d7488]">{weight}</div>
      </div>

      {/* Bar */}
      <div className="flex-1 min-w-0">
        <div className="h-2 w-full bg-[#1e1e3a] rounded-full overflow-hidden relative">
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 h-full w-px bg-[#3a3a5a] z-10" />
          {/* Fill from center */}
          {isPositive ? (
            <div
              className={cn("absolute top-0 h-full rounded-r-full transition-all", barColor)}
              style={{ left: "50%", width: `${(score / 10) * 50}%` }}
            />
          ) : (
            <div
              className={cn("absolute top-0 h-full rounded-l-full transition-all", barColor)}
              style={{ right: "50%", width: `${(Math.abs(score) / 10) * 50}%` }}
            />
          )}
        </div>
      </div>

      {/* Score */}
      <div className={cn(
        "w-10 text-right text-xs font-mono font-bold",
        isNeutral ? "text-gray-400" : isPositive ? "text-green-400" : "text-red-400"
      )}>
        {score > 0 ? "+" : ""}{score.toFixed(1)}
      </div>

      {/* Label */}
      <div className="w-48 shrink-0 text-[11px] text-[#8b93a7] truncate hidden lg:block" title={label}>
        {label}
      </div>
    </div>
  );
}
