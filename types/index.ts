export interface Opportunity {
  id: string;
  chain: string;
  protocol: string;
  pool: string;
  tokens: string[];
  apr: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  rewardToken?: string[];
  tvlUsd: number;
  risk: 'low' | 'medium' | 'high';
  source: string;
  lastUpdated: number;
  disabled: boolean;

  // Extended metadata
  poolId?: string;
  underlyingTokens?: string[];
  logoUrl?: string;
  exposure?: string;
  ilRisk?: string;
  stablecoin?: boolean;
}

export interface ProtocolInfo {
  name: string;
  chain: string;
  baseUrl: string;
  description: string;
  website: string;
  logo: string;
  supportedTokens: string[];
  timeout?: number;
  retryAttempts?: number;
  rateLimit?: number;
}