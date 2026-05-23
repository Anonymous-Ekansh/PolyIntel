"use client";

import { Star } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  conditionId: string;
  className?: string;
  size?: "sm" | "md";
}

export default function WatchlistButton({ conditionId, className, size = "sm" }: WatchlistButtonProps) {
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(conditionId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(conditionId);
      }}
      className={cn(
        "rounded-lg border transition-all",
        watched
          ? "border-[#ffaa00]/40 bg-[#ffaa00]/10 text-[#ffaa00] hover:bg-[#ffaa00]/20"
          : "border-[#1e1e3a] bg-transparent text-[#6d7488] hover:border-[#334066] hover:text-white",
        size === "sm" ? "p-1.5" : "p-2",
        className
      )}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Star className={cn("size-4", watched && "fill-current")} />
    </button>
  );
}
