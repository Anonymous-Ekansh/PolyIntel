// ============================================================
// GET /api/news/combined?question=xxx&category=politics
// Fetch and combine news from newsdata.io + rss2json
// ============================================================

import { NextRequest } from "next/server";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/cache";
import { extractKeywords } from "@/lib/keywords";

export const dynamic = "force-dynamic";

const NEWSDATA_API = "https://newsdata.io/api/1/news";
const RSS2JSON_API = "https://api.rss2json.com/v1/api.json";

const RSS_FEEDS_BY_CATEGORY: Record<string, string[]> = {
  politics: [
    "https://feeds.bbci.co.uk/news/politics/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
  ],
  crypto: [
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
  ],
  sports: [
    "https://feeds.bbci.co.uk/sport/rss.xml",
  ],
  economics: [
    "https://feeds.bbci.co.uk/news/business/rss.xml",
  ],
  default: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
  ],
};

interface NewsArticle {
  title: string;
  link: string;
  description: string;
  source: string;
  pubDate: string;
  timestamp: number;
}

function buildSearchQuery(question: string): string {
  return extractKeywords(question, 3).join(" ");
}

function detectCategory(question: string): string {
  const q = question.toLowerCase();
  if (/\b(trump|biden|election|congress|senate|vote|governor|president|minister|political|democrat|republican|parliament)\b/.test(q)) return "politics";
  if (/\b(bitcoin|crypto|ethereum|token|blockchain|defi|nft|btc|eth|solana)\b/.test(q)) return "crypto";
  if (/\b(nba|nfl|soccer|football|tennis|ufc|boxing|mlb|championship|world cup|olympics|sports?)\b/.test(q)) return "sports";
  if (/\b(gdp|inflation|interest rate|fed|economy|recession|stock|market cap|s&p|nasdaq|dow)\b/.test(q)) return "economics";
  return "default";
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) overlap++; });
  return overlap / Math.min(wordsA.size, wordsB.size);
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function matchesQuestion(article: { title: string; description: string }, questionKeywords: string[]): boolean {
  const text = `${article.title} ${article.description}`.toLowerCase();
  return questionKeywords.some(kw => text.includes(kw.toLowerCase()));
}

async function fetchNewsdata(query: string, apiKey: string): Promise<NewsArticle[]> {
  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      q: query,
      language: "en",
      size: "5",
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(`${NEWSDATA_API}?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (res.status === 429) {
      console.warn("[news] newsdata.io rate limited (429) — falling back to rss2json only");
      return [];
    }
    if (!res.ok) {
      console.warn(`[news] newsdata.io returned ${res.status}`);
      return [];
    }

    const json = await res.json() as { results?: Array<{
      title?: string;
      link?: string;
      description?: string;
      source_id?: string;
      pubDate?: string;
    }> };

    return (json.results ?? []).map(item => ({
      title: item.title ?? "Untitled",
      link: item.link ?? "#",
      description: stripHtml(item.description ?? ""),
      source: item.source_id ?? "newsdata.io",
      pubDate: item.pubDate ?? new Date().toISOString(),
      timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
    }));
  } catch (err) {
    console.warn("[news] newsdata.io fetch failed:", err);
    return [];
  }
}

async function fetchRss2json(feedUrl: string, apiKey?: string): Promise<NewsArticle[]> {
  try {
    let url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(feedUrl)}&count=5`;
    if (apiKey) url += `&api_key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[news] rss2json failed for ${feedUrl}: ${res.status}`);
      return [];
    }

    const json = await res.json() as {
      items?: Array<{
        title?: string;
        link?: string;
        description?: string;
        pubDate?: string;
      }>;
    };

    return (json.items ?? []).map(item => ({
      title: item.title ?? "Untitled",
      link: item.link ?? "#",
      description: stripHtml(item.description ?? ""),
      source: new URL(feedUrl).hostname.replace("feeds.", "").replace("rss.", ""),
      pubDate: item.pubDate ?? new Date().toISOString(),
      timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
    }));
  } catch (err) {
    console.warn(`[news] rss2json fetch failed for ${feedUrl}:`, err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const question = request.nextUrl.searchParams.get("question");
  const categoryOverride = request.nextUrl.searchParams.get("category");

  if (!question) {
    return Response.json({ error: "question is required" }, { status: 400 });
  }

  const cacheKey = `news:${question}`;
  const cached = cacheGet<NewsArticle[]>(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  const searchQuery = buildSearchQuery(question);
  const category = categoryOverride || detectCategory(question);
  const rssFeeds = RSS_FEEDS_BY_CATEGORY[category] ?? RSS_FEEDS_BY_CATEGORY.default;
  const questionKeywords = extractKeywords(question, 6).filter(w => w.length > 4);

  const newsdataKey = process.env.NEWSDATA_API_KEY;
  const rssKey = process.env.RSS2JSON_API_KEY;

  // Fetch both sources in parallel
  const [newsdataArticles, ...rssResults] = await Promise.all([
    newsdataKey ? fetchNewsdata(searchQuery, newsdataKey) : Promise.resolve([]),
    ...rssFeeds.map(feed => fetchRss2json(feed, rssKey)),
  ]);

  const rssArticles = rssResults.flat();

  // Filter RSS articles by keyword relevance
  const filteredRss = questionKeywords.length > 0
    ? rssArticles.filter(a => matchesQuestion(a, questionKeywords))
    : rssArticles;

  // Combine
  const allArticles = [...newsdataArticles, ...filteredRss];

  // Deduplicate by title similarity > 60%
  const deduplicated: NewsArticle[] = [];
  for (const article of allArticles) {
    const isDup = deduplicated.some(existing => titleSimilarity(existing.title, article.title) > 0.6);
    if (!isDup) {
      deduplicated.push(article);
    }
  }

  // Sort by publishedAt descending, take max 6
  const result = deduplicated
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  cacheSet(cacheKey, result, CACHE_TTL.NEWS);
  return Response.json(result);
}
