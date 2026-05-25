const axios = require("axios");
const cacheService = require("./cache");
require("dotenv").config();

const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || "";
const RSS2JSON_API_KEY = process.env.RSS2JSON_API_KEY || "";

const STOPWORDS = new Set([
  "will", "does", "the", "a", "an", "in", "on", "at", "to", "for", "of",
  "be", "by", "is", "are", "was", "were", "has", "have", "that", "this",
  "with", "would", "could", "should", "who", "what", "when", "where",
  "how", "win", "get", "make"
]);

function extractKeywords(question) {
  if (!question) return "";
  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  return words.slice(0, 3).join(" ");
}

async function fetchNewsDataIO(query) {
  if (!NEWSDATA_API_KEY || !query) return [];

  const cacheKey = `newsdata:${query}`;
  return cacheService.getOrFetch(cacheKey, cacheService.TTL.NEWS, async () => {
    try {
      const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(query)}&language=en&size=5`;
      const response = await axios.get(url, { timeout: 8000 });
      const results = response.data?.results ?? [];
      
      return results.map((item) => ({
        title: item.title ?? "Untitled Article",
        link: item.link ?? "#",
        description: item.description ?? "",
        source: item.source_id ?? "unknown",
        pubDate: item.pubDate ?? new Date().toISOString(),
        publishedAt: new Date(item.pubDate ?? Date.now()).getTime(),
      }));
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn("[newsAggregator] newsdata.io rate limit (429)");
      } else {
        console.error(`[newsAggregator] newsdata.io failed: ${error.message}`);
      }
      return [];
    }
  });
}

async function fetchRSS(category, questionKeywords = []) {
  const feeds = {
    politics: "https://feeds.bbci.co.uk/news/politics/rss.xml",
    crypto: "https://cointelegraph.com/rss",
    sports: "https://feeds.bbci.co.uk/sport/rss.xml",
    economics: "https://feeds.ft.com/rss/home/uk",
    science: "https://www.sciencedaily.com/rss/all.xml",
    default: "https://feeds.bbci.co.uk/news/world/rss.xml",
  };

  const cat = String(category).toLowerCase();
  const feedUrl = feeds[cat] || feeds.default;
  const cacheKey = `rss:${feedUrl}`;

  return cacheService.getOrFetch(cacheKey, cacheService.TTL.NEWS, async () => {
    try {
      let url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=8`;
      if (RSS2JSON_API_KEY) {
        url += `&api_key=${encodeURIComponent(RSS2JSON_API_KEY)}`;
      }
      
      const response = await axios.get(url, { timeout: 8000 });
      const items = response.data?.items ?? [];

      const parsedItems = items.map((item) => ({
        title: item.title ?? "Untitled RSS Feed Item",
        link: item.link ?? "#",
        description: item.description ?? "",
        source: new URL(feedUrl).hostname.replace("www.", "").replace("feeds.", ""),
        pubDate: item.pubDate ?? new Date().toISOString(),
        publishedAt: new Date(item.pubDate ?? Date.now()).getTime(),
      }));

      // Filter: only articles where title contains at least one keyword from market question
      if (questionKeywords.length > 0) {
        return parsedItems.filter((article) => {
          const titleLower = article.title.toLowerCase();
          return questionKeywords.some((keyword) => titleLower.includes(keyword.toLowerCase()));
        });
      }

      return parsedItems;
    } catch (error) {
      console.error(`[newsAggregator] rss2json failed for ${feedUrl}: ${error.message}`);
      return [];
    }
  });
}

function assignTrustScore(article) {
  const source = String(article.source || "").toLowerCase();
  const title = String(article.title || "").toLowerCase();
  const fullText = `${source} ${title}`;

  if (
    fullText.includes("bbc") ||
    fullText.includes("reuters") ||
    fullText.includes("ap news") ||
    fullText.includes("bloomberg") ||
    fullText.includes("ft.com") ||
    fullText.includes("financial times")
  ) {
    return 0.9;
  }
  
  if (fullText.includes("cointelegraph") || fullText.includes("decrypt")) {
    return 0.75;
  }
  
  return 0.5;
}

function shareThreeWords(title1, title2) {
  const getWords = (t) => new Set(t.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const w1 = getWords(title1);
  const w2 = getWords(title2);
  let match = 0;
  for (const w of w1) {
    if (w2.has(w)) match++;
  }
  return match >= 3;
}

async function getNews(question, category) {
  const query = extractKeywords(question);
  const questionKeywords = query ? query.split(" ") : [];

  const [newsdataList, rssList] = await Promise.all([
    fetchNewsDataIO(query),
    fetchRSS(category, questionKeywords),
  ]);

  const combined = [...newsdataList, ...rssList];

  // Deduplicate
  const deduplicated = [];
  for (const article of combined) {
    let isDup = false;
    for (const existing of deduplicated) {
      if (shareThreeWords(article.title, existing.title)) {
        isDup = true;
        // Keep the newer article
        if (article.publishedAt > existing.publishedAt) {
          existing.title = article.title;
          existing.link = article.link;
          existing.description = article.description;
          existing.source = article.source;
          existing.pubDate = article.pubDate;
          existing.publishedAt = article.publishedAt;
        }
        break;
      }
    }
    if (!isDup) {
      deduplicated.push(article);
    }
  }

  // Assign Trust Scores & Sort
  const withScores = deduplicated.map((art) => ({
    ...art,
    trustScore: assignTrustScore(art),
  }));

  withScores.sort((a, b) => b.publishedAt - a.publishedAt);
  return withScores.slice(0, 6);
}

module.exports = {
  extractKeywords,
  getNews,
};
