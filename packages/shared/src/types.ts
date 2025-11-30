export type Chain = "algorand" | "ethereum" | "solana" | "stellar";

export interface Opportunity {
  id: string;
  chain: Chain;
  protocol: string;
  pool: string;
  tokens: string[];
  apr: number;
  apy: number;
  apyBase?: number;        // Base APY from trading fees
  apyReward?: number;      // Reward APY from incentives
  rewardToken: string | string[]; // Support multiple reward tokens
  tvlUsd: number;
  risk: "low" | "med" | "high";
  source: "api" | "mock";
  lastUpdated: number;
  disabled?: boolean;

  // Extended metadata for enhanced display
  poolId?: string;         // For DefiLlama chart integration
  underlyingTokens?: string[];
  volume24h?: number;
  fees24h?: number;
  logoUrl?: string;        // Protocol logo from API
  exposure?: string;       // Single asset, stablecoin, etc.
  ilRisk?: string;         // Impermanent loss risk level
  stablecoin?: boolean;    // Whether pool contains stablecoins
}

export interface ProtocolInfo {
  name: string;
  chain: Chain;
  baseUrl: string;
  description?: string;
  website?: string;
  logo?: string;
  supportedTokens?: string[];

  // API-specific configuration
  apiKey?: string;
  rateLimit?: number;      // Requests per minute
  retryAttempts?: number;  // Max retry attempts
  timeout?: number;        // Request timeout in ms
}

export interface Adapter {
  list(): Promise<Opportunity[]>;
  // eslint-disable-next-line no-unused-vars
  detail(id: string): Promise<Opportunity>;
  getProtocolInfo(): ProtocolInfo;
}

// Portfolio and tracking interfaces
export interface UserPosition {
  opportunityId: string;
  amount: number;           // Amount deposited in USD
  depositDate: number;      // Timestamp
  daysHeld: number;
  txHash: string;
  userAddress: string;
}

export interface YieldEstimate {
  opportunityId: string;
  currentValue: number;
  estimatedYield: number;
  totalReturn: number;
  apr: number;
  apy: number;
  daysHeld: number;
}

// Caching interfaces
export interface CacheEntry<T> {
  data: T;
  expiry: number;
  lastFetch: number;
}

export interface AdapterStats {
  totalOpportunities: number;
  bySource: Record<string, number>;
  byProtocol: Record<string, number>;
  totalTvl: number;
  avgApy: number;
  lastUpdate: number;
}

// Risk assessment interfaces
export interface RiskAssessment {
  id: string;
  protocol: string;
  riskScore: number; // 0-100
  score: number; // 0-100 - alias for riskScore
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  level: 'low' | 'medium' | 'high' | 'critical';
  categories: {
    smartContractRisk: number;
    liquidityRisk: number;
    marketRisk: number;
    counterpartyRisk: number;
    operationalRisk: number;
  };
  factors: RiskFactor[];
  recommendations: string[];
  lastUpdated: number;
  timestamp: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface RiskMetrics {
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  valueAtRisk: number;
  beta: number;
  correlation: number;
  liquidityRatio: number;
  marketDepth: number;
  impermanentLossRisk: number;
  smartContractRiskScore: number;
  auditScore: number;
  overallScore: number;
  category: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
}

export interface RiskFactor {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number;
  probability: number;
  mitigation: string;
}
