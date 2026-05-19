import { NextRequest } from "next/server";
import { extractKeywords } from "@/lib/keywords";
import { ResearchArticle } from "@/lib/market-helpers";

export const dynamic = "force-dynamic";

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(request: NextRequest) {
  const question = request.nextUrl.searchParams.get("question") ?? "";
  const keywords = extractKeywords(question, 4).join(" ");
  const key = process.env.NEWSDATA_KEY;

  if (!key) {
    return Response.json([]);
  }

  const res = await fetch(
    `https://newsdata.io/api/1/news?apikey=${key}&q=${encodeURIComponent(keywords)}&language=en`,
    { next: { revalidate: 300 } },
  );

  if (!res.ok) {
    return Response.json([]);
  }

  const payload = (await res.json()) as {
    results?: Array<Record<string, string>>;
  };

  const articles: ResearchArticle[] = (payload.results ?? []).map((item, index) => ({
    id: item.article_id ?? item.link ?? `newsdata-${index}`,
    title: item.title ?? "Untitled",
    link: item.link ?? "#",
    description: stripHtml(item.description ?? item.content ?? item.title ?? ""),
    source: item.source_id ?? "NewsData",
    pubDate: item.pubDate ?? item.pubDate ?? new Date().toISOString(),
    timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
  }));

  return Response.json(articles);
}
