export const dynamic = "force-dynamic";

export async function GET() {
  const res = await fetch(
    "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=200",
    { next: { revalidate: 60 } },
  );
  const data = await res.json();
  return Response.json(data);
}
