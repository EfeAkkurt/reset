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
import SorobanClient from 'soroban-client';
import { assembleTransaction } from 'soroban-client';
import { Address, Account, Operation, TimeoutInfinite, nativeToScVal, StrKey, xdr } from '@stellar/stellar-base';

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
    const addr = this.config.contractAddress.address;
    const isStellar = validateStellarAddress(addr);
    const isContract = /^[A-Z0-9]{56}$/.test(addr) || /^[a-fA-F0-9]{64}$/.test(addr);
    if (!isStellar && !isContract) {
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

      const operation = {
        contract: this.config.contractAddress.address,
        method: 'create_policy',
        args: [
          params.holder,
          coverageAmount.toString(),
        ],
        source: params.holder,
      };

      if (options?.simulate) {
        return await this.simulateTransaction(operation);
      }

      const result = await this.executeOperation(operation, options);

      if ((result as any).xdr) {
        // Return XDR for external signing path
        return {
          success: true,
          result: { policyId: '' },
          transactionHash: (result as any).hash,
        };
      }

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
    // Build Soroban invoke transaction XDR for signing
    try {
      const tx = await this.buildInvokeTransaction(operation);
      return {
        xdr: tx.toXDR(),
        hash: tx.hash().toString('hex'),
      };
    } catch (error) {
      throw new TransactionError(
        `Failed to execute contract operation: ${this.formatError(error)}`,
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

  private async buildInvokeTransaction(operation: { contract: string; method: string; args: any[]; source?: string }) {
    const server = this.client as SorobanClient.Server;
    const sourceAddress = operation.source || operation.args?.[0];
    if (!sourceAddress) {
      throw new Error('Source address is required to build transaction');
    }
    const account = await this.fetchAccountFromHorizon(sourceAddress);

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

    const contractScAddress = (() => {
      if (/^[A-Z0-9]{56}$/.test(operation.contract) && operation.contract.startsWith('C')) {
        const raw = StrKey.decodeContract(operation.contract);
        return xdr.ScAddress.scAddressTypeContract(new xdr.Hash(raw));
      }
      if (/^[A-Z0-9]{56}$/.test(operation.contract) && operation.contract.startsWith('G')) {
        return Address.fromString(operation.contract).toScAddress();
      }
      if (/^[a-fA-F0-9]{64}$/.test(operation.contract)) {
        const raw = Buffer.from(operation.contract, 'hex');
        return xdr.ScAddress.scAddressTypeContract(new xdr.Hash(raw));
      }
      throw new Error('Unsupported contract address format');
    })();

    const hf = xdr.HostFunction.hostFunctionTypeInvokeContract(
      new xdr.InvokeContractArgs({
        contractAddress: contractScAddress,
        functionName: xdr.ScSymbol.fromString(operation.method),
        args: scArgs
      })
    );

    const invokeOp = Operation.invokeHostFunction({
      hostFunction: hf,
      auth: [],
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
