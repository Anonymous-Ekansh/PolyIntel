"use client";

import { cn } from "@/lib/utils";

interface ConfidenceDotsProps {
  level: "LOW" | "MEDIUM" | "HIGH";
  className?: string;
}

export default function ConfidenceDots({ level, className }: ConfidenceDotsProps) {
  const filled = level === "HIGH" ? 3 : level === "MEDIUM" ? 2 : 1;
  const colorMap = {
    LOW: "bg-orange-400",
    MEDIUM: "bg-yellow-400",
    HIGH: "bg-emerald-400",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className={cn(
            "size-2 rounded-full transition-all",
            dot <= filled ? colorMap[level] : "bg-[#1e1e3a]"
          )}
        />
      ))}
      <span className={cn(
        "ml-1 text-[10px] uppercase tracking-widest font-bold",
        level === "HIGH" ? "text-emerald-400" : level === "MEDIUM" ? "text-yellow-400" : "text-orange-400"
      )}>
        {level}
      </span>
    </div>
  );
}
