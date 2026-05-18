import { create } from "zustand";
import {
  Alert,
  AppSettings,
  Article,
  FilterType,
  Market,
  OrderBook,
  Position,
  PricePoint,
  ScoredMarket,
  Settings,
  SignalEvent,
  SortType,
  TabType,
  Trade,
} from "@/types";

const SETTINGS_STORAGE_KEY = "polyintel-settings";
const POSITIONS_STORAGE_KEY = "polyintel-paper-positions";
const ALERTS_STORAGE_KEY = "polyintel-alerts";
const SIGNALS_STORAGE_KEY = "polyintel-signals";

const DEFAULT_SETTINGS: Settings = {
  rss2jsonKey: "",
  newsdataKey: "",
  anthropicKey: "",
  refreshInterval: 30,
  whaleThreshold: 5000,
  riskLimits: {
    maxPortfolioExposure: 10000,
    maxSingleMarket: 500,
    maxCategoryPercent: 30,
    dailyLossLimit: 300,
  },
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function loadSettings(): Settings {
  if (!canUseStorage()) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...safeParse<Partial<Settings>>(
      window.localStorage.getItem(SETTINGS_STORAGE_KEY),
      {},
    ),
    riskLimits: {
      ...DEFAULT_SETTINGS.riskLimits,
      ...safeParse<Partial<Settings>>(
        window.localStorage.getItem(SETTINGS_STORAGE_KEY),
        {},
      ).riskLimits,
    },
  };
}

function loadPositions(): Position[] {
  if (!canUseStorage()) return [];
  return safeParse<Position[]>(window.localStorage.getItem(POSITIONS_STORAGE_KEY), []);
}

function loadAlerts(): Alert[] {
  if (!canUseStorage()) return [];
  return safeParse<Alert[]>(window.localStorage.getItem(ALERTS_STORAGE_KEY), []);
}

function loadSignals(): SignalEvent[] {
  if (!canUseStorage()) return [];
  return safeParse<SignalEvent[]>(window.localStorage.getItem(SIGNALS_STORAGE_KEY), []);
}

function persistSettings(settings: Settings) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function persistPositions(positions: Position[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
}

function persistAlerts(alerts: Alert[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts.slice(0, 50)));
}

function persistSignals(signals: SignalEvent[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(signals.slice(0, 300)));
}

function withScoredShape(markets: Market[]): ScoredMarket[] {
  return markets.map((market) => ({
    ...market,
    volume24hr: market.volume24h,
    easyWinScore: (1 - Math.abs(market.yesPrice - 0.5) * 2) * 100,
    volumeScore: Math.min(Math.log10(market.volume24h + 1) * 18, 100),
    volatilityScore: 0,
    mispricingScore: 0,
    overallScore: market.evScore,
    timeRemaining: market.endDate,
    priceChange24h: 0,
  }));
}

function buildPositionAlert(message: string, level: Alert["level"], marketId?: string): Alert {
  return {
    id: `${level}-${marketId ?? "global"}-${Date.now()}`,
    type: "portfolio",
    level,
    message,
    createdAt: Date.now(),
    marketId,
  };
}

export interface AppState {
  selectedMarket: ScoredMarket | null;
  markets: ScoredMarket[];
  newsArticles: Article[];
  whaleTrades: Trade[];
  paperPositions: Position[];
  alerts: Alert[];
  settings: Settings;
  signalEvents: SignalEvent[];
  livePrices: Record<string, number>;
  priceHistory: Record<string, PricePoint[]>;
  orderbooks: Record<string, OrderBook>;
  trades: Record<string, Trade[]>;
  news: Record<string, Article[]>;
  isSettingsOpen: boolean;

  // Legacy compatibility state
  activeFilter: FilterType;
  sortBy: SortType;
  searchQuery: string;
  isLoadingMarkets: boolean;
  view: "scanner" | "deepdive";
  activeTab: TabType;

  setSelectedMarket: (market: Market) => void;
  setMarkets: (markets: Market[]) => void;
  setNewsArticles: (articles: Article[]) => void;
  setWhaleTrades: (trades: Trade[]) => void;
  setPaperPositions: (positions: Position[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setLivePrice: (key: string, price: number) => void;
  setPriceHistory: (marketId: string, history: PricePoint[]) => void;
  setOrderbook: (marketId: string, book: OrderBook) => void;
  setTrades: (marketId: string, trades: Trade[]) => void;
  setNews: (marketId: string, articles: Article[]) => void;
  addPosition: (position: Position) => void;
  closePosition: (id: string) => void;
  resetPaperPortfolio: () => void;
  recordSignal: (signal: SignalEvent) => void;
  upsertAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  initFromStorage: () => void;

  // Legacy compatibility actions
  setActiveFilter: (filter: FilterType) => void;
  setSortBy: (sortBy: SortType) => void;
  setSearchQuery: (query: string) => void;
  setIsLoadingMarkets: (isLoading: boolean) => void;
  selectMarket: (market: ScoredMarket) => void;
  goBack: () => void;
  setActiveTab: (tab: TabType) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedMarket: null,
  markets: [],
  newsArticles: [],
  whaleTrades: [],
  paperPositions: [],
  alerts: [],
  settings: DEFAULT_SETTINGS,
  signalEvents: [],
  livePrices: {},
  priceHistory: {},
  orderbooks: {},
  trades: {},
  news: {},
  isSettingsOpen: false,

  activeFilter: "all",
  sortBy: "score",
  searchQuery: "",
  isLoadingMarkets: false,
  view: "scanner",
  activeTab: "chart",

  setSelectedMarket: (market) =>
    set((state) => {
      const scoredMarket = withScoredShape([market])[0];
      return {
        selectedMarket: scoredMarket,
        view: state.view,
      };
    }),

  setMarkets: (markets) =>
    set((state) => {
      const scoredMarkets = withScoredShape(markets).sort((a, b) => b.evScore - a.evScore);
      const selectedMarket =
        state.selectedMarket &&
        scoredMarkets.find((market) => market.conditionId === state.selectedMarket?.conditionId);

      return {
        markets: scoredMarkets,
        selectedMarket: selectedMarket ?? state.selectedMarket ?? scoredMarkets[0] ?? null,
      };
    }),

  setNewsArticles: (articles) => set({ newsArticles: articles }),
  setWhaleTrades: (whaleTrades) => set({ whaleTrades }),
  setPaperPositions: (paperPositions) => {
    persistPositions(paperPositions);
    set({ paperPositions });
  },
  setAlerts: (alerts) => {
    persistAlerts(alerts);
    set({ alerts });
  },
  setSettings: (nextSettings) =>
    set((state) => {
      const settings = {
        ...state.settings,
        ...nextSettings,
        riskLimits: {
          ...state.settings.riskLimits,
          ...nextSettings.riskLimits,
        },
      };
      persistSettings(settings);
      return { settings };
    }),
  setLivePrice: (key, price) =>
    set((state) => ({
      livePrices: { ...state.livePrices, [key]: price },
    })),
  setPriceHistory: (marketId, history) =>
    set((state) => ({
      priceHistory: { ...state.priceHistory, [marketId]: history },
    })),
  setOrderbook: (marketId, book) =>
    set((state) => ({
      orderbooks: { ...state.orderbooks, [marketId]: book },
    })),
  setTrades: (marketId, trades) =>
    set((state) => ({
      trades: { ...state.trades, [marketId]: trades },
    })),
  setNews: (marketId, articles) =>
    set((state) => ({
      news: { ...state.news, [marketId]: articles },
    })),
  addPosition: (position) =>
    set((state) => {
      const paperPositions = [position, ...state.paperPositions];
      persistPositions(paperPositions);
      return { paperPositions };
    }),
  closePosition: (id) =>
    set((state) => {
      const paperPositions = state.paperPositions.map((position) => {
        if (position.id !== id || position.closedAt) return position;

        const currentYesPrice =
          state.livePrices[position.marketId] ??
          state.livePrices[position.tokenId] ??
          position.entryPrice;
        const currentContractPrice =
          position.side === "YES" ? currentYesPrice : 1 - currentYesPrice;
        const currentValue = position.shares * currentContractPrice;
        const realizedPnl = Number((currentValue - position.size).toFixed(2));

        return {
          ...position,
          closedAt: Date.now(),
          realizedPnl,
        };
      });

      persistPositions(paperPositions);
      return { paperPositions };
    }),
  resetPaperPortfolio: () => {
    const alerts = [buildPositionAlert("Paper portfolio reset.", "amber")];
    persistPositions([]);
    persistAlerts(alerts);
    set({
      paperPositions: [],
      alerts,
    });
  },
  recordSignal: (signal) =>
    set((state) => {
      const exists = state.signalEvents.some(
        (item) => item.type === signal.type && item.marketId === signal.marketId && item.relatedId === signal.relatedId,
      );
      if (exists) return state;

      const signalEvents = [signal, ...state.signalEvents].slice(0, 300);
      persistSignals(signalEvents);
      return { signalEvents };
    }),
  upsertAlert: (alert) =>
    set((state) => {
      const alerts = [
        alert,
        ...state.alerts.filter(
          (item) => !(item.message === alert.message && item.marketId === alert.marketId),
        ),
      ].slice(0, 25);
      persistAlerts(alerts);
      return { alerts };
    }),
  dismissAlert: (id) =>
    set((state) => {
      const alerts = state.alerts.filter((alert) => alert.id !== id);
      persistAlerts(alerts);
      return { alerts };
    }),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  initFromStorage: () =>
    set({
      settings: loadSettings(),
      paperPositions: loadPositions(),
      alerts: loadAlerts(),
      signalEvents: loadSignals(),
    }),

  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsLoadingMarkets: (isLoadingMarkets) => set({ isLoadingMarkets }),
  selectMarket: (market) => set({ selectedMarket: market, view: "deepdive" }),
  goBack: () => set({ view: "scanner" }),
  setActiveTab: (activeTab) => set({ activeTab }),
  updateSettings: (settings) => get().setSettings(settings),
}));
