// ============================================================
// In-memory TTL cache for API responses
// ============================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    console.log(`[cache] MISS ${key}`);
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    console.log(`[cache] EXPIRED ${key}`);
    return null;
  }
  console.log(`[cache] HIT ${key}`);
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlSeconds: number): void {
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/** TTL constants in seconds */
export const CACHE_TTL = {
  MARKET_LIST: 60,
  MARKET_SINGLE: 30,
  PRICE_HISTORY: 300,
  ORDERBOOK: 10,
  TRADES: 30,
  NEWS: 900, // 15 minutes — conserve newsdata.io credits
  ADVISOR: 60,
} as const;
