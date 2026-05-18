"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import SettingsModal from "@/components/SettingsModal";
import EVOpportunities from "@/components/panels/EVOpportunities";
import MarketMap from "@/components/panels/MarketMap";
import NewsFeed from "@/components/panels/NewsFeed";
import OrderBook from "@/components/panels/OrderBook";
import Positions from "@/components/panels/Positions";
import ProbabilityChart from "@/components/panels/ProbabilityChart";
import RiskDashboard from "@/components/panels/RiskDashboard";
import SignalTimeline from "@/components/panels/SignalTimeline";
import WhaleTrades from "@/components/panels/WhaleTrades";
import { useMarketStream } from "@/hooks/useMarketStream";
import { useMarkets } from "@/hooks/useMarkets";
import { useRSSFeeds } from "@/hooks/useRSSFeeds";
import { useWhaleTrades } from "@/hooks/useWhaleTrades";
import { useAppStore } from "@/store/useAppStore";

export default function DashboardPage() {
  const initFromStorage = useAppStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useMarkets();
  useRSSFeeds();
  useWhaleTrades();
  useMarketStream();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,170,0,0.08),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-3 py-3 sm:px-4 lg:px-6">
        <Header />

        <main className="mt-4 grid flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-3">
            <EVOpportunities />
          </div>
          <div className="xl:col-span-5">
            <MarketMap />
          </div>
          <div className="xl:col-span-4">
            <NewsFeed />
          </div>

          <div className="xl:col-span-4">
            <ProbabilityChart />
          </div>
          <div className="xl:col-span-4">
            <OrderBook />
          </div>
          <div className="xl:col-span-4">
            <WhaleTrades />
          </div>

          <div className="xl:col-span-4">
            <Positions />
          </div>
          <div className="xl:col-span-4">
            <SignalTimeline />
          </div>
          <div className="xl:col-span-4">
            <RiskDashboard />
          </div>
        </main>
      </div>

      <SettingsModal />
    </div>
  );
}
