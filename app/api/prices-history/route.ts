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

  const res = await fetch(`https://clob.polymarket.com/prices-history?${params.toString()}`, {
    next: { revalidate: 30 },
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
