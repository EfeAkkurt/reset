/**
 * Simple Insurance Contract Interface
 * Provides methods to interact with the SimpleInsurance Soroban contract
 */

import {
  NetworkConfig,
  ContractAddress,
  InsurancePolicy,
  ClaimRequest,
  ContractCallResult,
  TransactionOptions,
  UserInfo,
  SimulationResult,
  PolicyStatus,
  RiskLevel
} from '../types';
import {
  validateStellarAddress,
  validateAmount,
  validateTimestamp,
  formatAmount,
  parseAmount,
  retry
} from '../utils';
import {
  ContractError,
  ValidationError,
  TransactionError,
  NetworkError
} from '../errors';

export interface SimpleInsuranceConfig {
  contractAddress: ContractAddress;
  network: NetworkConfig;
}

export interface CreatePolicyParams {
  holder: string;
  coverageAmount: string | bigint | number;
  premiumAmount: string | bigint | number;
  duration: number; // Duration in seconds
  riskLevel: RiskLevel;
}

export interface UpdatePolicyParams {
  policyId: string;
  coverageAmount?: string | bigint | number;
  premiumAmount?: string | bigint | number;
  endDate?: bigint | string | number;
}

export class SimpleInsurance {
  private config: SimpleInsuranceConfig;
  private client: any; // SorobanClient instance

  constructor(config: SimpleInsuranceConfig, sorobanClient: any) {
    this.config = config;
    this.client = sorobanClient;

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!validateStellarAddress(this.config.contractAddress.address)) {
      throw new ValidationError('Invalid contract address', 'contractAddress');
    }

    if (!this.config.network.sorobanRpcUrl) {
      throw new ValidationError('Soroban RPC URL is required', 'network.sorobanRpcUrl');
    }

    if (!this.config.network.horizonUrl) {
      throw new ValidationError('Horizon URL is required', 'network.horizonUrl');
    }
  }

  /**
   * Creates a new insurance policy
   */
  async createPolicy(
    params: CreatePolicyParams,
    options?: TransactionOptions
  ): Promise<ContractCallResult<{ policyId: string }>> {
    try {
      this.validateCreatePolicyParams(params);

      const coverageAmount = validateAmount(params.coverageAmount);
      const premiumAmount = validateAmount(params.premiumAmount);
      const startDate = BigInt(Math.floor(Date.now() / 1000));
      const endDate = startDate + BigInt(params.duration);

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'create_policy',
        args: [
          params.holder,
          coverageAmount.toString(),
          premiumAmount.toString(),
          startDate.toString(),
          endDate.toString(),
          params.riskLevel
        ]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        result: { policyId: result.policyId },
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
   * Retrieves a policy by ID
   */
  async getPolicy(policyId: string): Promise<ContractCallResult<InsurancePolicy>> {
    try {
      if (!policyId || typeof policyId !== 'string') {
        throw new ValidationError('Invalid policy ID', 'policyId');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_policy',
        args: [policyId]
      };

      const result = await this.readOperation(operation);

      const policy: InsurancePolicy = {
        id: result.id,
        holder: result.holder,
        coverageAmount: BigInt(result.coverageAmount),
        premium: BigInt(result.premium),
        startDate: BigInt(result.startDate),
        endDate: BigInt(result.endDate),
        status: this.parsePolicyStatus(result.status),
        riskLevel: result.riskLevel as RiskLevel
      };

      return {
        success: true,
        result: policy
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Updates an existing policy
   */
  async updatePolicy(
    params: UpdatePolicyParams,
    options?: TransactionOptions
  ): Promise<ContractCallResult> {
    try {
      if (!params.policyId) {
        throw new ValidationError('Policy ID is required', 'policyId');
      }

      const updateData: any = {};

      if (params.coverageAmount) {
        updateData.coverageAmount = validateAmount(params.coverageAmount).toString();
      }

      if (params.premiumAmount) {
        updateData.premiumAmount = validateAmount(params.premiumAmount).toString();
      }

      if (params.endDate) {
        updateData.endDate = validateTimestamp(params.endDate).toString();
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'update_policy',
        args: [params.policyId, updateData]
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
   * Files a claim on a policy
   */
  async fileClaim(
    policyId: string,
    claimRequest: Omit<ClaimRequest, 'policyId' | 'timestamp'>,
    options?: TransactionOptions
  ): Promise<ContractCallResult<{ claimId: string }>> {
    try {
      if (!policyId) {
        throw new ValidationError('Policy ID is required', 'policyId');
      }

      this.validateClaimRequest(claimRequest);

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'file_claim',
        args: [
          policyId,
          claimRequest.claimant,
          validateAmount(claimRequest.amount).toString(),
          claimRequest.reason,
          claimRequest.evidence || [],
          BigInt(Math.floor(Date.now() / 1000)).toString()
        ]
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      return {
        success: true,
        result: { claimId: result.claimId },
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
   * Gets all policies for a user
   */
  async getUserPolicies(userAddress: string): Promise<ContractCallResult<InsurancePolicy[]>> {
    try {
      if (!validateStellarAddress(userAddress)) {
        throw new ValidationError('Invalid user address', 'userAddress');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_user_policies',
        args: [userAddress]
      };

      const result = await this.readOperation(operation);

      const policies: InsurancePolicy[] = result.map((policy: any) => ({
        id: policy.id,
        holder: policy.holder,
        coverageAmount: BigInt(policy.coverageAmount),
        premium: BigInt(policy.premium),
        startDate: BigInt(policy.startDate),
        endDate: BigInt(policy.endDate),
        status: this.parsePolicyStatus(policy.status),
        riskLevel: policy.riskLevel as RiskLevel
      }));

      return {
        success: true,
        result: policies
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Cancels a policy
   */
  async cancelPolicy(
    policyId: string,
    reason: string,
    options?: TransactionOptions
  ): Promise<ContractCallResult> {
    try {
      if (!policyId) {
        throw new ValidationError('Policy ID is required', 'policyId');
      }

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'cancel_policy',
        args: [policyId, reason]
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
   * Gets contract information
   */
  async getContractInfo(): Promise<ContractCallResult<any>> {
    try {
      const operation = {
        contract: this.config.contractAddress.address,
        method: 'get_contract_info',
        args: []
      };

      const result = await this.readOperation(operation);

      return {
        success: true,
        result: {
          admin: result.admin,
          totalPolicies: Number(result.totalPolicies),
          activePolicies: Number(result.activePolicies),
          totalClaims: Number(result.totalClaims),
          totalCoverage: BigInt(result.totalCoverage)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  private validateCreatePolicyParams(params: CreatePolicyParams): void {
    if (!validateStellarAddress(params.holder)) {
      throw new ValidationError('Invalid holder address', 'holder');
    }

    if (!params.coverageAmount || validateAmount(params.coverageAmount) <= 0n) {
      throw new ValidationError('Coverage amount must be positive', 'coverageAmount');
    }

    if (!params.premiumAmount || validateAmount(params.premiumAmount) <= 0n) {
      throw new ValidationError('Premium amount must be positive', 'premiumAmount');
    }

    if (!params.duration || params.duration <= 0) {
      throw new ValidationError('Duration must be positive', 'duration');
    }

    if (!Object.values(RiskLevel).includes(params.riskLevel)) {
      throw new ValidationError('Invalid risk level', 'riskLevel');
    }
  }

  private validateClaimRequest(claimRequest: Omit<ClaimRequest, 'policyId' | 'timestamp'>): void {
    if (!validateStellarAddress(claimRequest.claimant)) {
      throw new ValidationError('Invalid claimant address', 'claimant');
    }

    if (!claimRequest.amount || validateAmount(claimRequest.amount) <= 0n) {
      throw new ValidationError('Claim amount must be positive', 'amount');
    }

    if (!claimRequest.reason || claimRequest.reason.trim().length === 0) {
      throw new ValidationError('Claim reason is required', 'reason');
    }
  }

  private parsePolicyStatus(status: string | number): PolicyStatus {
    if (typeof status === 'number') {
      switch (status) {
        case 0: return PolicyStatus.Active;
        case 1: return PolicyStatus.Expired;
        case 2: return PolicyStatus.Claimed;
        case 3: return PolicyStatus.Cancelled;
        default: throw new ValidationError('Invalid policy status', 'status');
      }
    }

    const upperStatus = status.toUpperCase();
    if (Object.values(PolicyStatus).includes(upperStatus as PolicyStatus)) {
      return upperStatus as PolicyStatus;
    }

    throw new ValidationError('Invalid policy status', 'status');
  }

  private async executeOperation(operation: any, options?: TransactionOptions): Promise<any> {
    return await retry(async () => {
      try {
        const timeout = options?.timeout || 30000;
        return await this.client.sendTransaction(operation, { timeout });
      } catch (error) {
        throw new TransactionError(
          `Failed to execute contract operation: ${this.formatError(error)}`,
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
          `Failed to read contract state: ${this.formatError(error)}`,
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