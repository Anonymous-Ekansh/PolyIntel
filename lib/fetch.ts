// ============================================================
// Resilient fetch helper with timeout and retry
// ============================================================

const DEFAULT_TIMEOUT = 10_000; // 10 seconds
const DEFAULT_RETRIES = 2;
const RETRY_DELAY = 1000;

export async function resilientFetch(
  url: string,
  options?: RequestInit & { retries?: number; timeoutMs?: number }
): Promise<Response> {
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Use codetabs proxy if POLYMARKET_PROXY=true to bypass ISP DNS blocks when running locally
      const useProxy = process.env.POLYMARKET_PROXY === "true";
      const finalUrl = useProxy 
        ? `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` 
        : url;

      const response = await fetch(finalUrl, {
        ...options,
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
