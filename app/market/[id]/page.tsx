import MarketResearchPage from "@/components/market/MarketResearchPage";

export default function Page({ params }: { params: { id: string } }) {
  return <MarketResearchPage marketId={params.id} />;
}
