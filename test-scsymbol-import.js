#!/usr/bin/env node

/**
 * Test script to verify the ScSymbol import and constructor approach
 */

console.log('🔧 Testing ScSymbol import and constructor approach...');

try {
  // Test different import approaches

  // Approach 1: Direct import from stellar-base
  console.log('\n📦 Testing approach 1: Direct import from stellar-base');
  try {
    const { ScSymbol, xdr } = require('@stellar/stellar-base');

    const testMethod = 'deposit';
    const symbol = new ScSymbol(Buffer.from(testMethod));

    console.log('✅ ScSymbol imported successfully');
    console.log('✅ ScSymbol constructor works');
    console.log(`✅ Created symbol for method: ${testMethod}`);

    // Test if it works in the context we need it
    const contractScAddress = "test_address";
    const functionName = new ScSymbol(Buffer.from(testMethod));
    const invokeArgs = new xdr.InvokeContractArgs({
      contractAddress: contractScAddress,
      functionName: functionName,
      args: []
    });

    console.log('✅ ScSymbol works in InvokeContractArgs');
    console.log('🎉 Approach 1 SUCCESSFUL!');

  } catch (error1) {
    console.log('❌ Approach 1 failed:', error1.message);

    // Approach 2: Using xdr.ScSymbol as before
    console.log('\n📦 Testing approach 2: xdr.ScSymbol');
    try {
      const { xdr } = require('@stellar/stellar-base');

      const testMethod = 'deposit';

      // Check if ScSymbol is available as a constructor
      if (typeof xdr.ScSymbol === 'function') {
        const symbol = new xdr.ScSymbol(Buffer.from(testMethod));
        console.log('✅ xdr.ScSymbol constructor works');
        console.log('🎉 Approach 2 SUCCESSFUL!');
      } else {
        console.log('❌ xdr.ScSymbol is not a constructor');
        console.log('Type of xdr.ScSymbol:', typeof xdr.ScSymbol);

        // Approach 3: Try fromString method
        console.log('\n📦 Testing approach 3: ScSymbol.fromString');
        if (typeof xdr.ScSymbol === 'object' && xdr.ScSymbol.fromString) {
          const symbol = xdr.ScSymbol.fromString(testMethod);
          console.log('✅ xdr.ScSymbol.fromString works');
          console.log('🎉 Approach 3 SUCCESSFUL!');
        } else {
          console.log('❌ xdr.ScSymbol.fromString not available');
        }
      }

    } catch (error2) {
      console.log('❌ Approach 2 failed:', error2.message);
    }
  }

  console.log('\n📋 Available exports from @stellar/stellar-base:');
  const stellarBase = require('@stellar/stellar-base');
  const xdrKeys = Object.keys(stellarBase).filter(key => key.toLowerCase().includes('symbol'));
  console.log('Symbol-related exports:', xdrKeys);

} catch (error) {
  console.error('❌ Overall test failed:', error.message);
  process.exit(1);
}