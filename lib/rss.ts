import { Article, Market } from "@/types";
import { inferArticleSentiment, matchArticleToMarkets } from "@/lib/matching";

export const RSS_FEEDS = [
  {
    source: "BBC World",
    icon: "BBC",
    color: "#00ff88",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
  },
  {
    source: "Al Jazeera",
    icon: "AJ",
    color: "#ffaa00",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
  },
  {
    source: "Reuters",
    icon: "RTR",
    color: "#ff4444",
    url: "https://rsshub.app/reuters/world",
  },
  {
    source: "Politico",
    icon: "POL",
    color: "#8bdcff",
    url: "https://rss.politico.com/politics-news.xml",
  },
  {
    source: "ESPN",
    icon: "ESPN",
    color: "#ff7a7a",
    url: "https://www.espn.com/espn/rss/news",
  },
  {
    source: "Guardian",
    icon: "GDN",
    color: "#b9ff66",
    url: "https://www.theguardian.com/world/rss",
  },
];

interface Rss2JsonResponse {
  status?: string;
  items?: Array<{
    guid?: string;
    title?: string;
    link?: string;
    description?: string;
    pubDate?: string;
  }>;
}

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildFeedUrl(feedUrl: string, apiKey?: string) {
  const base = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=20`;
  return apiKey ? `${base}&api_key=${encodeURIComponent(apiKey)}` : base;
}

export async function fetchRSSArticles(markets: Market[], apiKey?: string) {
  const settled = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const response = await fetch(buildFeedUrl(feed.url, apiKey), { cache: "no-store" });
      if (!response.ok) throw new Error(`RSS fetch failed for ${feed.source}`);
      const json = (await response.json()) as Rss2JsonResponse;
      const items = json.items ?? [];

      return items.map((item, index) => {
        const title = item.title?.trim() ?? "Untitled";
        const description = stripHtml(item.description ?? "");
        const articleText = `${title} ${description}`;

        return {
          id: item.guid ?? `${feed.source}-${index}-${title}`,
          title,
          link: item.link ?? "#",
          description,
          source: feed.source,
          sourceIcon: feed.icon,
          sourceColor: feed.color,
          pubDate: item.pubDate ?? new Date().toISOString(),
          timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
          matchedMarkets: matchArticleToMarkets(articleText, markets),
          sentiment: inferArticleSentiment(articleText),
        } as Article;
      });
    }),
  );

  const deduped = new Map<string, Article>();
  settled.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((article) => {
      const key = article.title.toLowerCase();
      if (!deduped.has(key)) deduped.set(key, article);
    });
  });

  return Array.from(deduped.values())
    .filter((article) => article.matchedMarkets.length > 0)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);
}
