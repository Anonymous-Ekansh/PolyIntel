import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market");

  if (!market) {
    return Response.json({ error: "market is required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    market,
    interval: "1m",
  });

  const url = `https://clob.polymarket.com/prices-history?${params.toString()}`;
  const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, {
    next: { revalidate: 30 },
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
