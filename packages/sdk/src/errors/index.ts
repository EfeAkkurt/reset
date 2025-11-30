/**
 * Custom error classes for the Stellar DeFi Insurance SDK
 */

export class StellarDeFiInsuranceError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'StellarDeFiInsuranceError';
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends StellarDeFiInsuranceError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ContractError extends StellarDeFiInsuranceError {
  constructor(message: string, details?: any) {
    super(message, 'CONTRACT_ERROR', details);
    this.name = 'ContractError';
  }
}

export class TransactionError extends StellarDeFiInsuranceError {
  public readonly transactionHash?: string;

  constructor(message: string, transactionHash?: string, details?: any) {
    super(message, 'TRANSACTION_ERROR', details);
    this.name = 'TransactionError';
    this.transactionHash = transactionHash;
  }
}

export class ValidationError extends StellarDeFiInsuranceError {
  constructor(message: string, field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    if (field) {
      this.details = { ...details, field };
    }
  }
}

export class InsufficientBalanceError extends StellarDeFiInsuranceError {
  constructor(required: bigint, available: bigint, details?: any) {
    super(
      `Insufficient balance: required ${required.toString()}, available ${available.toString()}`,
      'INSUFFICIENT_BALANCE',
      { required, available, ...details }
    );
    this.name = 'InsufficientBalanceError';
  }
}

export class PolicyError extends StellarDeFiInsuranceError {
  constructor(message: string, policyId?: string, details?: any) {
    super(message, 'POLICY_ERROR', { policyId, ...details });
    this.name = 'PolicyError';
  }
}

export class AuthenticationError extends StellarDeFiInsuranceError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class TimeoutError extends StellarDeFiInsuranceError {
  constructor(timeout: number, details?: any) {
    super(`Operation timed out after ${timeout}ms`, 'TIMEOUT_ERROR', { timeout, ...details });
    this.name = 'TimeoutError';
  }
}

export class ConfigurationError extends StellarDeFiInsuranceError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

// Error codes for better error handling
export enum ErrorCode {
  // Network errors
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  RPC_TIMEOUT = 'RPC_TIMEOUT',
  INVALID_NETWORK_CONFIG = 'INVALID_NETWORK_CONFIG',

  // Contract errors
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  CONTRACT_EXECUTION_FAILED = 'CONTRACT_EXECUTION_FAILED',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',

  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  INVALID_SEQUENCE = 'INVALID_SEQUENCE',

  // Validation errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_POLICY_ID = 'INVALID_POLICY_ID',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Policy errors
  POLICY_NOT_FOUND = 'POLICY_NOT_FOUND',
  POLICY_EXPIRED = 'POLICY_EXPIRED',
  POLICY_ALREADY_CLAIMED = 'POLICY_ALREADY_CLAIMED',
  INSUFFICIENT_COVERAGE = 'INSUFFICIENT_COVERAGE',

  // Authentication errors
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',

  // Other errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export function isStellarDeFiInsuranceError(error: any): error is StellarDeFiInsuranceError {
  return error instanceof StellarDeFiInsuranceError;
}

export function getErrorCode(error: any): string {
  if (isStellarDeFiInsuranceError(error)) {
    return error.code;
  }
  return ErrorCode.UNKNOWN_ERROR;
}

export function getErrorMessage(error: any): string {
  if (isStellarDeFiInsuranceError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}