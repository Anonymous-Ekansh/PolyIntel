# POLYINTEL

POLYINTEL now does exactly two things:

1. The home screen shows a searchable grid of live Polymarket bets.
2. Clicking a card opens a full research page for that specific bet.

## Stack

- Next.js 14 App Router
- TypeScript
- TailwindCSS
- React Query
- lightweight-charts
- fast-xml-parser

## Data flow

- `app/api/markets/route.ts` proxies Gamma markets for the home grid
- `app/api/news/google/route.ts` parses Google News RSS server-side
- `app/api/news/rss/route.ts` queries `rss2json` server-side with `RSS2JSON_KEY`
- `app/api/news/newsdata/route.ts` queries NewsData server-side with `NEWSDATA_KEY`
- `app/api/prices-history/route.ts` proxies Polymarket price history
- `app/api/orderbook/route.ts` proxies Polymarket order book

The home screen fetches from `/api/markets`, not directly from Polymarket, so the browser does not hit CORS issues.

## Environment variables

Create `.env.local` with:

```bash
RSS2JSON_KEY=your_key
NEWSDATA_KEY=your_key
```

The home screen does not require any configuration to load live Polymarket bets. The news tabs use the server-side keys when available.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main routes

- `/` home card grid
- `/market/[id]` research page with `NEWS`, `PRICE CHART`, `RELATED BETS`, and `ORDER BOOK`
