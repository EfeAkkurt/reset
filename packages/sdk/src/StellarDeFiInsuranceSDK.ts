/**
 * Main Stellar DeFi Insurance SDK
 * Provides a unified interface for interacting with all contracts in the ecosystem
 */

// Avoid static imports of @stellar/stellar-sdk in browser bundles to bypass sodium-native/Node polyfills.
// We'll lazy-require when needed; xdr is lightweight enough to require directly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { xdr, Keypair } = require('@stellar/stellar-base');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SorobanClient = require('soroban-client');

import {
  NetworkConfig,
  ContractAddress,
  ContractConfig,
  WalletConfig,
  ContractCallResult,
  TransactionOptions
} from './types';
import {
  SimpleInsurance,
  SimpleInsuranceConfig
} from './contracts/SimpleInsurance';
import {
  YieldAggregator,
  YieldAggregatorConfig
} from './contracts/YieldAggregator';
import {
  Treasury,
  TreasuryConfig
} from './contracts/Treasury';
import {
  ConfigurationError,
  NetworkError,
  AuthenticationError
} from './errors';
import {
  validateStellarAddress,
  retry
} from './utils';

export interface SDKConfig {
  network: NetworkConfig;
  contracts: {
    simpleInsurance?: ContractAddress;
    yieldAggregator?: ContractAddress;
    treasury?: ContractAddress;
  };
  wallet?: WalletConfig;
  defaultTimeout?: number;
}

export interface SDKContracts {
  simpleInsurance?: SimpleInsurance;
  yieldAggregator?: YieldAggregator;
  treasury?: Treasury;
}

export class StellarDeFiInsuranceSDK {
  private config: SDKConfig;
  private server: any;
  private sorobanClient: any; // Soroban RPC client
  private wallet?: WalletConfig;
  private contracts: SDKContracts;

  constructor(config: SDKConfig) {
    this.config = config;
    this.contracts = {};

    this.validateConfig();
    this.initializeClients();
    this.initializeContracts();
  }

  /**
   * Static factory method to create SDK for common networks
   */
  static forNetwork(network: 'mainnet' | 'testnet' | 'futurenet'): (contracts: ContractAddress[], wallet?: WalletConfig) => StellarDeFiInsuranceSDK {
    const networkConfigs = {
      mainnet: {
        network: 'mainnet',
        sorobanRpcUrl: 'https://soroban.stellar.org',
        horizonUrl: 'https://horizon.stellar.org',
        networkPassphrase: 'Public Global Stellar Network ; September 2015'
      },
      testnet: {
        network: 'testnet',
        sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
        horizonUrl: 'https://horizon-testnet.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015'
      },
      futurenet: {
        network: 'futurenet',
        sorobanRpcUrl: 'https://horizon-futurenet.stellar.org',
        horizonUrl: 'https://horizon-futurenet.stellar.org',
        networkPassphrase: 'Test SDF Future Network ; October 2022'
      }
    };

    return (contracts: ContractAddress[], wallet?: WalletConfig) => {
      const contractMap: any = {};
      contracts.forEach(contract => {
        switch (contract.type) {
          case ContractType.SimpleInsurance:
            contractMap.simpleInsurance = contract.address;
            break;
          case ContractType.YieldAggregator:
            contractMap.yieldAggregator = contract.address;
            break;
          case ContractType.Treasury:
            contractMap.treasury = contract.address;
            break;
          default:
            contractMap[contract.type] = contract.address;
        }
      });

      return new StellarDeFiInsuranceSDK({
        network: networkConfigs[network],
        contracts: contractMap,
        wallet
      });
    };
  }

  /**
   * Get the Stellar Horizon server instance
   */
  getServer(): any {
    return this.server;
  }

  /**
   * Get the Soroban RPC client instance
   */
  getSorobanClient(): any {
    return this.sorobanClient;
  }

  /**
   * Get the current network configuration
   */
  getNetwork(): NetworkConfig {
    return this.config.network;
  }

  /**
   * Get connected wallet information
   */
  getWallet(): WalletConfig | undefined {
    return this.wallet;
  }

  /**
   * Connect a wallet to the SDK
   */
  async connectWallet(walletConfig: WalletConfig): Promise<void> {
    try {
      if (walletConfig.secretKey) {
        const keypair = Keypair.fromSecret(walletConfig.secretKey);
        walletConfig.publicKey = keypair.publicKey();
      }

      if (!walletConfig.publicKey) {
        throw new AuthenticationError('Public key is required for wallet connection');
      }

      if (!validateStellarAddress(walletConfig.publicKey)) {
        throw new AuthenticationError('Invalid public key format');
      }

      this.wallet = walletConfig;
    } catch (error) {
      throw new AuthenticationError(
        `Failed to connect wallet: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disconnect the current wallet
   */
  disconnectWallet(): void {
    this.wallet = undefined;
  }

  /**
   * Get the SimpleInsurance contract interface
   */
  getSimpleInsurance(): SimpleInsurance | undefined {
    return this.contracts.simpleInsurance;
  }

  /**
   * Get the YieldAggregator contract interface
   */
  getYieldAggregator(): YieldAggregator | undefined {
    return this.contracts.yieldAggregator;
  }

  /**
   * Get the Treasury contract interface
   */
  getTreasury(): Treasury | undefined {
    return this.contracts.treasury;
  }

  /**
   * Get all available contracts
   */
  getContracts(): SDKContracts {
    return { ...this.contracts };
  }

  /**
   * Get account information for a Stellar address
   */
  async getAccount(accountId: string): Promise<any> {
    try {
      if (!validateStellarAddress(accountId)) {
        throw new ConfigurationError('Invalid account ID');
      }

      return await retry(async () => {
        return await this.server.loadAccount(accountId);
      }, 3, 1000);
    } catch (error) {
      throw new NetworkError(
        `Failed to load account: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get account balance for a Stellar address
   */
  async getBalance(accountId: string, assetCode: string = 'XLM'): Promise<string> {
    try {
      const account = await this.getAccount(accountId);
      const balance = account.balances.find((b: any) =>
        b.asset_type === assetCode || (assetCode === 'XLM' && b.asset_type === 'native')
      );

      return balance ? balance.balance : '0';
    } catch (error) {
      throw new NetworkError(
        `Failed to get balance: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Send a payment transaction
   */
  async sendPayment(
    fromSecret: string,
    toAddress: string,
    amount: string,
    assetCode: string = 'XLM',
    memo?: string
  ): Promise<ContractCallResult<{ transactionHash: string }>> {
    // Browser/demo stub: disabled to avoid sodium-native/Server issues
    return {
      success: false,
      error: 'sendPayment is disabled in browser demo mode',
    };
  }

  /**
   * Simulate a transaction before sending
   */
  async simulateTransaction(transaction: any): Promise<ContractCallResult> {
    try {
      const simulation = await this.sorobanClient.simulateTransaction(transaction);

      return {
        success: true,
        result: {
          simulation,
          estimatedGas: simulation.estimatedGas,
          events: simulation.events,
          authRequired: simulation.authRequired
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get the current ledger info
   */
  async getLedgerInfo(): Promise<any> {
    try {
      return await retry(async () => {
        return await this.server.ledgers().limit(1).call();
      }, 3, 1000);
    } catch (error) {
      throw new NetworkError(
        `Failed to get ledger info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionHash: string): Promise<any> {
    try {
      return await retry(async () => {
        return await this.server.transactions().transaction(transactionHash).call();
      }, 3, 1000);
    } catch (error) {
      throw new NetworkError(
        `Failed to get transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Health check to verify all services are accessible
   */
  async healthCheck(): Promise<{
    stellar: boolean;
    soroban: boolean;
    contracts: Record<string, boolean>;
  }> {
    const results = {
      stellar: false,
      soroban: false,
      contracts: {} as Record<string, boolean>
    };

    try {
      // Check Stellar Horizon server
      await this.getLedgerInfo();
      results.stellar = true;
    } catch (error) {
      console.error('Stellar health check failed:', error);
    }

    try {
      // Check Soroban RPC client
      await this.sorobanClient.getHealth();
      results.soroban = true;
    } catch (error) {
      console.error('Soroban health check failed:', error);
    }

    // Check contract availability
    if (this.contracts.simpleInsurance) {
      try {
        await this.contracts.simpleInsurance.getContractInfo();
        results.contracts.simpleInsurance = true;
      } catch (error) {
        results.contracts.simpleInsurance = false;
      }
    }

    if (this.contracts.yieldAggregator) {
      try {
        await this.contracts.yieldAggregator.getPoolInfos();
        results.contracts.yieldAggregator = true;
      } catch (error) {
        results.contracts.yieldAggregator = false;
      }
    }

    if (this.contracts.treasury) {
      try {
        await this.contracts.treasury.getTreasuryInfo();
        results.contracts.treasury = true;
      } catch (error) {
        results.contracts.treasury = false;
      }
    }

    return results;
  }

  private validateConfig(): void {
    if (!this.config.network) {
      throw new ConfigurationError('Network configuration is required');
    }

    if (!this.config.network.sorobanRpcUrl) {
      throw new ConfigurationError('Soroban RPC URL is required');
    }

    if (!this.config.network.horizonUrl) {
      throw new ConfigurationError('Horizon URL is required');
    }

    if (!this.config.network.networkPassphrase) {
      throw new ConfigurationError('Network passphrase is required');
    }

    if (!this.config.contracts || Object.keys(this.config.contracts).length === 0) {
      throw new ConfigurationError('At least one contract must be configured');
    }
  }

  private initializeClients(): void {
    try {
      // Browser stub for Horizon; Soroban RPC below
      this.server = {
        loadAccount: async () => {
          throw new Error('Horizon client unavailable in browser stub');
        },
        ledgers: () => ({ limit: () => ({ call: async () => ({}) }) }),
        transactions: () => ({ transaction: () => ({ call: async () => ({}) }) }),
        submitTransaction: async () => ({ successful: false, hash: '' }),
      };

      // Real Soroban RPC client for testnet/mainnet/futurenet
      this.sorobanClient = new SorobanClient.Server(this.config.network.sorobanRpcUrl, {
        allowHttp: this.config.network.sorobanRpcUrl.startsWith('http://'),
      });

      // Patch getLedgerEntries to use object params for newer RPC servers
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const jsonrpc = require('soroban-client/lib/jsonrpc');
        const original = this.sorobanClient._getLedgerEntries?.bind(this.sorobanClient);
        this.sorobanClient._getLedgerEntries = async (...keys: any[]) => {
          const payload = { keys: keys.map((k: any) => k.toXDR('base64')) };
          return jsonrpc.post(this.sorobanClient.serverURL.toString(), 'getLedgerEntries', payload);
        };
        if (this.sorobanClient.getLedgerEntries) {
          this.sorobanClient.getLedgerEntries = async (...keys: any[]) => {
            const raw = await this.sorobanClient._getLedgerEntries(...keys);
            if (raw.entries) return raw;
            if (original) return original(...keys);
            return raw;
          };
        }
      } catch {
        // If patching fails, continue with default behavior
      }
    } catch (error) {
      throw new ConfigurationError(
        `Failed to initialize clients: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private initializeContracts(): void {
    if (this.config.contracts.simpleInsurance) {
      this.contracts.simpleInsurance = new SimpleInsurance(
        {
          contractAddress: {
            contractId: this.config.contracts.simpleInsurance,
            address: this.config.contracts.simpleInsurance
          },
          network: this.config.network
        },
        this.sorobanClient
      );
    }

    if (this.config.contracts.yieldAggregator) {
      this.contracts.yieldAggregator = new YieldAggregator(
        {
          contractAddress: {
            contractId: this.config.contracts.yieldAggregator,
            address: this.config.contracts.yieldAggregator
          },
          network: this.config.network
        },
        this.sorobanClient
      );
    }

    if (this.config.contracts.treasury) {
      this.contracts.treasury = new Treasury(
        {
          contractAddress: {
            contractId: this.config.contracts.treasury,
            address: this.config.contracts.treasury
          },
          network: this.config.network
        },
        this.sorobanClient
      );
    }
  }
}
