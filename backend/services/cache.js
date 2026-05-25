const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const TTL = {
  MARKETS: 60,
  MARKET_DETAIL: 30,
  PRICE_HISTORY: 300,
  ORDERBOOK: 10,
  TRADES: 30,
  NEWS: 900,
  ANALYSIS: 120,
  CORRELATIONS: 600,
  ANOMALIES: 120,
};

async function getOrFetch(key, ttl, fn) {
  const cached = cache.get(key);
  if (cached !== undefined) {
    console.log(`[cache] HIT ${key}`);
    return cached;
  }

  console.log(`[cache] MISS ${key}`);
  const result = await fn();
  cache.set(key, result, ttl);
  return result;
}

function invalidate(key) {
  console.log(`[cache] INVALIDATE ${key}`);
  cache.del(key);
}

module.exports = {
  getOrFetch,
  invalidate,
  TTL,
  cache
};
