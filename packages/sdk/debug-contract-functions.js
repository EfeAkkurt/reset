/**
 * Debug script to check what functions are available in the contracts
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
  StrKey,
  Keypair
} = require('@stellar/stellar-sdk');

console.log('🔍 Debugging Contract Functions');
console.log('===============================');

async function debugContractFunctions() {
  const contracts = {
    simpleInsurance: "CCZHH3REOS3222YNXMO3SHEAHFWMPEPB6VH3K7TME6P4CCJQ3H7BNXWP",
    yieldAggregator: "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD",
    treasury: "CAA6RLYC724TXZUXYWTHKCHJLGTFV23DNAMGLN2HR2KXSGYYVZKCGKHH"
  };

  const rpcUrl = 'https://soroban-testnet.stellar.org';
  const server = new SorobanRpc.Server(rpcUrl, { allowHttp: false });

  // Use the generated test account
  const testPublicKey = 'GCW2ITW4BYQSZ3LCNWVKODDBRN4YBJQN62LXMV3IFPNEAOB52U2JGOB5';
  const testSecretKey = 'SAQXQZ7HWD2TSKCTN4PYT4EJBQ5KV3XEKYYQY4VW4OGB2CIMQCVXGYTB';
  const testKeypair = Keypair.fromSecret(testSecretKey);

  console.log('\n📋 Testing Contract Functions...');
  console.log('Using account:', testPublicKey);

  try {
    const account = await server.getAccount(testPublicKey);

    // Function names to test for each contract
    const functionTests = [
      {
        contract: contracts.simpleInsurance,
        name: 'SimpleInsurance',
        functions: [
          { name: 'create_policy', args: [nativeToScVal(Address.fromString(testPublicKey), { type: 'address' }), nativeToScVal(1000, { type: 'i128' })] },
          { name: 'get_policy', args: [nativeToScVal(1, { type: 'u32' })] },
          { name: 'get_user_policies', args: [nativeToScVal(Address.fromString(testPublicKey), { type: 'address' })] },
          { name: 'hello', args: [nativeToScVal('test', { type: 'symbol' })] }, // Try hello function
          { name: 'status', args: [] }, // Try status function
          { name: 'version', args: [] } // Try version function
        ]
      },
      {
        contract: contracts.yieldAggregator,
        name: 'YieldAggregator',
        functions: [
          { name: 'deposit', args: [nativeToScVal(Address.fromString(testPublicKey), { type: 'address' }), nativeToScVal(500, { type: 'i128' }), nativeToScVal(30, { type: 'u32' })] },
          { name: 'get_pool_stats', args: [] },
          { name: 'get_deposit', args: [nativeToScVal(1, { type: 'u64' })] },
          { name: 'hello', args: [nativeToScVal('test', { type: 'symbol' })] },
          { name: 'status', args: [] },
          { name: 'version', args: [] }
        ]
      },
      {
        contract: contracts.treasury,
        name: 'Treasury',
        functions: [
          { name: 'create_transfer', args: [nativeToScVal(Address.fromString(testPublicKey), { type: 'address' }), nativeToScVal(Address.fromString(testPublicKey), { type: 'address' }), nativeToScVal(100, { type: 'i128' }), nativeToScVal('test', { type: 'symbol' })] },
          { name: 'get_stats', args: [] },
          { name: 'get_pending_transfers', args: [] },
          { name: 'hello', args: [nativeToScVal('test', { type: 'symbol' })] },
          { name: 'status', args: [] },
          { name: 'version', args: [] }
        ]
      }
    ];

    for (const contractTest of functionTests) {
      console.log(`\n🔍 Testing ${contractTest.name} (${contractTest.contract})`);
      console.log('─'.repeat(60));

      for (const funcTest of contractTest.functions) {
        try {
          const tx = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET,
          })
            .addOperation(Operation.invokeContractFunction({
              contract: contractTest.contract,
              function: funcTest.name,
              args: funcTest.args
            }))
            .setTimeout(30)
            .build();

          const simulation = await server.simulateTransaction(tx);

          if (simulation.success) {
            console.log(`✅ ${funcTest.name}: FUNCTION EXISTS`);
          } else {
            const errorStr = JSON.stringify(simulation.error);
            if (errorStr.includes('not found') || errorStr.includes('invalid') || errorStr.includes('missing')) {
              console.log(`❌ ${funcTest.name}: FUNCTION NOT FOUND`);
            } else {
              console.log(`⚠️  ${funcTest.name}: ERROR - ${errorStr.substring(0, 80)}...`);
            }
          }
        } catch (error) {
          console.log(`❌ ${funcTest.name}: ERROR - ${error.message.substring(0, 80)}...`);
        }
      }
    }

    // Try to get contract information
    console.log('\n📊 Contract Information');
    console.log('─'.repeat(30));

    for (const [name, contractId] of Object.entries(contracts)) {
      console.log(`\n${name}:`);
      console.log(`  Contract ID: ${contractId}`);

      // Check if we can get contract info
      try {
        const contractInfo = await server.getContractData(contractId, xdr.ScValType.ScvLedgerKeyContractCode);
        console.log(`  ✅ Contract data accessible`);
      } catch (error) {
        console.log(`  ⚠️  Contract data not accessible: ${error.message.substring(0, 50)}...`);
      }
    }

    console.log('\n🎯 Debugging Summary:');
    console.log('1. ✅ Account funding and connectivity working');
    console.log('2. 🔍 Function availability tested');
    console.log('3. 📋 Contract accessibility checked');
    console.log('\n📋 Interpret Results:');
    console.log('- ✅ FUNCTION EXISTS: Function is available and working');
    console.log('- ❌ FUNCTION NOT FOUND: Function name might be wrong or not implemented');
    console.log('- ⚠️ ERROR: Function exists but has execution errors');
    console.log('\n🔧 Next Steps:');
    console.log('1. Check if function names match what was deployed');
    console.log('2. Verify contract deployment was successful');
    console.log('3. Test with read-only functions first');

  } catch (error) {
    console.log('❌ Debug script failed:', error.message);
  }
}

// Run the debugging
debugContractFunctions().catch(console.error);