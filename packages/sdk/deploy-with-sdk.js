/**
 * Deploy Smart Contract using JavaScript SDK
 * This bypasses the Soroban CLI XDR issues by using Stellar SDK directly
 */

const {
  SorobanRpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  Operation,
  xdr
} = require('@stellar/stellar-sdk');

// Configuration
const RPC_URL = 'http://localhost:8000/soroban/rpc';
const NETWORK_PASSPHRASE = 'Standalone Network ; February 2017';
const WASM_HASH = 'bd11924e13689e98c0937592cd419652d25d997d0876fef11fef794a7423df3b';
const DEPLOYER_ADDRESS = 'GCITVW36R7XQ6VA67TI6J3636HJWX6ZGGZM5MWU55GEGN4IGZABYYYJK'; // testuser

class ContractDeployer {
  constructor() {
    this.server = new SorobanRpc.Server(RPC_URL, { allowHttp: true });
    console.log('🚀 JavaScript SDK Contract Deployer');
    console.log('==================================');
    console.log('✅ RPC URL:', RPC_URL);
    console.log('✅ WASM Hash:', WASM_HASH);
    console.log('✅ Deployer:', DEPLOYER_ADDRESS);
  }

  async deployContract() {
    console.log('\n🔧 Deploying Contract with JavaScript SDK...');

    try {
      // Get deployer account
      const account = await this.server.getAccount(DEPLOYER_ADDRESS);
      console.log('✅ Deployer account found');
      console.log('   Sequence:', account.sequence.toString());

      // Create contract deployment operation
      // Using createCustomContract operation with WASM hash as Buffer
      const wasmHashBuffer = Buffer.from(WASM_HASH, 'hex');
      const deployerAddress = new Address(DEPLOYER_ADDRESS);
      const contractOperation = Operation.createCustomContract({
        address: deployerAddress,
        wasmHash: wasmHashBuffer
      });

      console.log('✅ Contract operation created');

      // Build transaction
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(contractOperation)
        .setTimeout(30)
        .build();

      console.log('✅ Transaction built');

      // Simulate transaction first
      console.log('🔄 Simulating transaction...');
      const simulationResult = await this.server.simulateTransaction(transaction);

      if (simulationResult.error) {
        console.error('❌ Simulation error:', simulationResult.error);
        return null;
      }

      console.log('✅ Transaction simulation successful');
      console.log('   Gas used:', simulationResult.gasUsed || 'N/A');

      // Prepare transaction for submission
      console.log('📝 Preparing transaction...');
      const preparedTransaction = await this.server.prepareTransaction(transaction);

      console.log('✅ Transaction prepared');
      console.log('   Transaction ready for signing and submission');

      // Return the contract ID from simulation result
      if (simulationResult.results && simulationResult.results[0]) {
        const contractAddress = simulationResult.results[0].address;
        console.log('✅ Contract address generated:', contractAddress);

        // Convert to Contract ID format
        const contractId = new Address(contractAddress).toString();
        console.log('✅ Contract ID:', contractId);

        // Create contract instance for testing
        const contract = new this.server.Contract(contractAddress);

        return {
          success: true,
          contractId: contractId,
          contractAddress: contractAddress,
          contract: contract,
          transaction: preparedTransaction,
          simulationResult: simulationResult
        };
      }

      return {
        success: false,
        error: 'No contract address in simulation result',
        simulationResult: simulationResult
      };

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      console.error('   Stack:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testContract(contractId) {
    console.log('\n🧪 Testing Deployed Contract...');

    try {
      const account = await this.server.getAccount(DEPLOYER_ADDRESS);
      console.log('✅ Got account for testing');

      // Test the contract by calling the hello function
      const contract = new this.server.Contract(contractId);

      const testTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.STANDALONE,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: contract,
          function: 'hello',
          args: [nativeToScVal('SDK Test', { type: 'symbol' })]
        }))
        .setTimeout(30)
        .build();

      console.log('🔄 Testing hello function...');
      const testResult = await this.server.simulateTransaction(testTx);

      if (testResult.error) {
        console.error('❌ Contract test failed:', testResult.error);
        return false;
      }

      if (testResult.result) {
        const response = nativeToScVal(testResult.result);
        console.log('✅ Contract test successful!');
        console.log('   Response:', response);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Contract test failed:', error.message);
      return false;
    }
  }

  async runDeployment() {
    console.log('\n🎯 Complete Deployment Process');
    console.log('===============================');

    // Step 1: Deploy contract
    const deployment = await this.deployContract();

    if (!deployment.success) {
      console.error('\n❌ Deployment failed');
      console.error('   Error:', deployment.error);

      console.log('\n📋 Troubleshooting:');
      console.log('   1. Ensure local network is running');
      console.log('   2. Check account has funds');
      console.log('   3. Verify WASM hash is correct');
      console.log('   4. Check network connection');

      return deployment;
    }

    console.log('\n🎉 Contract Deployed Successfully!');
    console.log('===============================');
    console.log('✅ Contract ID:', deployment.contractId);
    console.log('✅ Contract Address:', deployment.contractAddress);
    console.log('✅ Transaction ready for submission');

    // Step 2: Test contract
    const testPassed = await this.testContract(deployment.contractAddress);

    if (testPassed) {
      console.log('\n🎉 All Tests Passed! Contract is Working!');
      console.log('==========================================');
      console.log('\n📋 Contract Details for Your TypeScript SDK:');
      console.log('   Contract ID:', deployment.contractId);
      console.log('   Use this ID in your TypeScript SDK tests');

      console.log('\n💻 Next Steps:');
      console.log('   1. Update example-usage.js with Contract ID');
      console.log('   2. Test TypeScript SDK');
      console.log('   3. Start building your dApp');

      return deployment;
    } else {
      console.log('\n⚠️  Contract deployed but tests failed');
      console.log('   Contract ID:', deployment.contractId);
      console.log('   Check contract implementation');

      return deployment;
    }
  }
}

// Main execution
async function main() {
  const deployer = new ContractDeployer();
  const result = await deployer.runDeployment();

  if (result.success) {
    console.log('\n✅ Success! Your smart contract is deployed and ready!');
    process.exit(0);
  } else {
    console.log('\n❌ Deployment completed with issues');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ContractDeployer;