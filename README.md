# POLYINTEL | Polymarket Decision Intelligence Platform

POLYINTEL is a professional-grade prediction market intelligence dashboard and terminal designed to analyze, score, and monitor live Polymarket contracts. The system features a deterministic multi-factor scoring engine (Smart Bet Advisor), real-time anomaly detection, cross-market correlation analysis, automatic news matching with sentiment tracking, and a simulated paper-trading portfolio with risk controls.

The platform is designed to bypass geographic ISP/CORS blocks (such as those active in India) by utilizing server-side proxy routes and a robust node caching layer.

---

## 🛠️ Tech Stack

### Frontend & Proxy Layer (Next.js)
* **Core Framework**: Next.js 14 (App Router)
* **Language**: TypeScript (fully typed interfaces for markets, order books, trades, and portfolios)
* **State Management**: Zustand (for settings, paper-trading positions, alerts, and live price/signal streams)
* **Data Fetching**: React Query (TanStack Query v5) for query caching, retries, and background refetching
* **Styling**: TailwindCSS with CSS custom properties for a premium dark financial terminal aesthetic
* **Charts**: `lightweight-charts` (by TradingView) for fast interactive price history and `recharts` for volume/probability distributions
* **RSS/XML Parsing**: `fast-xml-parser` for parsing Google News feeds server-side

### Analytical Backend (Express)
* **Core Framework**: Express.js
* **Services & Background Workers**:
  * **Anomaly Detector**: Background loop executing every 2 minutes to identify unusual trading volume spikes, price jumps, block imbalances, or massive whale trades.
  * **Correlation Engine**: Computes statistical correlations and divergence indicators across related markets.
  * **Scoring Engine**: Evaluates prediction contracts against historical variance, volume growth, and order book depth.
* **Cache**: `node-cache` (in-memory) for high-performance retrieval and API rate-limit conservation.

---

## 🏗️ Architecture & Data Flow

POLYINTEL separates concern between real-time browser rendering, secure API proxying, and background analysis:

```
                  ┌──────────────────────────────────────────┐
                  │              Web Browser                 │
                  └─────┬──────────────────────────────▲─────┘
                        │                              │
          Client REST   │                              │ WS Live Price Stream
          & User State  │                              │ (Trades & Book updates)
                        ▼                              │
             ┌────────────────────┐          ┌─────────┴──────────┐
             │ Next.js App Router │          │  Polymarket CLOB   │
             │   (Frontend App)   │          │   WebSocket API    │
             └──────────┬─────────┘          └────────────────────┘
                        │
                        │ Proxied API Routes (bypasses CORS & Geoblocks)
                        ▼
             ┌────────────────────┐
             │ Next.js API Routes │ ──► Proxy requests (Gamma / CLOB APIs)
             └──────────┬─────────┘
                        │
                        │ REST Calls (Settings, Signals, Scoring)
                        ▼
             ┌────────────────────┐
             │  Express Backend   │ ──► Background Workers (Anomaly & Correlation)
             │   (Port 5001)      │ ──► Local In-Memory Cache
             └────────────────────┘
```

### Server-Side Proxy Routes
1. **`/api/markets`**: Aggregated endpoint pulling active, undeclared contracts from the Gamma API.
2. **`/api/market/[conditionId]`**: Fetches detailed metadata for a specific market contract.
3. **`/api/prices-history`**: Pulls historical price data for charting from the CLOB API.
4. **`/api/orderbook`**: Pulls active bids/asks for spread and depth analysis from the CLOB API.
5. **`/api/news/combined`**: Merges NewsData.io API search results with localized RSS feeds, automatically filtering articles based on keyword overlap metrics.
6. **`/api/advisor`**: Executes the deterministic smart scoring algorithm utilizing recent trade history and price delta.

---

## 📈 Core Use Cases

### 1. Live Prediction Market Terminal
A searchable, category-filtered multi-panel dashboard providing instant access to live Polymarket prediction pools. Users can sort by volume, expected value (EV) score, or resolution date.

### 2. Smart Bet Advisor (Deterministic Scoring Engine)
A proprietary rule-based model that generates buy/sell/skip recommendations (`LEAN_YES`, `LEAN_NO`, `SKIP`) with a `LOW`/`MEDIUM`/`HIGH` confidence rating. Scoring is weighted across four distinct dimensions:
* **Momentum (30%)**: Analyzes YES price direction and velocity over a 7-day period.
* **Volume Trend (25%)**: Compares current 24-hour volume against the 7-day average to identify smart money flows.
* **Order Flow (25%)**: Measures buy/sell pressure ratios from the last 50 trades.
* **Time Value (20%)**: Factors in days remaining relative to price certainty to evaluate thesis viability.

### 3. Live Anomaly Feed
A real-time monitoring feed displaying signals captured by background scanner daemons:
* **VOLUME_SPIKE**: Sudden spikes in volume relative to the rolling average.
* **PRICE_JUMP**: Quick price jumps/drops (>3% in under 5 minutes).
* **WHALE_TRADE**: Large transaction size detection (customizable USDC threshold).
* **LIQUIDITY_DROP**: Rapid removal of bids/asks from the order book.
* **BOOK_IMBALANCE**: High bid-to-ask volume ratios signaling imminent direction shift.

### 4. News & Sentiment Aggregator
Binds prediction questions to global RSS feeds (BBC, Reuters, Al Jazeera, Politico, Guardian) and search databases (Google News, NewsData.io). Evaluates headlines with custom sentiment weights (`bullish`, `bearish`, `neutral`) to alert traders of sudden public narrative shifts.

### 5. Mock Portfolio & Risk Management
Enables risk-free paper trading directly within the terminal interface:
* Instant order submission (YES/NO) with realistic slippage.
* Dynamic PnL calculation tracking live price feeds.
* Absolute portfolio risk rules, allowing traders to enforce maximum exposure, single-market concentration, and daily loss limits.

---

## 🚀 Setting Up & Running Locally

### Prerequisites
* Node.js (v18 or higher)
* NPM or Yarn

### Step 1: Install Dependencies
Install dependencies for both the frontend (Next.js) and the backend (Express):
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Environment Variables
Create a `.env.local` file in the root directory:
```bash
# API Keys for News Integration (Optional but recommended)
RSS2JSON_KEY=your_rss2json_api_key
NEWSDATA_KEY=your_newsdata_api_key

# Set proxy helper to bypass geo-blocks when running from restricted regions (e.g., India)
POLYMARKET_PROXY=true
```

Create a `.env` file inside the `backend` directory:
```bash
PORT=5001
NEWSDATA_API_KEY=your_newsdata_api_key
RSS2JSON_API_KEY=your_rss2json_api_key
```

### Step 3: Run the Servers
Open two terminal windows to run both servers concurrently:

**Terminal 1: Next.js Frontend App**
```bash
npm run dev
```
*(Runs on `http://localhost:3000` or the next available port)*

**Terminal 2: Express Analytics Backend**
```bash
cd backend
npm run dev
```
*(Runs on `http://localhost:5001` with background anomaly/correlation jobs active)*
