import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const compactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatUsd(value: number, compact = false) {
  return compact ? compactUsdFormatter.format(value) : usdFormatter.format(value)
}

export function formatPercent(value: number, digits = 1) {
  // Backend returns prices in 0-100 range. If value > 1, treat as already a percentage.
  const pct = value > 1 ? value : value * 100;
  return `${pct.toFixed(digits)}%`;
}

export function truncateMiddle(value: string, head = 6, tail = 4) {
  if (value.length <= head + tail + 3) return value
  return `${value.slice(0, head)}...${value.slice(-tail)}`
}
