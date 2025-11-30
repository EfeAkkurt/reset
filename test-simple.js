/**
 * Simple Local Network Test
 * Tests if the basic setup is working without contract deployment
 */

const http = require('http');

// Test local network connection
async function testNetworkHealth() {
  console.log('🔍 Testing Local Soroban Network...');

  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log('✅ Network Health:', health);
          resolve(true);
        } catch (e) {
          console.error('❌ Invalid health response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Network not accessible:', e.message);
      resolve(false);
    });

    req.end();
  });
}

// Test friendbot
async function testFriendbot() {
  console.log('💰 Testing Friendbot...');
  const testAddress = 'GCITVW36R7XQ6VA67TI6J3636HJWX6ZGGZM5MWU55GEGN4IGZABYYYJK';

  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: `/friendbot?addr=${testAddress}`,
      method: 'POST'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Friendbot accessible');
          resolve(true);
        } else if (res.statusCode === 400) {
          try {
            const response = JSON.parse(data);
            if (response.detail === 'account already funded to starting balance') {
              console.log('✅ Friendbot accessible (account already funded)');
              resolve(true);
            } else {
              console.log('⚠️  Friendbot returned:', response.detail);
              resolve(false);
            }
          } catch (e) {
            console.error('❌ Invalid friendbot response:', data);
            resolve(false);
          }
        } else {
          console.error('❌ Friendbot error:', res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Friendbot not accessible:', e.message);
      resolve(false);
    });

    req.end();
  });
}

// Test WASM file
function testWasmFile() {
  console.log('📦 Checking WASM file...');
  const fs = require('fs');
  const wasmPath = './packages/contracts/target/wasm32-unknown-unknown/release/contracts.wasm';

  if (fs.existsSync(wasmPath)) {
    const stats = fs.statSync(wasmPath);
    console.log('✅ WASM file found:', wasmPath);
    console.log('   Size:', stats.size, 'bytes');
    return true;
  } else {
    console.error('❌ WASM file not found:', wasmPath);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Simple Local Environment Test');
  console.log('===================================');

  const results = [];

  // Test network health
  const networkOk = await testNetworkHealth();
  results.push({ test: 'Network Health', passed: networkOk });

  // Test friendbot
  const friendbotOk = await testFriendbot();
  results.push({ test: 'Friendbot', passed: friendbotOk });

  // Test WASM file
  const wasmOk = testWasmFile();
  results.push({ test: 'WASM File', passed: wasmOk });

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('=========================');

  let allPassed = true;
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (!result.passed) allPassed = false;
  });

  if (allPassed) {
    console.log('\n🎉 All tests passed! Your local environment is ready.');
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy contract via Soroban Laboratory');
    console.log('   URL: https://laboratory.stellar.org/#soroban');
    console.log('   RPC URL: http://localhost:8000/soroban/rpc');
    console.log('   Network Passphrase: Standalone Network ; February 2017');
    console.log('   WASM File: ./packages/contracts/target/wasm32-unknown-unknown/release/contracts.wasm');
    console.log('\n2. After deployment, update CONTRACT_ID in test-local-contract.js');
    console.log('3. Run contract tests from packages/sdk directory where dependencies are available');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run the tests
runTests().catch(console.error);