export interface LlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  ilRisk?: string;
  count?: number;
  poolMeta?: string;
  category?: string;
  borrowingEnabled?: boolean;
  confidenceLevel?: number;
  moonRisk?: string;
  predictable?: boolean;
  change1h?: number;
  change1d?: number;
  change7d?: number;
  tvlUsdTotal?: number;
  apyp7d?: number;
  apyp30d?: number;
  apyBaseInception?: number;
  apyMean30d?: number;
  volatility30d?: number;
  outlier?: boolean;
}

export interface LlamaProtocol {
  name: string;
  slug: string;
  logo: string;
  chains: string[];
  tvl: number;
  description?: string;
}

export interface LlamaChartPoint {
  date: string;
  value: number;
  timestamp: number;
}