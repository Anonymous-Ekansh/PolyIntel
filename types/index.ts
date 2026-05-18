export interface MarketToken {
  token_id: string;
  outcome: string;
  price: number;
}

export interface RawMarket {
  id?: string;
  question?: string;
  conditionId?: string;
  condition_id?: string;
  slug?: string;
  outcomePrices?: string | string[];
  volume24hr?: number | string;
  volume_24h?: number | string;
  liquidity?: string | number;
  endDate?: string;
  end_date?: string;
  outcomes?: string | string[];
  active?: boolean;
  closed?: boolean;
  description?: string;
  category?: string;
  clobTokenIds?: string | string[];
  tokens?: MarketToken[];
}

export interface MarketLocation {
  label: string;
  lat: number;
  lng: number;
}

export interface Market {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  liquidity: number;
  active: boolean;
  endDate: string;
  outcomes: string[];
  description: string;
  category: string;
  tokenIds: string[];
  location?: MarketLocation;
  geopolitical: boolean;
  evScore: number;
  lastPrice?: number;
}

export interface ScoredMarket extends Market {
  volume24hr: number;
  easyWinScore: number;
  volumeScore: number;
  volatilityScore: number;
  mispricingScore: number;
  overallScore: number;
  timeRemaining: string;
  priceChange24h?: number;
}

export interface PricePoint {
  t: number;
  p: number;
}

export interface OrderBookEntry {
  price: string | number;
  size: string | number;
}

export interface OrderBook {
  tokenId?: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  bestBid: number;
  bestAsk: number;
  spread: number;
}

export interface ArticleMatch {
  marketId: string;
  conditionId: string;
  question: string;
  score: number;
}

export interface Article {
  id: string;
  title: string;
  link: string;
  description: string;
  source: string;
  sourceIcon: string;
  sourceColor: string;
  pubDate: string;
  timestamp: number;
  matchedMarkets: ArticleMatch[];
  sentiment: "bullish" | "bearish" | "neutral";
}

export interface Trade {
  id: string;
  market: string;
  asset_id?: string;
  side: "BUY" | "SELL";
  size: string | number;
  price: string | number;
  match_time: string | number;
  outcome: string;
  maker_address: string;
  trader?: string;
  sizeUSDC: number;
  timestamp: number;
}

export interface Position {
  id: string;
  marketId: string;
  marketQuestion: string;
  marketSlug: string;
  tokenId: string;
  side: "YES" | "NO";
  size: number;
  shares: number;
  category: string;
  entryPrice: number;
  createdAt: number;
  closedAt?: number;
  realizedPnl?: number;
}

export interface Alert {
  id: string;
  type: "risk" | "signal" | "portfolio";
  level: "green" | "amber" | "red";
  message: string;
  createdAt: number;
  marketId?: string;
}

export interface RiskLimits {
  maxPortfolioExposure: number;
  maxSingleMarket: number;
  maxCategoryPercent: number;
  dailyLossLimit: number;
}

export interface Settings {
  rss2jsonKey: string;
  newsdataKey: string;
  anthropicKey: string;
  refreshInterval: 30 | 60 | 120;
  whaleThreshold: number;
  riskLimits: RiskLimits;
}

export interface SignalEvent {
  id: string;
  marketId: string;
  type: "news" | "whale" | "price";
  direction: "up" | "down" | "neutral";
  timestamp: number;
  title: string;
  description: string;
  relatedId?: string;
}

export type AppSettings = Settings;
export type FilterType = "all" | "easywin" | "volume" | "volatile" | "mispriced" | "ending";
export type SortType = "score" | "volume" | "ending" | "price_low" | "price_high";
export type TabType = "news" | "chart" | "related" | "orderbook" | "ai";
