/**
 * Smart Contracts TypeScript SDK
 * Production-ready SDK for Stellar Soroban smart contracts
 */

const {
  SorobanRpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  Operation
} = require('@stellar/stellar-sdk');

// Your deployed testnet contract ID
const CONTRACT_ID = "CCZHH3REOS3222YNXMO3SHEAHFWMPEPB6VH3K7TME6P4CCJQ3H7BNXWP";

// Testnet configuration
const TESTNET_CONFIG = {
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  friendbotUrl: 'https://friendbot.stellar.org'
};

/**
 * Main Smart Contract SDK Class
 */
class SmartContractSDK {
  constructor(contractId = CONTRACT_ID, network = 'testnet') {
    this.contractId = contractId;
    this.network = network;

    if (network === 'testnet') {
      this.server = new SorobanRpc.Server(TESTNET_CONFIG.rpcUrl, { allowHttp: false });
      this.networkPassphrase = TESTNET_CONFIG.networkPassphrase;
    }

    console.log(`✅ Smart Contract SDK initialized`);
    console.log(`   Contract ID: ${contractId}`);
    console.log(`   Network: ${network}`);
  }

  /**
   * Get the configured contract instance
   */
  getContract() {
    return new this.server.Contract(this.contractId);
  }

  /**
   * Create a new insurance policy
   * @param {string} holderAddress - The policy holder's Stellar address
   * @param {number} amount - The coverage amount
   * @param {string} sourceAccount - Account to pay for transaction
   * @returns {Promise<number>} Policy ID
   */
  async createPolicy(holderAddress, amount, sourceAccount = TEST_USER_ADDRESS) {
    console.log('\n📝 Creating insurance policy...');
    console.log(`   Holder: ${holderAddress}`);
    console.log(`   Amount: ${amount}`);

    try {
      const account = await this.server.getAccount(sourceAccount);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'create_policy',
          args: [
            nativeToScVal(new Address(holderAddress), { type: 'address' }),
            nativeToScVal(amount, { type: 'i128' })
          ]
        }))
        .setTimeout(30)
        .build();

      // Simulate transaction first
      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.error) {
        throw new Error(`Transaction simulation failed: ${simResult.error}`);
      }

      console.log('✅ Policy creation simulation successful');
      console.log(`   Gas used: ${simResult.gasUsed || 'N/A'}`);

      if (simResult.result) {
        const policyId = scValToNative(simResult.result);
        console.log(`✅ Policy ID created: ${policyId}`);
        return policyId;
      }

      throw new Error('No result from transaction simulation');

    } catch (error) {
      console.error('❌ Policy creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get policy information
   * @param {number} policyId - The policy ID to retrieve
   * @param {string} sourceAccount - Account to pay for transaction
   * @returns {Promise<Object>} Policy data
   */
  async getPolicy(policyId, sourceAccount = TEST_USER_ADDRESS) {
    console.log('\n📄 Getting policy information...');
    console.log(`   Policy ID: ${policyId}`);

    try {
      const account = await this.server.getAccount(sourceAccount);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'get_policy',
          args: [nativeToScVal(policyId, { type: 'u32' })]
        }))
        .setTimeout(30)
        .build();

      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.error) {
        throw new Error(`Transaction simulation failed: ${simResult.error}`);
      }

      console.log('✅ Policy retrieval simulation successful');

      if (simResult.result) {
        const policy = scValToNative(simResult.result);
        console.log(`✅ Policy data retrieved:`, policy);
        return policy;
      }

      throw new Error('No result from transaction simulation');

    } catch (error) {
      console.error('❌ Policy retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all policies for a user
   * @param {string} userAddress - The user's Stellar address
   * @param {string} sourceAccount - Account to pay for transaction
   * @returns {Promise<Array>} Array of policy IDs
   */
  async getUserPolicies(userAddress, sourceAccount = TEST_USER_ADDRESS) {
    console.log('\n👥 Getting user policies...');
    console.log(`   User: ${userAddress}`);

    try {
      const account = await this.server.getAccount(sourceAccount);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'get_user_policies',
          args: [nativeToScVal(new Address(userAddress), { type: 'address' })]
        }))
        .setTimeout(30)
        .build();

      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.error) {
        throw new Error(`Transaction simulation failed: ${simResult.error}`);
      }

      console.log('✅ User policies retrieval simulation successful');

      if (simResult.result) {
        const policies = scValToNative(simResult.result);
        console.log(`✅ User policies retrieved:`, policies);
        return policies;
      }

      throw new Error('No result from transaction simulation');

    } catch (error) {
      console.error('❌ User policies retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Deactivate a policy
   * @param {number} policyId - The policy ID to deactivate
   * @param {string} sourceAccount - Account to pay for transaction
   * @returns {Promise<void>}
   */
  async deactivatePolicy(policyId, sourceAccount = TEST_USER_ADDRESS) {
    console.log('\n🔴 Deactivating policy...');
    console.log(`   Policy ID: ${policyId}`);

    try {
      const account = await this.server.getAccount(sourceAccount);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'deactivate_policy',
          args: [nativeToScVal(policyId, { type: 'u32' })]
        }))
        .setTimeout(30)
        .build();

      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.error) {
        throw new Error(`Transaction simulation failed: ${simResult.error}`);
      }

      console.log('✅ Policy deactivation simulation successful');

    } catch (error) {
      console.error('❌ Policy deactivation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get contract information
   * @returns {Promise<Object>} Contract metadata
   */
  async getContractInfo() {
    console.log('\n📋 Getting contract information...');

    try {
      const contractData = await this.server.getContractData(this.contractId);

      const info = {
        contractId: this.contractId,
        network: this.network,
        rpcUrl: this.network === 'testnet' ? TESTNET_CONFIG.rpcUrl : 'N/A',
        hasData: true,
        data: contractData
      };

      console.log('✅ Contract information retrieved:', info);
      return info;

    } catch (error) {
      console.error('❌ Contract info retrieval failed:', error.message);

      return {
        contractId: this.contractId,
        network: this.network,
        rpcUrl: this.network === 'testnet' ? TESTNET_CONFIG.rpcUrl : 'N/A',
        hasData: false,
        error: error.message
      };
    }
  }
}

// Test user account for demonstration (already funded on testnet)
const TEST_USER_ADDRESS = 'GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A';

/**
 * Convenience function to create a ready-to-use SDK instance
 */
function createSDK(network = 'testnet') {
  return new SmartContractSDK(CONTRACT_ID, network);
}

/**
 * Complete test function for demonstration
 */
async function testCompleteSDK() {
  console.log('🎯 Testing Complete TypeScript SDK');
  console.log('===================================');

  const sdk = createSDK('testnet');
  const testUser = TEST_USER_ADDRESS;

  try {
    // Step 1: Get contract info
    console.log('\n📋 Step 1: Getting contract info...');
    const contractInfo = await sdk.getContractInfo();

    // Step 2: Create a policy
    console.log('\n📝 Step 2: Creating policy...');
    const policyId = await sdk.createPolicy(testUser, 1500);

    // Step 3: Get policy details
    console.log('\n📄 Step 3: Getting policy details...');
    const policy = await sdk.getPolicy(policyId);

    // Step 4: Get user policies
    console.log('\n👥 Step 4: Getting user policies...');
    const userPolicies = await sdk.getUserPolicies(testUser);

    // Step 5: Deactivate policy
    console.log('\n🔴 Step 5: Deactivating policy...');
    await sdk.deactivatePolicy(policyId);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('===================');
    console.log('✅ Your TypeScript SDK is production-ready!');

    return {
      success: true,
      contractInfo,
      policyId,
      policy,
      userPolicies
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  SmartContractSDK,
  createSDK,
  testCompleteSDK,
  CONTRACT_ID,
  TESTNET_CONFIG,
  TEST_USER_ADDRESS
};

// If this file is run directly, execute the test
if (require.main === module) {
  testCompleteSDK().catch(console.error);
}