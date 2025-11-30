/**
 * Treasury Contract Interface
 * Provides methods to interact with the Treasury Soroban contract for multi-signature fund management
 */

import {
  NetworkConfig,
  ContractAddress,
  ContractCallResult,
  TransactionOptions,
  UserInfo,
  SorobanTransaction
} from '../types';
import {
  validateStellarAddress,
  validateAmount,
  retry
} from '../utils';
import {
  ContractError,
  ValidationError,
  TransactionError,
  NetworkError
} from '../errors';

export interface TreasuryConfig {
  contractAddress: ContractAddress;
  network: NetworkConfig;
}

export interface CreateTransactionParams {
  to: string;
  amount: string | bigint | number;
  reason: string;
  requiredSignatures?: number;
}

export interface TransactionInfo {
  id: string;
  from: string;
  to: string;
  amount: bigint;
  reason: string;
  status: TransactionStatus;
  requiredSignatures: number;
  currentSignatures: number;
  createdAt: bigint;
  expiresAt?: bigint;
  signers: string[];
}

export interface TreasuryBalance {
  totalBalance: bigint;
  availableBalance: bigint;
  lockedBalance: bigint;
  tokenAddress: string;
}

export enum TransactionStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Executed = 'EXECUTED',
  Rejected = 'REJECTED',
  Expired = 'EXPIRED'
}

export class Treasury {
  private config: TreasuryConfig;
  private client: any; // SorobanClient instance

  constructor(config: TreasuryConfig, sorobanClient: any) {
    this.config = config;
    this.client = sorobanClient;

    this.validateConfig();
  }

  private validateConfig(): void {
    const addr = this.config.contractAddress.address;
    const isStellar = validateStellarAddress(addr);
    const isContract = /^[A-Z0-9]{56}$/.test(addr) || /^[a-fA-F0-9]{64}$/.test(addr);
    if (!isStellar && !isContract) {
      throw new ValidationError('Invalid contract address', 'contractAddress');
    }

    if (!this.config.network.sorobanRpcUrl) {
      throw new ValidationError('Soroban RPC URL is required', 'network.sorobanRpcUrl');
    }
  }

  /**
   * Creates a new treasury transaction requiring multi-signature approval
   */
  async createTransaction(
    params: CreateTransactionParams,
    options?: TransactionOptions
  ): Promise<ContractCallResult<{ transactionId: string }>> {
    try {
      this.validateTransactionParams(params);

      const amount = validateAmount(params.amount);

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'create_transaction',
        args: [
          params.to,
          amount.toString(),
          params.reason,
          params.requiredSignatures?.toString() || '2'
        ]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        result: { transactionId: result.transactionId },
        transactionHash: result.hash,
        gasUsed: result.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Signs a pending treasury transaction
   */
  async signTransaction(
    transactionId: string,
    signerAddress: string,
    options?: TransactionOptions
  ): Promise<ContractCallResult> {
    try {
      if (!transactionId || typeof transactionId !== 'string') {
        throw new ValidationError('Invalid transaction ID', 'transactionId');
      }

      if (!validateStellarAddress(signerAddress)) {
        throw new ValidationError('Invalid signer address', 'signerAddress');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'sign_transaction',
        args: [transactionId, signerAddress]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        transactionHash: result.hash,
        gasUsed: result.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Executes a fully approved treasury transaction
   */
  async executeTransaction(
    transactionId: string,
    options?: TransactionOptions
  ): Promise<ContractCallResult<{ executed: boolean }>> {
    try {
      if (!transactionId || typeof transactionId !== 'string') {
        throw new ValidationError('Invalid transaction ID', 'transactionId');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'execute_transaction',
        args: [transactionId]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        result: { executed: result.executed },
        transactionHash: result.hash,
        gasUsed: result.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Rejects a treasury transaction
   */
  async rejectTransaction(
    transactionId: string,
    rejectorAddress: string,
    reason: string,
    options?: TransactionOptions
  ): Promise<ContractCallResult> {
    try {
      if (!transactionId || typeof transactionId !== 'string') {
        throw new ValidationError('Invalid transaction ID', 'transactionId');
      }

      if (!validateStellarAddress(rejectorAddress)) {
        throw new ValidationError('Invalid rejector address', 'rejectorAddress');
      }

      if (!reason || reason.trim().length === 0) {
        throw new ValidationError('Rejection reason is required', 'reason');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'reject_transaction',
        args: [transactionId, rejectorAddress, reason]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        transactionHash: result.hash,
        gasUsed: result.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Gets information about a specific transaction
   */
  async getTransaction(transactionId: string): Promise<ContractCallResult<TransactionInfo>> {
    try {
      if (!transactionId || typeof transactionId !== 'string') {
        throw new ValidationError('Invalid transaction ID', 'transactionId');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_transaction',
        args: [transactionId]
      };

      const result = await this.readOperation(operation);

      const transaction: TransactionInfo = {
        id: result.id,
        from: result.from,
        to: result.to,
        amount: BigInt(result.amount),
        reason: result.reason,
        status: this.parseTransactionStatus(result.status),
        requiredSignatures: Number(result.requiredSignatures),
        currentSignatures: Number(result.currentSignatures),
        createdAt: BigInt(result.createdAt),
        expiresAt: result.expiresAt ? BigInt(result.expiresAt) : undefined,
        signers: result.signers || []
      };

      return {
        success: true,
        result: transaction
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Gets all transactions for the treasury
   */
  async getTransactions(
    status?: TransactionStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<ContractCallResult<TransactionInfo[]>> {
    try {
      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_transactions',
        args: [
          status || '',
          limit.toString(),
          offset.toString()
        ]
      };

      const result = await this.readOperation(operation);

      const transactions: TransactionInfo[] = result.map((tx: any) => ({
        id: tx.id,
        from: tx.from,
        to: tx.to,
        amount: BigInt(tx.amount),
        reason: tx.reason,
        status: this.parseTransactionStatus(tx.status),
        requiredSignatures: Number(tx.requiredSignatures),
        currentSignatures: Number(tx.currentSignatures),
        createdAt: BigInt(tx.createdAt),
        expiresAt: tx.expiresAt ? BigInt(tx.expiresAt) : undefined,
        signers: tx.signers || []
      }));

      return {
        success: true,
        result: transactions
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Gets the current treasury balance
   */
  async getBalance(): Promise<ContractCallResult<TreasuryBalance>> {
    try {
      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_balance',
        args: []
      };

      const result = await this.readOperation(operation);

      const balance: TreasuryBalance = {
        totalBalance: BigInt(result.totalBalance),
        availableBalance: BigInt(result.availableBalance),
        lockedBalance: BigInt(result.lockedBalance),
        tokenAddress: result.tokenAddress
      };

      return {
        success: true,
        result: balance
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Gets the list of authorized signers
   */
  async getSigners(): Promise<ContractCallResult<string[]>> {
    try {
      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_signers',
        args: []
      };

      const result = await this.readOperation(operation);

      return {
        success: true,
        result: result as string[]
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Adds a new authorized signer (admin only)
   */
  async addSigner(
    signerAddress: string,
    options?: TransactionOptions
  ): Promise<ContractCallResult> {
    try {
      if (!validateStellarAddress(signerAddress)) {
        throw new ValidationError('Invalid signer address', 'signerAddress');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'add_signer',
        args: [signerAddress]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        transactionHash: result.hash,
        gasUsed: result.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Removes an authorized signer (admin only)
   */
  async removeSigner(
    signerAddress: string,
    options?: TransactionOptions
  ): Promise<ContractCallResult> {
    try {
      if (!validateStellarAddress(signerAddress)) {
        throw new ValidationError('Invalid signer address', 'signerAddress');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'remove_signer',
        args: [signerAddress]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        transactionHash: result.hash,
        gasUsed: result.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Updates the required number of signatures for transactions
   */
  async updateRequiredSignatures(
    requiredSignatures: number,
    options?: TransactionOptions
  ): Promise<ContractCallResult> {
    try {
      if (!Number.isInteger(requiredSignatures) || requiredSignatures < 1) {
        throw new ValidationError('Required signatures must be a positive integer', 'requiredSignatures');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'update_required_signatures',
        args: [requiredSignatures.toString()]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        transactionHash: result.hash,
        gasUsed: result.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Gets treasury configuration and statistics
   */
  async getTreasuryInfo(): Promise<ContractCallResult<{
    admin: string;
    requiredSignatures: number;
    totalSigners: number;
    totalTransactions: number;
    pendingTransactions: number;
    executedTransactions: number;
  }>> {
    try {
      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_treasury_info',
        args: []
      };

      const result = await this.readOperation(operation);

      return {
        success: true,
        result: {
          admin: result.admin,
          requiredSignatures: Number(result.requiredSignatures),
          totalSigners: Number(result.totalSigners),
          totalTransactions: Number(result.totalTransactions),
          pendingTransactions: Number(result.pendingTransactions),
          executedTransactions: Number(result.executedTransactions)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  private validateTransactionParams(params: CreateTransactionParams): void {
    if (!validateStellarAddress(params.to)) {
      throw new ValidationError('Invalid recipient address', 'to');
    }

    if (!params.amount || validateAmount(params.amount) <= 0n) {
      throw new ValidationError('Transaction amount must be positive', 'amount');
    }

    if (!params.reason || params.reason.trim().length === 0) {
      throw new ValidationError('Transaction reason is required', 'reason');
    }

    if (params.requiredSignatures && (!Number.isInteger(params.requiredSignatures) || params.requiredSignatures < 1)) {
      throw new ValidationError('Required signatures must be a positive integer', 'requiredSignatures');
    }
  }

  private parseTransactionStatus(status: string | number): TransactionStatus {
    if (typeof status === 'number') {
      switch (status) {
        case 0: return TransactionStatus.Pending;
        case 1: return TransactionStatus.Approved;
        case 2: return TransactionStatus.Executed;
        case 3: return TransactionStatus.Rejected;
        case 4: return TransactionStatus.Expired;
        default: throw new ValidationError('Invalid transaction status', 'status');
      }
    }

    const upperStatus = status.toUpperCase();
    if (Object.values(TransactionStatus).includes(upperStatus as TransactionStatus)) {
      return upperStatus as TransactionStatus;
    }

    throw new ValidationError('Invalid transaction status', 'status');
  }

  private async executeOperation(operation: any, options?: TransactionOptions): Promise<any> {
    return await retry(async () => {
      try {
        const timeout = options?.timeout || 30000;
        return await this.client.sendTransaction(operation, { timeout });
      } catch (error) {
        throw new TransactionError(
          `Failed to execute treasury operation: ${this.formatError(error)}`,
          undefined,
          error
        );
      }
    }, 3, 1000);
  }

  private async readOperation(operation: any): Promise<any> {
    return await retry(async () => {
      try {
        return await this.client.simulateTransaction(operation);
      } catch (error) {
        throw new NetworkError(
          `Failed to read treasury contract state: ${this.formatError(error)}`,
          error
        );
      }
    }, 3, 1000);
  }

  private async simulateTransaction(operation: any): Promise<ContractCallResult> {
    try {
      const simulation = await this.client.simulateTransaction(operation);

      return {
        success: true,
        result: simulation.result,
        gasUsed: BigInt(simulation.estimatedGas || 0)
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  private formatError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }
}
