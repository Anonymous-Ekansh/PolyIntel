export const dynamic = "force-dynamic";

const STRAPI_URL =
  "https://api.codetabs.com/v1/proxy?quest=https://strapi-matic.poly.market/markets?active=true&_limit=200&_sort=volume:DESC";
const GAMMA_URL =
  "https://api.codetabs.com/v1/proxy?quest=https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=200";

function parseMaybeJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeMarketShape(market: Record<string, unknown>) {
  const outcomes = Array.isArray(market.outcomes)
    ? market.outcomes
    : parseMaybeJsonArray(market.outcomes);
  const outcomePrices = Array.isArray(market.outcomePrices)
    ? market.outcomePrices
    : parseMaybeJsonArray(market.outcomePrices);
  const tokenIds = Array.isArray(market.clobTokenIds)
    ? market.clobTokenIds
    : parseMaybeJsonArray(market.clobTokenIds);

  return {
    ...market,
    id: String(market.id ?? market.conditionId ?? market.condition_id ?? ""),
    conditionId: String(market.conditionId ?? market.condition_id ?? market.id ?? ""),
    question: String(market.question ?? ""),
    slug: String(market.slug ?? ""),
    active: Boolean(market.active ?? true),
    closed: Boolean(market.closed ?? false),
    endDate: String(market.endDate ?? market.end_date ?? ""),
    volume24hr: Number(market.volume24hr ?? market.volume_24h ?? market.volume ?? 0),
    outcomePrices,
    outcomes,
    clobTokenIds: tokenIds,
  };
}

export async function GET() {
  const urls = [STRAPI_URL, GAMMA_URL];
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 60 },
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        lastError = new Error(`Markets fetch failed with ${res.status} for ${url}`);
        continue;
      }

      const data = (await res.json()) as unknown;
      const rows = Array.isArray(data) ? data : [];
      const normalized = rows
        .map((market) => normalizeMarketShape(market as Record<string, unknown>))
        .filter((market) => market.id && market.question);

      return Response.json(normalized);
    } catch (error) {
      lastError = error;
    }
  }

  console.error("Markets API error:", lastError);
  return Response.json(
    {
      error: "Failed to fetch markets from Strapi and Gamma endpoints.",
    },
    { status: 502 },
  );
}
