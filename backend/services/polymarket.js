const axios = require("axios");
require("dotenv").config();

const GAMMA_API = process.env.GAMMA_API || "https://gamma-api.polymarket.com";
const CLOB_API = process.env.CLOB_API || "https://clob.polymarket.com";
const DATA_API = process.env.DATA_API || "https://data-api.polymarket.com";
const POLYMARKET_PROXY = process.env.POLYMARKET_PROXY === "true";

// Helper for delay
const delay = (ms) => new Promise((resolve) => resolve && setTimeout(resolve, ms));

// Resilient request client using axios with retries & optional proxy
async function resilientRequest(url, options = {}) {
  const retries = options.retries ?? 2;
  const timeout = options.timeout ?? 10000;
  
  let targetUrl = url;
  if (POLYMARKET_PROXY) {
    targetUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios({
        url: targetUrl,
        method: options.method || "GET",
        data: options.data,
        headers: options.headers,
        timeout: timeout,
      });
      return response.data;
    } catch (error) {
      console.warn(`[Polymarket Service] Attempt ${attempt} failed for ${url}: ${error.message}`);
      if (attempt === retries) {
        throw error;
      }
      await delay(1000);
    }
  }
}

// Helper to safely parse JSON strings or arrays
function safeParseJson(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`Failed to parse JSON string: ${raw}`);
      return null;
    }
  }
  return null;
}

// Parser helper for market objects
function parseMarket(raw) {
  if (!raw) return null;

  // 1. Safe parsing of outcomePrices and computing yesPrice/noPrice
  const pricesRaw = safeParseJson(raw.outcomePrices) || [];
  const prices = Array.isArray(pricesRaw) ? pricesRaw : [];
  const yesPrice = prices[0] !== undefined ? parseFloat(prices[0]) * 100 : 50;
  const noPrice = prices[1] !== undefined ? parseFloat(prices[1]) * 100 : (100 - yesPrice);

  // 2. Safe parsing of clobTokenIds
  const tokenIdsRaw = safeParseJson(raw.clobTokenIds) || [];
  const tokenIds = Array.isArray(tokenIdsRaw) ? tokenIdsRaw : [];
  const yesTokenId = tokenIds[0] || "";
  const noTokenId = tokenIds[1] || "";

  // 3. Safe parsing of outcomes
  const outcomesRaw = safeParseJson(raw.outcomes) || ["YES", "NO"];
  const outcomes = Array.isArray(outcomesRaw) ? outcomesRaw : ["YES", "NO"];

  // Compute standard metrics
  const now = Date.now();
  const endDate = raw.endDate || raw.end_date;
  const daysLeft = endDate ? Math.ceil((new Date(endDate) - now) / 86400000) : 0;

  let tags = [];
  if (typeof raw.tags === "string") {
    tags = safeParseJson(raw.tags) || [];
  } else if (Array.isArray(raw.tags)) {
    tags = raw.tags;
  }
  const category = tags?.[0]?.label ?? raw.category ?? "Other";

  const volume24hr = parseFloat(raw.volume24hr ?? raw.volumeClob24hr ?? 0);
  const totalVolume = parseFloat(raw.volume ?? raw.volumeNum ?? 0);
  const liquidity = parseFloat(raw.liquidity ?? 0);

  return {
    ...raw,
    id: String(raw.id ?? raw.conditionId ?? ""),
    conditionId: String(raw.conditionId ?? raw.id ?? ""),
    question: raw.question || "",
    slug: raw.slug || "",
    active: Boolean(raw.active ?? true),
    closed: Boolean(raw.closed ?? false),
    endDate,
    daysLeft,
    category,
    yesPrice,
    noPrice,
    yesTokenId,
    noTokenId,
    tokenIds,
    outcomes,
    volume24hr,
    totalVolume,
    liquidity,
    description: raw.description || "",
    oneDayPriceChange: parseFloat(raw.oneDayPriceChange ?? 0),
  };
}

async function getMarkets(limit = 100, offset = 0) {
  const url = `${GAMMA_API}/markets?active=true&closed=false&limit=${limit}&offset=${offset}&order=volume&ascending=false`;
  const rawList = await resilientRequest(url);
  if (!Array.isArray(rawList)) return [];
  return rawList.map(parseMarket).filter(Boolean);
}

async function getMarket(conditionId) {
  const url = `${GAMMA_API}/markets?conditionId=${conditionId}`;
  const rawList = await resilientRequest(url);
  if (Array.isArray(rawList) && rawList.length > 0) {
    return parseMarket(rawList[0]);
  }
  // Try fallback search by id if conditionId lookup fails
  const url2 = `${GAMMA_API}/markets?id=${conditionId}`;
  const rawList2 = await resilientRequest(url2);
  if (Array.isArray(rawList2) && rawList2.length > 0) {
    return parseMarket(rawList2[0]);
  }
  return null;
}

async function getPriceHistory(tokenId) {
  const url = `${CLOB_API}/prices-history?market=${tokenId}&interval=max&fidelity=60`;
  const data = await resilientRequest(url);
  // CLOB API may return direct array or object { history: [...] }
  const history = Array.isArray(data) ? data : (data?.history ?? []);
  return {
    history: history.map((h) => ({
      t: Number(h.t ?? h.timestamp ?? 0),
      p: Number(h.p ?? h.close ?? 0),
    })),
  };
}

async function getOrderbook(tokenId) {
  const url = `${CLOB_API}/book?token_id=${tokenId}`;
  const data = await resilientRequest(url);
  return {
    bids: Array.isArray(data?.bids) ? data.bids : [],
    asks: Array.isArray(data?.asks) ? data.asks : [],
  };
}

async function getTrades(conditionId, limit = 100) {
  // Try data API first, fallback to clob API trades if data API fails
  try {
    const url = `${DATA_API}/trades?market=${conditionId}&limit=${limit}`;
    const data = await resilientRequest(url);
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch (err) {
    console.warn(`[Polymarket Service] Data API trades failed, attempting CLOB API fallback for ${conditionId}`);
    try {
      const url = `${CLOB_API}/trades?market=${conditionId}&limit=${limit}`;
      const data = await resilientRequest(url);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (e) {
      console.error(`[Polymarket Service] All trade methods failed for ${conditionId}`, e);
      return [];
    }
  }
}

async function getTimeSeries(tokenId) {
  const url = `${CLOB_API}/prices-history?market=${tokenId}&interval=1d&fidelity=1440`;
  const data = await resilientRequest(url);
  const history = Array.isArray(data) ? data : (data?.history ?? []);
  return {
    history: history.map((h) => ({
      t: Number(h.t ?? h.timestamp ?? 0),
      p: Number(h.p ?? h.close ?? 0),
    })),
  };
}

module.exports = {
  getMarkets,
  getMarket,
  getPriceHistory,
  getOrderbook,
  getTrades,
  getTimeSeries,
  parseMarket,
};
