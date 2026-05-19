import { NextRequest } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { extractKeywords } from "@/lib/keywords";
import { ResearchArticle } from "@/lib/market-helpers";

export const dynamic = "force-dynamic";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(request: NextRequest) {
  const question = request.nextUrl.searchParams.get("question") ?? "";
  const keywords = extractKeywords(question, 4).join(" ");
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keywords)}&hl=en`;
  const xml = await fetch(rssUrl, { next: { revalidate: 300 } }).then((res) => res.text());
  const parsed = parser.parse(xml) as {
    rss?: {
      channel?: {
        item?: Array<Record<string, string>> | Record<string, string>;
      };
    };
  };

  const items = parsed.rss?.channel?.item
    ? Array.isArray(parsed.rss.channel.item)
      ? parsed.rss.channel.item
      : [parsed.rss.channel.item]
    : [];

  const data: ResearchArticle[] = items.map((item, index) => ({
    id: item.guid ?? item.link ?? `google-${index}`,
    title: item.title ?? "Untitled",
    link: item.link ?? "#",
    description: stripHtml(item.description ?? item.title ?? ""),
    source: "Google News",
    pubDate: item.pubDate ?? new Date().toISOString(),
    timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
  }));

  return Response.json(data);
}
