# POLYINTEL

POLYINTEL is a frontend-only Polymarket intelligence terminal built with Next.js 14 App Router, TypeScript, TailwindCSS, Zustand, React Query, Recharts, lightweight-charts, and react-leaflet.

## What it does

- 9-panel Bloomberg-style dashboard with a dense dark trading layout
- Top EV scanner that selects a global market and fans that selection into the chart, order book, whale feed, and timeline
- Live geopolitical market map with Leaflet and OpenStreetMap
- RSS aggregation across BBC, Al Jazeera, Reuters, Politico, ESPN, and The Guardian with browser-side keyword matching
- Probability chart with news event overlays and optional Anthropic summary generation
- Order book depth view, whale trade monitoring, paper trading, signal timeline, and editable risk limits
- Browser persistence for settings, alerts, signals, and paper positions via `localStorage`

## Browser-only architecture

There is no backend and no database in the active dashboard implementation.

- Market discovery uses Polymarket's Gamma market listing endpoint so the browser can fetch full market metadata reliably.
- Order books, trade history, price history, and live ticks come directly from Polymarket CLOB endpoints and the CLOB WebSocket.
- News is fetched in the browser from `rss2json`.
- Anthropic summaries are optional and only run if an API key is stored in settings.

## Main files

- `app/layout.tsx` sets fonts, dark theme, and providers
- `app/page.tsx` renders the responsive 9-panel dashboard
- `components/Header.tsx` shows portfolio stats, win rate, alert count, and settings
- `components/SettingsModal.tsx` stores API keys, thresholds, refresh cadence, and risk limits
- `components/panels/*` contains the nine dashboard panels
- `hooks/useMarkets.ts`, `hooks/useRSSFeeds.ts`, `hooks/useWhaleTrades.ts`, and `hooks/useMarketStream.ts` drive polling and real-time updates
- `store/useAppStore.ts` is the global Zustand store
- `lib/polymarket.ts`, `lib/rss.ts`, `lib/matching.ts`, `lib/ev.ts`, `lib/portfolio.ts`, and `lib/anthropic.ts` hold data logic

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Settings

The header settings modal persists everything in `localStorage`:

- `RSS2JSON API Key`
- `Anthropic API Key`
- `Refresh interval`
- `Whale threshold`
- `Risk limits`

## Notes

- The optional Anthropic call is intentionally direct-from-browser because this project is frontend-only.
- High-frequency panels keep dedicated polling intervals where the product brief asked for them, even when the general refresh preference changes.
- Paper trading is simulated locally and does not place real trades.
