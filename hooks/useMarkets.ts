"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllMarkets } from "@/lib/polymarket";
import { useAppStore } from "@/store/useAppStore";

export function useMarkets() {
  const setMarkets = useAppStore((state) => state.setMarkets);
  const setIsLoadingMarkets = useAppStore((state) => state.setIsLoadingMarkets);

  const query = useQuery({
    queryKey: ["markets"],
    queryFn: fetchAllMarkets,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    setIsLoadingMarkets(query.isLoading || query.isFetching);
  }, [query.isFetching, query.isLoading, setIsLoadingMarkets]);

  useEffect(() => {
    if (query.data) setMarkets(query.data);
  }, [query.data, setMarkets]);

  return query;
}
