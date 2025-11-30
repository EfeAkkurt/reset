#!/usr/bin/env node

/**
 * Simple test of the Stellar adapter directly
 */

// Force server environment
global.window = undefined;

async function testStellarAdapter() {
  try {
    console.log('🔍 Testing Stellar DefiLlama Adapter directly...');

    // Import the adapter directly
    const { DefiLlamaStellarAdapter } = await import('./packages/adapters/src/protocols/defillama-stellar.ts');

    console.log('📡 DefiLlamaStellarAdapter imported successfully');

    // Create adapter instance
    const adapter = new DefiLlamaStellarAdapter(['blend-pools-v2', 'blend-pools']);

    console.log('🚀 Initializing Stellar adapter...');

    // Test the adapter directly
    const opportunities = await adapter.list();

    console.log(`✅ SUCCESS: Got ${opportunities.length} real Stellar opportunities!`);

    if (opportunities.length > 0) {
      console.log('\n📊 Sample Stellar opportunities:');
      opportunities.slice(0, 5).forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.protocol} - ${opp.pool}`);
        console.log(`   Chain: ${opp.chain}`);
        console.log(`   APR: ${opp.apr}% | APY: ${opp.apy}%`);
        console.log(`   TVL: $${(opp.tvlUsd / 1000000).toFixed(2)}M`);
        console.log(`   Tokens: ${opp.tokens.join(', ')}`);
        console.log(`   Risk: ${opp.risk}`);
        console.log('');
      });

      // Check totals
      const totalTVL = opportunities.reduce((sum, opp) => sum + opp.tvlUsd, 0);
      const avgAPY = opportunities.reduce((sum, opp) => sum + opp.apy, 0) / opportunities.length;

      console.log(`📈 Summary:`);
      console.log(`   Total Opportunities: ${opportunities.length}`);
      console.log(`   Total TVL: $${(totalTVL / 1000000).toFixed(2)}M`);
      console.log(`   Average APY: ${avgAPY.toFixed(2)}%`);

      return true;
    } else {
      console.log('⚠️  No opportunities found');
      return false;
    }

  } catch (error) {
    console.error('❌ FAILED to test Stellar adapter:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testStellarAdapter().then(success => {
  if (success) {
    console.log('\n🎉 Stellar adapter test PASSED - Real data is available!');
    process.exit(0);
  } else {
    console.log('\n💥 Stellar adapter test FAILED');
    process.exit(1);
  }
}).catch(console.error);