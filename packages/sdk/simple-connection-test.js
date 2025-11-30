/**
 * Simple Connection Test for All Contracts
 */

const { SorobanRpc, Networks, TransactionBuilder, BASE_FEE, Address, nativeToScVal, Operation, StrKey } = require('@stellar/stellar-sdk');

console.log('🔗 Testing Contract Connections');
console.log('===============================');

async function testContractConnections() {
  const rpcUrl = 'https://soroban-testnet.stellar.org';
  const server = new SorobanRpc.Server(rpcUrl, { allowHttp: false });

  // Contract IDs
  const contracts = {
    simpleInsurance: "CCZHH3REOS3222YNXMO3SHEAHFWMPEPB6VH3K7TME6P4CCJQ3H7BNXWP",
    yieldAggregator: "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD",
    treasury: "CAA6RLYC724TXZUXYWTHKCHJLGTFV23DNAMGLN2HR2KXSGYYVZKCGKHH"
  };

  console.log('\n📋 Testing Contract Connections:');
  console.log('RPC URL:', rpcUrl);

  // Test account for simulation
  const testPublicKey = 'GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A';

  try {
    // Get test account
    const account = await server.getAccount(testPublicKey);
    console.log('✅ Test account loaded:', testPublicKey);

    // Test Simple Insurance connection
    console.log('\n🛡️ Testing Simple Insurance connection...');
    try {
      const insuranceTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: contracts.simpleInsurance,
          function: 'get_user_policies',
          args: [nativeToScVal(Address.fromString(testPublicKey), { type: 'address' })]
        }))
        .setTimeout(30)
        .build();

      const insuranceSim = await server.simulateTransaction(insuranceTx);
      console.log('Simple Insurance connection:', insuranceSim.success ? '✅ SUCCESS' : '❌ FAILED');
      if (!insuranceSim.success) {
        console.log('Error:', insuranceSim.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Simple Insurance connection failed:', error.message);
    }

    // Test Yield Aggregator connection
    console.log('\n💰 Testing Yield Aggregator connection...');
    try {
      const yieldTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: contracts.yieldAggregator,
          function: 'get_pool_stats',
          args: []
        }))
        .setTimeout(30)
        .build();

      const yieldSim = await server.simulateTransaction(yieldTx);
      console.log('Yield Aggregator connection:', yieldSim.success ? '✅ SUCCESS' : '❌ FAILED');
      if (!yieldSim.success) {
        console.log('Error:', yieldSim.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Yield Aggregator connection failed:', error.message);
    }

    // Test Treasury connection
    console.log('\n🏛️ Testing Treasury connection...');
    try {
      const treasuryTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: contracts.treasury,
          function: 'get_stats',
          args: []
        }))
        .setTimeout(30)
        .build();

      const treasurySim = await server.simulateTransaction(treasuryTx);
      console.log('Treasury connection:', treasurySim.success ? '✅ SUCCESS' : '❌ FAILED');
      if (!treasurySim.success) {
        console.log('Error:', treasurySim.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Treasury connection failed:', error.message);
    }

    // Test Hello function (should work with any contract)
    console.log('\n👋 Testing Hello function (if available)...');
    try {
      const helloTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: contracts.simpleInsurance,
          function: 'hello',
          args: [nativeToScVal('World', { type: 'symbol' })]
        }))
        .setTimeout(30)
        .build();

      const helloSim = await server.simulateTransaction(helloTx);
      console.log('Hello function test:', helloSim.success ? '✅ SUCCESS' : '❌ FAILED');
      if (helloSim.success) {
        console.log('Hello response available');
      } else {
        console.log('Error:', helloSim.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Hello function test failed:', error.message);
    }

  } catch (error) {
    console.log('❌ RPC Connection failed:', error.message);
  }

  console.log('\n🎯 Summary:');
  console.log('If connections are failing, check:');
  console.log('1. Contract IDs are correct');
  console.log('2. Network connectivity to Stellar testnet');
  console.log('3. Contract functions exist and are accessible');
  console.log('4. Soroban RPC service is operational');
}

// Test contract connections
testContractConnections().catch(console.error);