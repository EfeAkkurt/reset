/**
 * Stellar DeFi Insurance SDK
 * A comprehensive TypeScript SDK for interacting with Stellar DeFi Insurance smart contracts
 */

// Main SDK class
export { StellarDeFiInsuranceSDK } from './StellarDeFiInsuranceSDK';

// Contract interfaces
export { SimpleInsurance } from './contracts/SimpleInsurance';
export { YieldAggregator } from './contracts/YieldAggregator';
export { Treasury, TransactionStatus } from './contracts/Treasury';

// Types
export * from './types';

// Utilities
export * from './utils';

// Errors
export * from './errors';

// Re-export commonly used types for convenience
export type {
  NetworkConfig,
  ContractAddress,
  ContractConfig,
  WalletConfig,
  InsurancePolicy,
  ClaimRequest,
  YieldInfo,
  TransactionOptions,
  ContractCallResult,
  SimulationResult,
  UserInfo,
  PolicyStatus,
  RiskLevel,
  ContractType,
  StellarAccount,
  SorobanTransaction
} from './types';

// Export SDK config interfaces
export type {
  SDKConfig,
  SDKContracts
} from './StellarDeFiInsuranceSDK';

// Export contract config interfaces
export type {
  SimpleInsuranceConfig,
  CreatePolicyParams,
  UpdatePolicyParams
} from './contracts/SimpleInsurance';

export type {
  YieldAggregatorConfig,
  DepositParams,
  WithdrawParams,
  PoolInfo
} from './contracts/YieldAggregator';

export type {
  TreasuryConfig,
  CreateTransactionParams,
  TransactionInfo,
  TreasuryBalance
} from './contracts/Treasury';