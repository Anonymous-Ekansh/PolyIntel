"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "polyintel-watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((ids: string[]) => {
    setWatchlist(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, []);

  const isWatched = useCallback(
    (conditionId: string) => watchlist.includes(conditionId),
    [watchlist]
  );

  const toggle = useCallback(
    (conditionId: string) => {
      const next = watchlist.includes(conditionId)
        ? watchlist.filter((id) => id !== conditionId)
        : [...watchlist, conditionId];
      persist(next);
    },
    [watchlist, persist]
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return { watchlist, isWatched, toggle, clearAll, count: watchlist.length };
}
