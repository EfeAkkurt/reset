/**
 * Yield Aggregator Contract Interface
 * Provides methods to interact with the YieldAggregator Soroban contract
 */

import {
  NetworkConfig,
  ContractAddress,
  YieldInfo,
  ContractCallResult,
  TransactionOptions,
  UserInfo
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
import SorobanClient from 'soroban-client';
import { assembleTransaction } from 'soroban-client';
import {
  Address,
  Account,
  Operation,
  TimeoutInfinite,
  nativeToScVal,
} from '@stellar/stellar-base';

export interface YieldAggregatorConfig {
  contractAddress: ContractAddress;
  network: NetworkConfig;
}

export interface DepositParams {
  user: string;
  amount: string | bigint | number;
  insurancePercentage?: number;
}

export interface WithdrawParams {
  user: string;
  amount: string | bigint | number;
  poolId?: string;
}

export interface PoolInfo {
  id: string;
  name: string;
  tokenAddress: string;
  totalLiquidity: bigint;
  apy: number;
  isActive: boolean;
  minDeposit: bigint;
  maxDeposit?: bigint;
  withdrawalFee: number;
}

export class YieldAggregator {
  private config: YieldAggregatorConfig;
  private client: any; // SorobanClient instance

  constructor(config: YieldAggregatorConfig, sorobanClient: any) {
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
   * Deposits funds into a yield pool
   */
  async deposit(
    params: DepositParams,
    options?: TransactionOptions
  ): Promise<ContractCallResult<{ shareAmount: bigint; poolId: string }>> {
    try {
      this.validateDepositParams(params);

      const amount = validateAmount(params.amount);
      const insurancePercentage = params.insurancePercentage ?? 0;

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'deposit',
        args: [params.user, amount.toString(), insurancePercentage],
        source: params.user,
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        result: {
          shareAmount: BigInt(result?.shareAmount ?? 0),
          poolId: result?.poolId || 'default'
        },
        transactionHash: result?.hash,
        gasUsed: result?.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Withdraws funds from a yield pool
   */
  async withdraw(
    params: WithdrawParams,
    options?: TransactionOptions
  ): Promise<ContractCallResult<{ amount: bigint; poolId: string }>> {
    try {
      this.validateWithdrawParams(params);

      const amount = validateAmount(params.amount);
      const poolId = params.poolId || 'default';

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'withdraw',
        args: [params.user, amount.toString(), poolId]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        result: {
          amount: BigInt(result?.amount ?? 0),
          poolId: result?.poolId || poolId
        },
        transactionHash: result?.hash,
        gasUsed: result?.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Gets yield information for a user
   */
  async getUserYieldInfo(userAddress: string): Promise<ContractCallResult<YieldInfo[]>> {
    try {
      if (!validateStellarAddress(userAddress)) {
        throw new ValidationError('Invalid user address', 'userAddress');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_user_yield_info',
        args: [userAddress]
      };

      const result = await this.readOperation(operation);

      const yieldInfos: YieldInfo[] = result.map((info: any) => ({
        poolAddress: info.poolAddress,
        totalLiquidity: BigInt(info.totalLiquidity),
        apy: Number(info.apy),
        userShare: BigInt(info.userShare || 0),
        earnedRewards: BigInt(info.earnedRewards || 0)
      }));

      return {
        success: true,
        result: yieldInfos
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Gets information about all available pools
   */
  async getPoolInfos(): Promise<ContractCallResult<PoolInfo[]>> {
    try {
      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_pool_infos',
        args: []
      };

      const result = await this.readOperation(operation);

      const arr = Array.isArray(result) ? result : [];
      const pools: PoolInfo[] = arr.map((pool: any) => ({
        id: pool?.id ?? 'default',
        name: pool?.name ?? 'Default Pool',
        tokenAddress: pool?.tokenAddress ?? '',
        totalLiquidity: BigInt(pool?.totalLiquidity ?? 0),
        apy: Number(pool?.apy ?? 0),
        isActive: Boolean(pool?.isActive ?? true),
        minDeposit: BigInt(pool?.minDeposit ?? 0),
        maxDeposit: pool?.maxDeposit ? BigInt(pool.maxDeposit) : undefined,
        withdrawalFee: Number(pool?.withdrawalFee ?? 0)
      }));

      return {
        success: true,
        result: pools
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Gets detailed information about a specific pool
   */
  async getPoolInfo(poolId: string): Promise<ContractCallResult<PoolInfo>> {
    try {
      if (!poolId || typeof poolId !== 'string') {
        throw new ValidationError('Invalid pool ID', 'poolId');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_pool_info',
        args: [poolId]
      };

      const result = await this.readOperation(operation);

      const pool: PoolInfo = {
        id: result?.id ?? poolId,
        name: result?.name ?? 'Default Pool',
        tokenAddress: result?.tokenAddress ?? '',
        totalLiquidity: BigInt(result?.totalLiquidity ?? 0),
        apy: Number(result?.apy ?? 0),
        isActive: Boolean(result?.isActive ?? true),
        minDeposit: BigInt(result?.minDeposit ?? 0),
        maxDeposit: result?.maxDeposit ? BigInt(result.maxDeposit) : undefined,
        withdrawalFee: Number(result?.withdrawalFee ?? 0)
      };

      return {
        success: true,
        result: pool
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Claims earned rewards from yield pools
   */
  async claimRewards(
    userAddress: string,
    poolIds?: string[],
    options?: TransactionOptions
  ): Promise<ContractCallResult<{ totalRewards: bigint; rewards: Array<{ poolId: string; amount: bigint }> }>> {
    try {
      if (!validateStellarAddress(userAddress)) {
        throw new ValidationError('Invalid user address', 'userAddress');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'claim_rewards',
        args: [userAddress, poolIds || []]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      const rewards = result.rewards.map((reward: any) => ({
        poolId: reward?.poolId || '',
        amount: BigInt(reward?.amount ?? 0)
      }));

      return {
        success: true,
        result: {
          totalRewards: BigInt(result?.totalRewards ?? 0),
          rewards
        },
        transactionHash: result?.hash,
        gasUsed: result?.gasUsed
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Rebalances user's yield allocation across pools
   */
  async rebalance(
    userAddress: string,
    allocations: Array<{ poolId: string; percentage: number }>,
    options?: TransactionOptions
  ): Promise<ContractCallResult> {
    try {
      if (!validateStellarAddress(userAddress)) {
        throw new ValidationError('Invalid user address', 'userAddress');
      }

      this.validateAllocations(allocations);

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'rebalance',
        args: [userAddress, allocations]
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
   * Gets the total value locked (TVL) across all pools
   */
  async getTotalValueLocked(): Promise<ContractCallResult<bigint>> {
    try {
      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_total_value_locked',
        args: []
      };

      const result = await this.readOperation(operation);

      return {
        success: true,
        result: BigInt(result ?? 0)
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Estimates potential earnings for a given deposit
   */
  async estimateEarnings(
    amount: string | bigint | number,
    poolId: string,
    duration: number // Duration in seconds
  ): Promise<ContractCallResult<{ estimatedEarnings: bigint; apy: number }>> {
    try {
      const depositAmount = validateAmount(amount);

      if (!poolId || typeof poolId !== 'string') {
        throw new ValidationError('Invalid pool ID', 'poolId');
      }

      if (duration <= 0) {
        throw new ValidationError('Duration must be positive', 'duration');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'estimate_earnings',
        args: [depositAmount.toString(), poolId, duration.toString()]
      };

      const result = await this.readOperation(operation);

      return {
        success: true,
        result: {
          estimatedEarnings: BigInt(result?.estimatedEarnings ?? 0),
          apy: Number(result?.apy ?? 0)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  private validateDepositParams(params: DepositParams): void {
    if (!validateStellarAddress(params.user)) {
      throw new ValidationError('Invalid user address', 'user');
    }

    if (!params.amount || validateAmount(params.amount) <= 0n) {
      throw new ValidationError('Deposit amount must be positive', 'amount');
    }
  }

  private validateWithdrawParams(params: WithdrawParams): void {
    if (!validateStellarAddress(params.user)) {
      throw new ValidationError('Invalid user address', 'user');
    }

    if (!params.amount || validateAmount(params.amount) <= 0n) {
      throw new ValidationError('Withdrawal amount must be positive', 'amount');
    }
  }

  private validateAllocations(allocations: Array<{ poolId: string; percentage: number }>): void {
    if (!allocations || allocations.length === 0) {
      throw new ValidationError('At least one allocation is required', 'allocations');
    }

    let totalPercentage = 0;
    for (const allocation of allocations) {
      if (!allocation.poolId || typeof allocation.poolId !== 'string') {
        throw new ValidationError('Invalid pool ID in allocation', 'allocations[].poolId');
      }

      if (allocation.percentage < 0 || allocation.percentage > 100) {
        throw new ValidationError('Percentage must be between 0 and 100', 'allocations[].percentage');
      }

      totalPercentage += allocation.percentage;
    }

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new ValidationError('Total percentage must equal 100%', 'allocations');
    }
  }

  private async executeOperation(operation: any, options?: TransactionOptions): Promise<any> {
    // Build Soroban invoke transaction XDR and return it for signing
    try {
      const tx = await this.buildInvokeTransaction(operation);
      return {
        xdr: tx.toXDR(),
        hash: tx.hash().toString('hex'),
      };
    } catch (error) {
      throw new TransactionError(
        `Failed to build yield operation: ${this.formatError(error)}`,
        undefined,
        error
      );
    }
  }

  private async readOperation(operation: any): Promise<any> {
    return await retry(async () => {
      try {
        return await this.client.simulateTransaction(operation);
      } catch (error) {
        throw new NetworkError(
          `Failed to read yield contract state: ${this.formatError(error)}`,
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

  private async buildInvokeTransaction(operation: { contract: string; method: string; args: any[]; source?: string }) {
    const server = this.client as SorobanClient.Server;
    const source = operation.source || operation.args?.[0] || this.config.contractAddress.address;
    const account = await this.fetchAccountFromHorizon(source);

    // Validate that we have the required arguments
    if (!operation.args || operation.args.length === 0) {
      throw new Error('No arguments provided for contract invocation');
    }

    // Convert arguments to proper ScVal format
    const scArgs = operation.args.map((arg, index) => {
      if (typeof arg === 'string' && arg.startsWith('G')) {
        // Stellar address - convert to Address ScVal
        return Address.fromString(arg).toScVal();
      } else if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'bigint') {
        // Numeric value - convert to i128
        return nativeToScVal(arg, { type: 'i128' });
      } else {
        throw new Error(`Unsupported argument type at index ${index}: ${typeof arg}`);
      }
    });

    // Use the 2025 recommended approach: Operation.invokeContractFunction
    // with properly formatted ScVal arguments
    const invokeOp = Operation.invokeContractFunction({
      contractId: operation.contract,
      functionName: operation.method,
      args: scArgs
    });

    const built = new SorobanClient.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.config.network.networkPassphrase,
    })
      .addOperation(invokeOp)
      .setTimeout(SorobanClient.TimeoutInfinite)
      .build();

    const sim = await server.simulateTransaction(built);
    if (sim.error) {
      throw new Error(sim.error);
    }

    return assembleTransaction(built, this.config.network.networkPassphrase, sim);
  }

  private async fetchAccountFromHorizon(address: string): Promise<Account> {
    const horizon = this.config.network.horizonUrl;
    const resp = await fetch(`${horizon}/accounts/${address}`);
    if (!resp.ok) {
      throw new Error(`Failed to load account: ${resp.status}`);
    }
    const json = await resp.json();
    const seq = json?.sequence;
    if (!seq) {
      throw new Error('Account sequence missing');
    }
    return new Account(address, seq);
  }
}
