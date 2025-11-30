/**
 * Simple Test Script for Local Contract Testing
 */

import { Server, Networks, TransactionBuilder, BASE_FEE } from 'soroban-client';
import { Contract, xdr, SorobanDataBuilder } from '@stellar/stellar-sdk';

// Configuration
const RPC_URL = 'http://localhost:8000/soroban/rpc';
const NETWORK_PASSPHRASE = 'Standalone Network ; February 2017';
const WASM_HASH = 'bd11924e13689e98c0937592cd419652d25d997d0876fef11fef794a7423df3b';

// Test account address
const TEST_USER_ADDRESS = 'GCITVW36R7XQ6VA67TI6J3636HJWX6ZGGZM5MWU55GEGN4IGZABYYYJK';

class ContractTester {
  private server: Server;

  constructor() {
    this.server = new Server(RPC_URL, {
      allowHttp: true, // Important for local testing
    });
  }

  async testConnection() {
    console.log('🔍 Testing Connection to Local Network...');
    try {
      const health = await this.server.getHealth();
      console.log('✅ Server Health:', health);
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
  }

  async getAccount(accountId: string) {
    try {
      const account = await this.server.getAccount(accountId);
      console.log('✅ Account found:', accountId);
      console.log('   Balance:', account.balances);
      return account;
    } catch (error) {
      console.error('❌ Account not found:', accountId);
      return null;
    }
  }

  async deployContract() {
    console.log('🚀 Attempting to Deploy Contract...');

    try {
      // Get account for transaction
      const account = await this.getAccount(TEST_USER_ADDRESS);
      if (!account) {
        throw new Error('Account not found');
      }

      // Create a simple transaction to test if deployment works
      const contract = new Contract({
        wasmHash: WASM_HASH,
      });

      // You need to replace this with your actual contract ID from Soroban Laboratory
      const CONTRACT_ID = 'YOUR_DEPLOYED_CONTRACT_ID_HERE';

      console.log('⚠️  Manual deployment required:');
      console.log('1. Go to: https://laboratory.stellar.org/#soroban');
      console.log('2. Set network to Local with RPC URL:', RPC_URL);
      console.log('3. Upload WASM and deploy contract');
      console.log('4. Replace CONTRACT_ID in this script');
      console.log('5. WASM Hash:', WASM_HASH);

      return CONTRACT_ID;

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      return null;
    }
  }

  async testContract(contractId: string) {
    console.log('🧪 Testing Contract Functions...');

    try {
      const account = await this.getAccount(TEST_USER_ADDRESS);
      if (!account) {
        throw new Error('Account not found');
      }

      const contract = new Contract({
        contractId: contractId,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      console.log('📋 Available contract functions:');
      console.log('  - create_policy(holder: Address, amount: i128) -> u32');
      console.log('  - get_policy(policy_id: u32) -> Policy');
      console.log('  - get_user_policies(user: Address) -> Vec<u32>');
      console.log('  - deactivate_policy(policy_id: u32)');

      // Note: Actual function calls would require the contract to be properly deployed
      // and the account to have sufficient balance for transaction fees

      console.log('✅ Contract interface ready for testing!');

    } catch (error) {
      console.error('❌ Contract testing failed:', error);
    }
  }

  async runTests() {
    console.log('🚀 Starting Local Contract Tests');
    console.log('=====================================');

    // Test 1: Connection
    const isConnected = await this.testConnection();
    if (!isConnected) return;

    // Test 2: Account
    await this.getAccount(TEST_USER_ADDRESS);

    // Test 3: Contract deployment (manual step required)
    const contractId = await this.deployContract();

    if (contractId && contractId !== 'YOUR_DEPLOYED_CONTRACT_ID_HERE') {
      // Test 4: Contract functions
      await this.testContract(contractId);
    }
  }
}

// Run the tests
async function main() {
  const tester = new ContractTester();
  await tester.runTests();
}

if (require.main === module) {
  main().catch(console.error);
}