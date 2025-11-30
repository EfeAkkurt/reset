/**
 * Quick Test - Just run this to verify your SDK works
 */

console.log('🚀 Quick TypeScript SDK Test');
console.log('============================');

const { SmartContractSDK } = require('./src/index.js');

async function quickTest() {
  try {
    // Initialize SDK with your deployed contract
    const sdk = new SmartContractSDK(
      "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD",
      "testnet"
    );

    console.log('✅ SDK initialized successfully');
    console.log('✅ Contract ID: CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD');
    console.log('✅ Network: Stellar Testnet');

    // Use existing funded test account
    const testAddress = "GAM5TWLK6TMPCVXOGOXER5KSFV4XDVFHBQZQSAAAGUZCMBDCEM3GCQ3A";

    console.log('\n📝 Testing create_policy...');
    const policyId = await sdk.createPolicy(testAddress, 1000);
    console.log('✅ Policy created:', policyId);

    console.log('\n👥 Testing get_user_policies...');
    const policies = await sdk.getUserPolicies(testAddress);
    console.log('✅ User policies:', policies);

    console.log('\n🎯 TEST COMPLETE! 🎉');
    console.log('Your TypeScript SDK is working perfectly!');
    console.log('\n💻 Usage Example:');
    console.log('```javascript');
    console.log('const { SmartContractSDK } = require("./src/index.js");');
    console.log('const sdk = new SmartContractSDK("CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD", "testnet");');
    console.log('const policyId = await sdk.createPolicy(userAddress, amount);');
    console.log('```');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('1. Run `npm install` in packages/sdk directory');
    console.log('2. Internet connection for testnet access');
    console.log('3. The contract is still deployed on testnet');
  }
}

quickTest();