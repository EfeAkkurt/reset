/**
 * Core types for the Stellar DeFi Insurance SDK
 */

export interface NetworkConfig {
  network: 'mainnet' | 'testnet' | 'futurenet' | 'standalone';
  sorobanRpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
}

export interface ContractAddress {
  contractId: string;
  address: string;
}

export interface UserInfo {
  address: string;
  publicKey?: string;
}

export interface InsurancePolicy {
  id: string;
  holder: string;
  coverageAmount: bigint;
  premium: bigint;
  startDate: bigint;
  endDate: bigint;
  status: PolicyStatus;
  riskLevel: RiskLevel;
}

export interface ClaimRequest {
  policyId: string;
  claimant: string;
  amount: bigint;
  reason: string;
  evidence?: string[];
  timestamp: bigint;
}

export interface YieldInfo {
  poolAddress: string;
  totalLiquidity: bigint;
  apy: number;
  userShare?: bigint;
  earnedRewards?: bigint;
}

export interface TransactionOptions {
  timeout?: number;
  fee?: number;
  simulate?: boolean;
  skipMemo?: boolean;
}

export interface ContractCallResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  transactionHash?: string;
  gasUsed?: bigint;
}

export interface SimulationResult {
  success: boolean;
  result?: any;
  error?: string;
  estimatedGas?: bigint;
  events?: any[];
  authRequired?: boolean;
}

export enum PolicyStatus {
  Active = 'ACTIVE',
  Expired = 'EXPIRED',
  Claimed = 'CLAIMED',
  Cancelled = 'CANCELLED'
}

export enum RiskLevel {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH'
}

export enum ContractType {
  SimpleInsurance = 'simple_insurance',
  YieldAggregator = 'yield_aggregator',
  Treasury = 'treasury'
}

export interface ContractConfig {
  type: ContractType;
  address: ContractAddress;
  wasmHash?: string;
  deployedAt?: bigint;
}

export interface WalletConfig {
  secretKey?: string;
  publicKey?: string;
  signTransaction?: (transaction: any) => Promise<any>;
}

// Stellar-specific types
export interface StellarAccount {
  accountId: string;
  balance: string;
  sequence: string;
}

export interface SorobanTransaction {
  operations: any[];
  source: string;
  fee: string;
  sequence?: string;
  memo?: string;
  timeBounds?: {
    minTime?: string;
    maxTime?: string;
  };
}