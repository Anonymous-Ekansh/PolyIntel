// ============================================================
// GET /api/dashboard — Aggregated homepage data
// Returns metrics, trending, and top scored markets
// ============================================================

import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/cache";
import { resilientFetch } from "@/lib/fetch";
import { scoreMarket, AdvisorResult } from "@/lib/advisor";

export const dynamic = "force-dynamic";

const GAMMA_API = process.env.POLYMARKET_GAMMA_API || "https://gamma-api.polymarket.com";
const CLOB_API = process.env.POLYMARKET_CLOB_API || "https://clob.polymarket.com";

interface NormalizedMarket {
  id: string;
  conditionId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
  liquidity: number;
  endDate: string;
  oneDayPriceChange: number;
  tokenIds: string[];
}

function parseMaybeJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeRaw(raw: Record<string, unknown>): NormalizedMarket | null {
  const conditionId = String(raw.conditionId ?? raw.condition_id ?? raw.id ?? "");
  const question = String(raw.question ?? "").trim();
  if (!conditionId || !question) return null;

  const outcomePrices = parseMaybeJsonArray(raw.outcomePrices);
  const tokenIds = parseMaybeJsonArray(raw.clobTokenIds).map(String);
  const yesPrice = Number(outcomePrices[0] ?? 0.5);

  return {
    id: String(raw.id ?? conditionId),
    conditionId,
    question,
    yesPrice,
    noPrice: Number(outcomePrices[1] ?? 1 - yesPrice),
    volume24hr: Number(raw.volume24hr ?? raw.volume_24h ?? 0),
    liquidity: Number(raw.liquidity ?? 0),
    endDate: String(raw.endDate ?? raw.end_date ?? ""),
    oneDayPriceChange: Number(raw.oneDayPriceChange ?? 0),
    tokenIds,
  };
}

interface DashboardData {
  metrics: {
    totalActiveMarkets: number;
    topVolumeMarket: { question: string; volume: number } | null;
    biggestYesMover: { question: string; change: number } | null;
    biggestNoMover: { question: string; change: number } | null;
  };
  trending: Array<{
    id: string;
    conditionId: string;
    question: string;
    yesPrice: number;
    noPrice: number;
    volume24hr: number;
    endDate: string;
  }>;
  topScored: Array<{
    conditionId: string;
    question: string;
    yesPrice: number;
    noPrice: number;
    volume24hr: number;
    advisor: AdvisorResult;
  }>;
}

export async function GET() {
  const cacheKey = "dashboard";
  const cached = cacheGet<DashboardData>(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  try {
    // Fetch markets
    const res = await resilientFetch(
      `${GAMMA_API}/markets?active=true&closed=false&limit=200&_sort=volume24hr:DESC`
    );
    const rawData = (await res.json()) as Record<string, unknown>[];
    const markets = rawData.map(normalizeRaw).filter((m): m is NormalizedMarket => m !== null);

    if (markets.length === 0) {
      return Response.json({ error: "No market data available" }, { status: 502 });
    }

    // Sort by volume
    const byVolume = [...markets].sort((a, b) => b.volume24hr - a.volume24hr);
    const byPriceChangeUp = [...markets].sort((a, b) => b.oneDayPriceChange - a.oneDayPriceChange);
    const byPriceChangeDown = [...markets].sort((a, b) => a.oneDayPriceChange - b.oneDayPriceChange);

    // Metrics
    const topVol = byVolume[0];
    const bigYes = byPriceChangeUp[0];
    const bigNo = byPriceChangeDown[0];

    const metrics = {
      totalActiveMarkets: markets.length,
      topVolumeMarket: topVol ? { question: topVol.question, volume: topVol.volume24hr } : null,
      biggestYesMover: bigYes && bigYes.oneDayPriceChange > 0
        ? { question: bigYes.question, change: bigYes.oneDayPriceChange }
        : null,
      biggestNoMover: bigNo && bigNo.oneDayPriceChange < 0
        ? { question: bigNo.question, change: bigNo.oneDayPriceChange }
        : null,
    };

    // Trending: top 6 by volume
    const trending = byVolume.slice(0, 6).map(m => ({
      id: m.id,
      conditionId: m.conditionId,
      question: m.question,
      yesPrice: m.yesPrice,
      noPrice: m.noPrice,
      volume24hr: m.volume24hr,
      endDate: m.endDate,
    }));

    // Top scored: run advisor on top 20 by volume
    const top20 = byVolume.slice(0, 20);
    const scoredResults: Array<{
      conditionId: string;
      question: string;
      yesPrice: number;
      noPrice: number;
      volume24hr: number;
      advisor: AdvisorResult;
    }> = [];

    // Score each — for dashboard we use simplified scoring (no additional API calls)
    for (const m of top20) {
      try {
        // Simplified scoring with available data
        const result = scoreMarket({
          currentYesPrice: m.yesPrice,
          priceHistory7d: m.oneDayPriceChange
            ? [
                { t: Date.now() - 7 * 86400000, p: m.yesPrice - m.oneDayPriceChange * 7 },
                { t: Date.now(), p: m.yesPrice },
              ]
            : [],
          volume24h: m.volume24hr,
          volumeHistory7d: [m.volume24hr], // approximate
          liquidity: m.liquidity,
          recentTrades: [], // unavailable in bulk
          endDate: m.endDate,
        });

        scoredResults.push({
          conditionId: m.conditionId,
          question: m.question,
          yesPrice: m.yesPrice,
          noPrice: m.noPrice,
          volume24hr: m.volume24hr,
          advisor: result,
        });
      } catch {
        // Skip markets that fail scoring
      }
    }

    // Split into LEAN_YES and LEAN_NO, take top 3 each
    const leanYes = scoredResults
      .filter(r => r.advisor.recommendation === "LEAN_YES")
      .sort((a, b) => b.advisor.finalScore - a.advisor.finalScore)
      .slice(0, 3);

    const leanNo = scoredResults
      .filter(r => r.advisor.recommendation === "LEAN_NO")
      .sort((a, b) => a.advisor.finalScore - b.advisor.finalScore)
      .slice(0, 3);

    const topScored = [...leanYes, ...leanNo];

    const dashboard: DashboardData = { metrics, trending, topScored };
    cacheSet(cacheKey, dashboard, CACHE_TTL.ADVISOR);
    return Response.json(dashboard);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: "Dashboard data unavailable" }, { status: 502 });
  }
}
