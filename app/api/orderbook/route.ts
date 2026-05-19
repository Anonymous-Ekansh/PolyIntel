import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tokenId = request.nextUrl.searchParams.get("token_id");

  if (!tokenId) {
    return Response.json({ error: "token_id is required" }, { status: 400 });
  }

  const res = await fetch(`https://clob.polymarket.com/book?token_id=${encodeURIComponent(tokenId)}`, {
    next: { revalidate: 5 },
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
