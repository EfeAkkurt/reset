/**
 * Example Usage of Your TypeScript SDK
 * Run this after you have deployed your contract and have a Contract ID
 */

const {
  SorobanRpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  Contract,
  Operation
} = require('@stellar/stellar-sdk');

// Example - Replace with your actual Contract ID after deployment
const CONTRACT_ID = "CONTRACT_ID_HERE"; // Replace this!
const RPC_URL = 'http://localhost:8000/soroban/rpc';
const TEST_USER_ADDRESS = 'GCITVW36R7XQ6VA67TI6J3636HJWX6ZGGZM5MWU55GEGN4IGZABYYYJK';

class ContractExample {
  constructor(contractId) {
    this.server = new SorobanRpc.Server(RPC_URL, { allowHttp: true });
    this.contract = new Contract(contractId);
    console.log('🚀 Contract Example Initialized');
    console.log('   Contract ID:', contractId);
  }

  async testCreatePolicy(userAddress, amount) {
    console.log('\n📝 Testing create_policy...');
    console.log('   User:', userAddress);
    console.log('   Amount:', amount);

    try {
      const account = await this.server.getAccount(TEST_USER_ADDRESS);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: this.contract,
          function: 'create_policy',
          args: [
            nativeToScVal(new Address(userAddress), { type: 'address' }),
            nativeToScVal(amount, { type: 'i128' })
          ]
        }))
        .setTimeout(30)
        .build();

      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.result !== undefined) {
        const policyId = scValToNative(simResult.result);
        console.log('✅ create_policy successful');
        console.log('   Policy ID:', policyId);
        console.log('   Gas used:', simResult.gasUsed);
        return policyId;
      } else {
        console.error('❌ create_policy failed:', simResult.error?.message);
        return null;
      }
    } catch (error) {
      console.error('❌ create_policy error:', error.message);
      return null;
    }
  }

  async testGetPolicy(policyId) {
    console.log('\n📄 Testing get_policy...');
    console.log('   Policy ID:', policyId);

    try {
      const account = await this.server.getAccount(TEST_USER_ADDRESS);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: this.contract,
          function: 'get_policy',
          args: [nativeToScVal(policyId, { type: 'u32' })]
        }))
        .setTimeout(30)
        .build();

      const simResult = await this.server.simulateTransaction(tx);

      if (simResult.result !== undefined) {
        const policyData = scValToNative(simResult.result);
        console.log('✅ get_policy successful');
        console.log('   Policy data:', policyData);
        console.log('   Gas used:', simResult.gasUsed);
        return policyData;
      } else {
        console.error('❌ get_policy failed:', simResult.error?.message);
        return null;
      }
    } catch (error) {
      console.error('❌ get_policy error:', error.message);
      return null;
    }
  }

  async runCompleteExample() {
    console.log('🧪 Complete Contract Example');
    console.log('============================');

    if (CONTRACT_ID === 'CONTRACT_ID_HERE') {
      console.log('\n❌ Please update CONTRACT_ID with your deployed contract address');
      console.log('\n📋 To get Contract ID:');
      console.log('   soroban contract deploy \\');
      console.log('     --wasm-hash bd11924e13689e98c0937592cd419652d25d997d0876fef11fef794a7423df3b \\');
      console.log('     --source', TEST_USER_ADDRESS, '\\');
      console.log('     --network standalone');
      return;
    }

    // Test create_policy
    const policyId = await this.testCreatePolicy(TEST_USER_ADDRESS, 1000);

    if (policyId) {
      // Test get_policy
      await this.testGetPolicy(policyId);

      console.log('\n🎉 Example completed successfully!');
      console.log('   Your contract is working correctly!');
    } else {
      console.log('\n❌ Example failed - check the errors above');
    }
  }
}

// Main execution
async function main() {
  const example = new ContractExample(CONTRACT_ID);
  await example.runCompleteExample();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ContractExample;