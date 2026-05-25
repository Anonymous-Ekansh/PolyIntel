"use client";

import { cn } from "@/lib/utils";

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]" },
  green:   { bg: "bg-green-500/15",   text: "text-green-400",   border: "border-green-500/30",   glow: "shadow-[0_0_12px_rgba(34,197,94,0.2)]" },
  lime:    { bg: "bg-lime-500/15",     text: "text-lime-400",    border: "border-lime-500/30",    glow: "" },
  gray:    { bg: "bg-gray-500/15",     text: "text-gray-400",    border: "border-gray-500/30",    glow: "" },
  orange:  { bg: "bg-orange-500/15",   text: "text-orange-400",  border: "border-orange-500/30",  glow: "" },
  red:     { bg: "bg-red-500/15",      text: "text-red-400",     border: "border-red-500/30",     glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]" },
  rose:    { bg: "bg-rose-500/15",     text: "text-rose-400",    border: "border-rose-500/30",    glow: "shadow-[0_0_12px_rgba(244,63,94,0.2)]" },
};

const SIZE_MAP = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

interface ScoreBadgeProps {
  recommendation: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ScoreBadge({ recommendation, color = "gray", size = "md", className }: ScoreBadgeProps) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.gray;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-bold uppercase tracking-widest",
        colors.bg,
        colors.text,
        colors.border,
        colors.glow,
        SIZE_MAP[size],
        className
      )}
    >
      {recommendation}
    </span>
  );
}
