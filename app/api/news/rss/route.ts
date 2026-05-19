import { NextRequest } from "next/server";
import { extractKeywords } from "@/lib/keywords";
import { ResearchArticle } from "@/lib/market-helpers";

export const dynamic = "force-dynamic";

const FEEDS = [
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://www.aljazeera.com/xml/rss/all.xml",
  "https://www.theguardian.com/world/rss",
  "https://rss.politico.com/politics-news.xml",
  "https://rsshub.app/reuters/world",
];

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getSourceName(feedUrl: string) {
  if (feedUrl.includes("bbc")) return "BBC";
  if (feedUrl.includes("aljazeera")) return "Al Jazeera";
  if (feedUrl.includes("guardian")) return "The Guardian";
  if (feedUrl.includes("politico")) return "Politico";
  if (feedUrl.includes("reuters")) return "Reuters";
  return "RSS";
}

export async function GET(request: NextRequest) {
  const question = request.nextUrl.searchParams.get("question") ?? "";
  const marketKeywords = new Set(extractKeywords(question, 8));
  const key = process.env.RSS2JSON_KEY;

  if (!key) {
    return Response.json([]);
  }

  const results = await Promise.all(
    FEEDS.map((url) =>
      fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&api_key=${key}&count=20`,
        { next: { revalidate: 300 } },
      ).then((res) => res.json()),
    ),
  );

  const allArticles = results.flatMap((result, feedIndex) =>
    (result.items ?? []).map((item: Record<string, string>, itemIndex: number) => ({
      id: item.guid ?? item.link ?? `rss-${feedIndex}-${itemIndex}`,
      title: item.title ?? "Untitled",
      link: item.link ?? "#",
      description: stripHtml(item.description ?? item.title ?? ""),
      source: getSourceName(FEEDS[feedIndex]),
      pubDate: item.pubDate ?? new Date().toISOString(),
      timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
    })),
  ) as ResearchArticle[];

  const filtered = allArticles.filter((article) => {
    const headlineWords = new Set(extractKeywords(article.title, 8));
    return Array.from(headlineWords).some((word) => marketKeywords.has(word));
  });

  return Response.json(filtered);
}
