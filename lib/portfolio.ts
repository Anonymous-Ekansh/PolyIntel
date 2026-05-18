import { Market, Position } from "@/types";

export function getFallbackYesPrice(position: Position) {
  return position.side === "YES" ? position.entryPrice : 1 - position.entryPrice;
}

export function getCurrentYesPrice(
  position: Position,
  livePrices: Record<string, number>,
  market?: Market,
) {
  return (
    livePrices[position.marketId] ??
    livePrices[position.tokenId] ??
    market?.yesPrice ??
    getFallbackYesPrice(position)
  );
}

export function getPositionMetrics(
  position: Position,
  livePrices: Record<string, number>,
  market?: Market,
) {
  const currentYesPrice = getCurrentYesPrice(position, livePrices, market);
  const currentContractPrice =
    position.side === "YES" ? currentYesPrice : 1 - currentYesPrice;
  const currentValue = position.shares * currentContractPrice;
  const pnl = currentValue - position.size;

  return {
    currentYesPrice,
    currentContractPrice,
    currentValue,
    pnl,
    pnlPct: position.size ? (pnl / position.size) * 100 : 0,
  };
}

export function getPortfolioMetrics(
  positions: Position[],
  livePrices: Record<string, number>,
  markets: Market[],
) {
  const marketMap = new Map(markets.map((market) => [market.conditionId, market]));
  const openPositions = positions.filter((position) => !position.closedAt);
  const closedToday = positions.filter((position) => {
    if (!position.closedAt) return false;
    return new Date(position.closedAt).toDateString() === new Date().toDateString();
  });

  const openMetrics = openPositions.map((position) =>
    getPositionMetrics(position, livePrices, marketMap.get(position.marketId)),
  );
  const portfolioValue = openMetrics.reduce((sum, metric) => sum + metric.currentValue, 0);
  const unrealizedPnl = openMetrics.reduce((sum, metric) => sum + metric.pnl, 0);
  const realizedToday = closedToday.reduce(
    (sum, position) => sum + (position.realizedPnl ?? 0),
    0,
  );
  const dailyPnl = unrealizedPnl + realizedToday;

  const settledPositions = positions.filter(
    (position) => position.closedAt && typeof position.realizedPnl === "number",
  );
  const winners = settledPositions.filter((position) => (position.realizedPnl ?? 0) > 0).length;
  const winRate = settledPositions.length ? (winners / settledPositions.length) * 100 : 0;

  return {
    portfolioValue,
    unrealizedPnl,
    realizedToday,
    dailyPnl,
    winRate,
    openPositions,
    settledPositions,
  };
}
