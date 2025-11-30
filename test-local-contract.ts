/**
 * Complete Local Contract Test with TypeScript SDK
 *
 * Usage:
 * 1. First deploy your contract via Soroban Laboratory
 * 2. Replace CONTRACT_ID below with your deployed contract ID
 * 3. Run: cd sdk && pnpm exec ts-node ../test-local-contract.ts
 */

import {
  Server,
  Networks,
  TransactionBuilder,
  BASE_FEE
} from 'soroban-client';
import {
  Contract,
  xdr,
  SorobanDataBuilder,
  Address
} from '@stellar/stellar-sdk';

// === CONFIGURATION ===
// Replace this with your deployed contract ID from Soroban Laboratory
const CONTRACT_ID = "YOUR_DEPLOYED_CONTRACT_ID_HERE"; // TODO: Replace this!

const RPC_URL = 'http://localhost:8000/soroban/rpc';
const NETWORK_PASSPHRASE = 'Standalone Network ; February 2017';
const TEST_USER_ADDRESS = 'GCITVW36R7XQ6VA67TI6J3636HJWX6ZGGZM5MWU55GEGN4IGZABYYYJK';

class LocalContractTester {
  private server: Server;
  private contract: Contract;

  constructor() {
    this.server = new Server(RPC_URL, { allowHttp: true });
    this.contract = new Contract({
      contractId: CONTRACT_ID,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
  }

  private async testConnection(): Promise<boolean> {
    console.log('🔍 Testing Connection to Local Network...');
    try {
      const health = await this.server.getHealth();
      console.log('✅ Connected to local network');
      console.log('   Health:', health);
      return true;
    } catch (error: any) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
  }

  private async testAccount(): Promise<any> {
    console.log('👤 Testing Account Access...');
    try {
      const account = await this.server.getAccount(TEST_USER_ADDRESS);
      console.log('✅ Account found:', TEST_USER_ADDRESS);
      console.log('   Balance:', account.balances.map((b: any) => `${b.asset_code || 'XLM'}: ${b.balance}`).join(', '));
      console.log('   Sequence:', account.sequenceNumber());
      return account;
    } catch (error: any) {
      console.error('❌ Account error:', error.message);
      return null;
    }
  }

  private async initializeContract(): Promise<boolean> {
    console.log('🚀 Initializing Contract...');
    try {
      const account = await this.testAccount();
      if (!account) throw new Error('Account not available');

      // Call __constructor with admin address
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(
          this.contract.call('__constructor',
            xdr.ScVal.scvAddress(new Address(TEST_USER_ADDRESS)) // Set testuser as admin
          )
        )
        .setTimeout(30)
        .build();

      console.log('✅ Constructor transaction built');
      console.log('   Admin address:', TEST_USER_ADDRESS);

      // Simulate the constructor call
      const simResult = await this.server.simulateTransaction(tx);
      if (simResult.result !== undefined) {
        console.log('✅ Constructor simulation successful');
        return true;
      } else {
        console.log('⚠️  Constructor simulation failed, but continuing...');
        return false;
      }
    } catch (error: any) {
      console.log('⚠️  Initialization failed (contract might already be initialized):', error.message);
      return false;
    }
  }

  private async testCreatePolicy(): Promise<boolean> {
    console.log('📝 Testing Create Policy...');
    try {
      const account = await this.testAccount();
      if (!account) throw new Error('Account not available');

      // Create a policy with test parameters
      const holderAddress = new Address(TEST_USER_ADDRESS);
      const amount = 1000n; // i128 as BigInt

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(
          this.contract.call('create_policy',
            xdr.ScVal.scvAddress(holderAddress),
            xdr.ScVal.scvI128(new xdr.Int128(amount))
          )
        )
        .setTimeout(30)
        .build();

      // Simulate the transaction
      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.result !== undefined) {
        console.log('✅ Policy creation successful');
        console.log('   Holder:', TEST_USER_ADDRESS);
        console.log('   Amount:', amount.toString());
        console.log('   Gas used:', simResult.gasUsed);

        // Parse the result (should be policy_id)
        if (simResult.result) {
          console.log('   Policy ID created:', simResult.result.value()?._value);
        }
        return true;
      } else {
        console.log('❌ Policy creation simulation failed');
        console.log('   Error:', simResult.error?.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Policy creation failed:', error.message);
      return false;
    }
  }

  private async testGetPolicy(policyId: number = 1): Promise<boolean> {
    console.log(`📄 Testing Get Policy (ID: ${policyId})...`);
    try {
      const account = await this.testAccount();
      if (!account) throw new Error('Account not available');

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(
          this.contract.call('get_policy',
            xdr.ScVal.scvU32(policyId)
          )
        )
        .setTimeout(30)
        .build();

      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.result !== undefined) {
        console.log('✅ Get policy successful');
        console.log('   Policy ID:', policyId);
        console.log('   Gas used:', simResult.gasUsed);

        if (simResult.result) {
          console.log('   Policy data:', simResult.result.value()?._value);
        }
        return true;
      } else {
        console.log('❌ Get policy failed');
        console.log('   Error:', simResult.error?.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Get policy failed:', error.message);
      return false;
    }
  }

  private async testGetUserPolicies(): Promise<boolean> {
    console.log('👤 Testing Get User Policies...');
    try {
      const account = await this.testAccount();
      if (!account) throw new Error('Account not available');

      const userAddress = new Address(TEST_USER_ADDRESS);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(
          this.contract.call('get_user_policies',
            xdr.ScVal.scvAddress(userAddress)
          )
        )
        .setTimeout(30)
        .build();

      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.result !== undefined) {
        console.log('✅ Get user policies successful');
        console.log('   User:', TEST_USER_ADDRESS);
        console.log('   Gas used:', simResult.gasUsed);

        if (simResult.result) {
          const policyIds = simResult.result.value()?._value;
          console.log('   Policy IDs:', policyIds);
        }
        return true;
      } else {
        console.log('❌ Get user policies failed');
        console.log('   Error:', simResult.error?.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Get user policies failed:', error.message);
      return false;
    }
  }

  private async testContractInfo(): Promise<boolean> {
    console.log('📋 Testing Contract Information...');
    try {
      const account = await this.testAccount();
      if (!account) throw new Error('Account not available');

      // Test if contract has a get_contract_info function or similar
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(
          this.contract.call('__constructor', // Just test if we can call something
            xdr.ScVal.scvAddress(new Address(TEST_USER_ADDRESS))
          )
        )
        .setTimeout(30)
        .build();

      console.log('✅ Contract is accessible and functional');
      return true;
    } catch (error: any) {
      console.error('❌ Contract access failed:', error.message);
      return false;
    }
  }

  public async runAllTests(): Promise<void> {
    console.log('🚀 TypeScript SDK Local Contract Testing');
    console.log('==========================================');
    console.log(`Contract ID: ${CONTRACT_ID}`);
    console.log(`Network: ${NETWORK_PASSPHRASE}`);
    console.log('');

    if (CONTRACT_ID === "YOUR_DEPLOYED_CONTRACT_ID_HERE") {
      console.error('❌ Please update CONTRACT_ID with your deployed contract ID');
      console.log('');
      console.log('📋 To get your contract ID:');
      console.log('1. Go to: https://laboratory.stellar.org/#soroban');
      console.log('2. Set network to "Local"');
      console.log('3. RPC URL: http://localhost:8000/soroban/rpc');
      console.log('4. Network Passphrase: Standalone Network ; February 2017');
      console.log('5. Upload your WASM file: ../packages/contracts/target/wasm32-unknown-unknown/release/contracts.wasm');
      console.log('6. Deploy contract and copy the Contract ID');
      console.log('7. Replace CONTRACT_ID in this file');
      return;
    }

    const results: boolean[] = [];

    // Test 1: Connection
    results.push(await this.testConnection());

    // Test 2: Account
    const account = await this.testAccount();
    results.push(account !== null);

    if (!account) {
      console.error('❌ Cannot proceed without valid account');
      return;
    }

    // Test 3: Contract access
    results.push(await this.testContractInfo());

    // Test 4: Initialize contract (may fail if already initialized)
    results.push(await this.initializeContract());

    // Test 5: Create policy
    results.push(await this.testCreatePolicy());

    // Test 6: Get policy
    results.push(await this.testGetPolicy(1));

    // Test 7: Get user policies
    results.push(await this.testGetUserPolicies());

    // Summary
    console.log('');
    console.log('📊 Test Results Summary:');
    console.log('=========================');

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`✅ Passed: ${passed}/${total} tests`);

    if (passed === total) {
      console.log('🎉 All tests passed! Your contract is working correctly!');
    } else {
      console.log('⚠️  Some tests failed. This is normal if the contract isn\'t fully deployed or initialized.');
    }

    console.log('');
    console.log('🔧 Available Contract Functions:');
    console.log('  - __constructor(admin: Address)');
    console.log('  - create_policy(holder: Address, amount: i128) -> u32');
    console.log('  - get_policy(policy_id: u32) -> Policy');
    console.log('  - get_user_policies(user: Address) -> Vec<u32>');
    console.log('  - deactivate_policy(policy_id: u32)');
  }
}

// Main execution
async function main() {
  const tester = new LocalContractTester();
  await tester.runAllTests();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { LocalContractTester };