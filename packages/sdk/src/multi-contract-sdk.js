/**
 * Complete Smart Contract SDK - All Three Contracts
 * Supporting SimpleInsurance, YieldAggregator, and Treasury contracts
 */

const {
  SorobanRpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  Operation,
  xdr,
  StrKey
} = require('@stellar/stellar-sdk');

/**
 * Complete Smart Contract SDK for DeFi Insurance Platform
 */
class DeFiInsuranceSDK {
  constructor(network = 'testnet') {
    this.network = network;
    this.rpcUrl = network === 'testnet'
      ? 'https://soroban-testnet.stellar.org'
      : 'https://soroban.stellar.org';

    this.server = new SorobanRpc.Server(this.rpcUrl, { allowHttp: false });
    this.networkPassphrase = network === 'testnet'
      ? Networks.TESTNET
      : Networks.PUBLIC;

    // Contract IDs
    this.contracts = {
      simpleInsurance: "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD",
      yieldAggregator: "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD",
      treasury: "CAA6RLYC724TXZUXYWTHKCHJLGTFV23DNAMGLN2HR2KXSGYYVZKCGKHH"
    };
  }

  /**
   * Build and simulate a transaction
   */
  async buildTransaction(account, contractId, functionName, args = []) {
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(Operation.invokeContractFunction({
        contract: contractId,
        function: functionName,
        args: args
      }))
      .setTimeout(30)
      .build();

    try {
      const { results } = await this.server.simulateTransaction(tx);
      return { success: true, transaction: tx, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(transaction) {
    try {
      const result = await this.server.sendTransaction(transaction);

      if (result.status === 'PENDING') {
        // Wait for confirmation
        const txResponse = await this.server.getTransaction(result.hash);
        return { success: true, result: txResponse };
      } else {
        return { success: false, error: result.status };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // SIMPLE INSURANCE CONTRACT FUNCTIONS
  // ========================================

  /**
   * Create insurance policy
   * @param {string} holderAddress - Policy holder address
   * @param {i128} amount - Coverage amount
   * @param {string} signerSecret - Signer private key
   */
  async createInsurancePolicy(holderAddress, amount, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));
      const holder = Address.fromString(holderAddress);

      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        this.contracts.simpleInsurance,
        'create_policy',
        [
          nativeToScVal(holder, { type: 'address' }),
          nativeToScVal(amount, { type: 'i128' })
        ]
      );

      if (!success) throw new Error(error);

      // Sign and submit transaction
      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get insurance policy details
   * @param {u32} policyId - Policy ID
   */
  async getInsurancePolicy(policyId) {
    try {
      const account = await this.server.getAccount(
        StrKey.decodeEd25519PublicKey('GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A')
      );

      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        this.contracts.simpleInsurance,
        'get_policy',
        [nativeToScVal(policyId, { type: 'u32' })]
      );

      if (!success) throw new Error(error);

      // Return simulated result
      return { success: true, result: scValToNative(results[0]) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all policies for a user
   * @param {string} holderAddress - Policy holder address
   */
  async getUserInsurancePolicies(holderAddress) {
    try {
      const account = await this.server.getAccount(
        StrKey.decodeEd25519PublicKey('GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A')
      );

      const holder = Address.fromString(holderAddress);
      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        this.contracts.simpleInsurance,
        'get_user_policies',
        [nativeToScVal(holder, { type: 'address' })]
      );

      if (!success) throw new Error(error);

      return { success: true, result: scValToNative(results[0]) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Deactivate insurance policy
   * @param {u32} policyId - Policy ID
   * @param {string} signerSecret - Signer private key
   */
  async deactivateInsurancePolicy(policyId, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));

      const { success, transaction, error } = await this.buildTransaction(
        account,
        this.contracts.simpleInsurance,
        'deactivate_policy',
        [nativeToScVal(policyId, { type: 'u32' })]
      );

      if (!success) throw new Error(error);

      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // YIELD AGGREGATOR CONTRACT FUNCTIONS
  // ========================================

  /**
   * Create deposit in yield aggregator
   * @param {string} depositorAddress - Depositor address
   * @param {i128} amount - Deposit amount
   * @param {u32} insurancePercentage - Insurance allocation percentage (0-100)
   * @param {string} signerSecret - Signer private key
   */
  async createYieldDeposit(depositorAddress, amount, insurancePercentage, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));
      const depositor = Address.fromString(depositorAddress);

      const { success, transaction, error } = await this.buildTransaction(
        account,
        this.contracts.yieldAggregator,
        'deposit',
        [
          nativeToScVal(depositor, { type: 'address' }),
          nativeToScVal(amount, { type: 'i128' }),
          nativeToScVal(insurancePercentage, { type: 'u32' })
        ]
      );

      if (!success) throw new Error(error);

      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Withdraw from yield deposit
   * @param {u64} depositId - Deposit ID
   * @param {i128} amount - Withdrawal amount
   * @param {string} signerSecret - Signer private key
   */
  async withdrawFromYieldDeposit(depositId, amount, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));

      const { success, transaction, error } = await this.buildTransaction(
        account,
        this.contracts.yieldAggregator,
        'withdraw',
        [
          nativeToScVal(depositId, { type: 'u64' }),
          nativeToScVal(amount, { type: 'i128' })
        ]
      );

      if (!success) throw new Error(error);

      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get yield deposit details
   * @param {u64} depositId - Deposit ID
   */
  async getYieldDeposit(depositId) {
    try {
      const account = await this.server.getAccount(
        StrKey.decodeEd25519PublicKey('GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A')
      );

      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        this.contracts.yieldAggregator,
        'get_deposit',
        [nativeToScVal(depositId, { type: 'u64' })]
      );

      if (!success) throw new Error(error);

      return { success: true, result: scValToNative(results[0]) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get yield pool statistics
   */
  async getYieldPoolStats() {
    try {
      const account = await this.server.getAccount(
        StrKey.decodeEd25519PublicKey('GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A')
      );

      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        this.contracts.yieldAggregator,
        'get_pool_stats',
        []
      );

      if (!success) throw new Error(error);

      return { success: true, result: scValToNative(results[0]) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add yield to deposit
   * @param {u64} depositId - Deposit ID
   * @param {i128} yieldAmount - Yield amount to add
   * @param {string} signerSecret - Signer private key
   */
  async addYieldToDeposit(depositId, yieldAmount, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));

      const { success, transaction, error } = await this.buildTransaction(
        account,
        this.contracts.yieldAggregator,
        'add_yield',
        [
          nativeToScVal(depositId, { type: 'u64' }),
          nativeToScVal(yieldAmount, { type: 'i128' })
        ]
      );

      if (!success) throw new Error(error);

      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // TREASURY CONTRACT FUNCTIONS
  // ========================================

  /**
   * Create transfer request
   * @param {string} fromAddress - Sender address
   * @param {string} toAddress - Recipient address
   * @param {i128} amount - Transfer amount
   * @param {string} memo - Transfer memo
   * @param {string} signerSecret - Signer private key
   */
  async createTreasuryTransfer(fromAddress, toAddress, amount, memo, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));
      const from = Address.fromString(fromAddress);
      const to = Address.fromString(toAddress);
      const memoSymbol = nativeToScVal(memo, { type: 'symbol' });

      const { success, transaction, error } = await this.buildTransaction(
        account,
        this.contracts.treasury,
        'create_transfer',
        [
          nativeToScVal(from, { type: 'address' }),
          nativeToScVal(to, { type: 'address' }),
          nativeToScVal(amount, { type: 'i128' }),
          memoSymbol
        ]
      );

      if (!success) throw new Error(error);

      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve transfer request
   * @param {Bytes} transferId - Transfer ID
   * @param {string} signerSecret - Signer private key
   */
  async approveTreasuryTransfer(transferId, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));

      const transferIdScVal = nativeToScVal(transferId, { type: 'bytes' });

      const { success, transaction, error } = await this.buildTransaction(
        account,
        this.contracts.treasury,
        'approve_transfer',
        [transferIdScVal]
      );

      if (!success) throw new Error(error);

      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject transfer request
   * @param {Bytes} transferId - Transfer ID
   * @param {string} signerSecret - Signer private key
   */
  async rejectTreasuryTransfer(transferId, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));

      const transferIdScVal = nativeToScVal(transferId, { type: 'bytes' });

      const { success, transaction, error } = await this.buildTransaction(
        account,
        this.contracts.treasury,
        'reject_transfer',
        [transferIdScVal]
      );

      if (!success) throw new Error(error);

      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute transfer request
   * @param {Bytes} transferId - Transfer ID
   * @param {string} signerSecret - Signer private key
   */
  async executeTreasuryTransfer(transferId, signerSecret) {
    try {
      const account = await this.server.getAccount(StrKey.decodeEd25519PublicKey(signerSecret));

      const transferIdScVal = nativeToScVal(transferId, { type: 'bytes' });

      const { success, transaction, error } = await this.buildTransaction(
        account,
        this.contracts.treasury,
        'execute_transfer',
        [transferIdScVal]
      );

      if (!success) throw new Error(error);

      transaction.sign(StrKey.decodeEd25519SecretSeed(signerSecret));
      const result = await this.submitTransaction(transaction);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transfer request details
   * @param {Bytes} transferId - Transfer ID
   */
  async getTreasuryTransfer(transferId) {
    try {
      const account = await this.server.getAccount(
        StrKey.decodeEd25519PublicKey('GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A')
      );

      const transferIdScVal = nativeToScVal(transferId, { type: 'bytes' });

      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        this.contracts.treasury,
        'get_transfer',
        [transferIdScVal]
      );

      if (!success) throw new Error(error);

      return { success: true, result: scValToNative(results[0]) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending treasury transfers
   */
  async getPendingTreasuryTransfers() {
    try {
      const account = await this.server.getAccount(
        StrKey.decodeEd25519PublicKey('GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A')
      );

      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        this.contracts.treasury,
        'get_pending_transfers',
        []
      );

      if (!success) throw new Error(error);

      return { success: true, result: scValToNative(results[0]) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get treasury statistics
   */
  async getTreasuryStats() {
    try {
      const account = await this.server.getAccount(
        StrKey.decodeEd25519PublicKey('GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A')
      );

      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        this.contracts.treasury,
        'get_stats',
        []
      );

      if (!success) throw new Error(error);

      return { success: true, result: scValToNative(results[0]) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Get contract information
   */
  async getContractInfo(contractName) {
    try {
      const contractId = this.contracts[contractName];
      if (!contractId) {
        throw new Error(`Contract '${contractName}' not found`);
      }

      const account = await this.server.getAccount(
        StrKey.decodeEd25519PublicKey('GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A')
      );

      const { success, transaction, results, error } = await this.buildTransaction(
        account,
        contractId,
        'hello',
        [nativeToScVal('World', { type: 'symbol' })]
      );

      if (!success) throw new Error(error);

      return { success: true, contractId, network: this.network };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all contract IDs
   */
  getContractIds() {
    return {
      simpleInsurance: this.contracts.simpleInsurance,
      yieldAggregator: this.contracts.yieldAggregator,
      treasury: this.contracts.treasury,
      network: this.network,
      rpcUrl: this.rpcUrl
    };
  }
}

module.exports = { DeFiInsuranceSDK };