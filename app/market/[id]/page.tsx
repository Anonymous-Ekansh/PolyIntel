import MarketResearchPage from "@/components/market/MarketResearchPage";

interface PageProps {
  params: {
    id: string;
  };
}

export default function MarketDetailPage({ params }: PageProps) {
  return <MarketResearchPage marketId={params.id} />;
}
