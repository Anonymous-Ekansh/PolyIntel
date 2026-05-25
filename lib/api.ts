/**
 * Centralized API client for PolyIntel frontend.
 * All calls go through the Express backend — never directly to Polymarket.
 * Set NEXT_PUBLIC_API_BASE in .env.local to point to the backend.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";

async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${errorBody}`);
  }

  return res.json();
}

// ── Markets ──────────────────────────────────────────────
export function fetchMarkets(params?: {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  sort?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  if (params?.category && params.category !== "All") qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  if (params?.sort) qs.set("sort", params.sort);
  const q = qs.toString();
  return apiFetch(`/api/markets${q ? `?${q}` : ""}`);
}

export function fetchMarketFull(conditionId: string) {
  return apiFetch(`/api/markets/${conditionId}/full`);
}

// ── Analysis ─────────────────────────────────────────────
export function fetchAnalyzeTop() {
  return apiFetch("/api/analyze/top");
}

export function fetchBestBets() {
  return apiFetch("/api/analyze/best-bets");
}

// ── Intelligence ─────────────────────────────────────────
export function fetchAnomalies() {
  return apiFetch("/api/intelligence/anomalies");
}

export function fetchCorrelations() {
  return apiFetch("/api/intelligence/correlations");
}

export function fetchDivergences() {
  return apiFetch("/api/intelligence/divergences");
}

export function fetchRelatedMarkets(conditionId: string) {
  return apiFetch(`/api/intelligence/related/${conditionId}`);
}

// ── News ─────────────────────────────────────────────────
export function fetchNews(question: string, category?: string) {
  const qs = new URLSearchParams({ q: question });
  if (category) qs.set("category", category);
  return apiFetch(`/api/news?${qs.toString()}`);
}

// ── Health ───────────────────────────────────────────────
export function fetchHealth() {
  return apiFetch("/health");
}
