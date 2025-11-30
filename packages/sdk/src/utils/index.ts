/**
 * Utility functions for the Stellar DeFi Insurance SDK
 */

import { ValidationError, ErrorCode } from '../errors';

/**
 * Validates a Stellar address format
 */
export function validateStellarAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Stellar addresses start with 'G' and are 56 characters long
  return /^G[0-9A-Z]{55}$/.test(address);
}

/**
 * Validates a contract ID format
 */
export function validateContractId(contractId: string): boolean {
  if (!contractId || typeof contractId !== 'string') {
    return false;
  }

  // Contract IDs are hex strings, typically 64 characters
  return /^[a-fA-F0-9]{64}$/.test(contractId);
}

/**
 * Validates amount (must be positive integer)
 */
export function validateAmount(amount: bigint | string | number): bigint {
  let bigintValue: bigint;

  if (typeof amount === 'bigint') {
    bigintValue = amount;
  } else if (typeof amount === 'string') {
    try {
      bigintValue = BigInt(amount);
    } catch {
      throw new ValidationError('Invalid amount format', 'amount');
    }
  } else if (typeof amount === 'number') {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new ValidationError('Amount must be a non-negative integer', 'amount');
    }
    bigintValue = BigInt(amount);
  } else {
    throw new ValidationError('Invalid amount type', 'amount');
  }

  if (bigintValue < 0n) {
    throw new ValidationError('Amount must be non-negative', 'amount');
  }

  return bigintValue;
}

/**
 * Validates timestamp (must be positive integer)
 */
export function validateTimestamp(timestamp: bigint | string | number): bigint {
  let bigintValue: bigint;

  if (typeof timestamp === 'bigint') {
    bigintValue = timestamp;
  } else if (typeof timestamp === 'string') {
    try {
      bigintValue = BigInt(timestamp);
    } catch {
      throw new ValidationError('Invalid timestamp format', 'timestamp');
    }
  } else if (typeof timestamp === 'number') {
    if (!Number.isInteger(timestamp) || timestamp < 0) {
      throw new ValidationError('Timestamp must be a non-negative integer', 'timestamp');
    }
    bigintValue = BigInt(timestamp);
  } else {
    throw new ValidationError('Invalid timestamp type', 'timestamp');
  }

  if (bigintValue < 0n) {
    throw new ValidationError('Timestamp must be non-negative', 'timestamp');
  }

  return bigintValue;
}

/**
 * Formats amount for display (with proper decimal places)
 */
export function formatAmount(amount: bigint, decimals: number = 7): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;

  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

  if (fractionStr) {
    return `${whole.toString()}.${fractionStr}`;
  }

  return whole.toString();
}

/**
 * Parses amount from string to bigint
 */
export function parseAmount(amountStr: string, decimals: number = 7): bigint {
  if (!amountStr || typeof amountStr !== 'string') {
    throw new ValidationError('Invalid amount string', 'amount');
  }

  const parts = amountStr.split('.');
  if (parts.length > 2) {
    throw new ValidationError('Invalid amount format', 'amount');
  }

  let wholePart = parts[0] || '0';
  let fractionPart = parts[1] || '';

  // Pad or truncate fraction part
  if (fractionPart.length > decimals) {
    fractionPart = fractionPart.substring(0, decimals);
  } else {
    fractionPart = fractionPart.padEnd(decimals, '0');
  }

  try {
    const whole = BigInt(wholePart);
    const fraction = BigInt(fractionPart);
    const divisor = BigInt(10 ** decimals);

    return whole * divisor + fraction;
  } catch (error) {
    throw new ValidationError('Invalid amount number', 'amount');
  }
}

/**
 * Converts timestamp to Date object
 */
export function timestampToDate(timestamp: bigint): Date {
  const seconds = Number(timestamp);
  return new Date(seconds * 1000);
}

/**
 * Converts Date to timestamp
 */
export function dateToTimestamp(date: Date = new Date()): bigint {
  return BigInt(Math.floor(date.getTime() / 1000));
}

/**
 * Debounce function for limiting API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Generates a unique ID for operations
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Checks if a value is a valid positive number
 */
export function isPositiveNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Checks if a value is a valid non-negative integer
 */
export function isNonNegativeInteger(value: any): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Formats error messages consistently
 */
export function formatErrorMessage(error: any): string {
  if (error && typeof error === 'object') {
    if (error.message) {
      return error.message;
    }
    if (error.error) {
      return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }
  }

  return String(error || 'Unknown error');
}