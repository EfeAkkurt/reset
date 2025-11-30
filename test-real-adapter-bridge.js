#!/usr/bin/env node

/**
 * Test the real data adapter bridge to diagnose the issue
 */

// Mock the browser environment detection to force server mode
global.window = undefined;

async function testRealDataAdapter() {
  try {
    console.log('🔍 Testing Real Data Adapter Bridge...');

    // Import and test the real data adapter
    const { realDataAdapter } = await import('./apps/web/lib/adapters/real.ts');

    console.log('📡 Real data adapter imported successfully');

    // Test fetching opportunities
    const opportunities = await realDataAdapter.fetchOpportunities();

    console.log(`✅ Successfully fetched ${opportunities.length} opportunities`);

    if (opportunities.length > 0) {
      console.log('\n📊 Sample opportunities:');
      opportunities.slice(0, 3).forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.protocol} - ${opp.pair}`);
        console.log(`   Chain: ${opp.chain}`);
        console.log(`   APR: ${opp.apr}% | APY: ${opp.apy}%`);
        console.log(`   TVL: $${(opp.tvlUsd / 1000000).toFixed(2)}M`);
        console.log(`   Risk: ${opp.risk}`);
        console.log(`   Source: ${opp.source}`);
        console.log('');
      });

      // Check if these are real or mock opportunities
      const realOpportunities = opportunities.filter(opp => opp.source === 'live');
      const mockOpportunities = opportunities.filter(opp => opp.source === 'demo');

      console.log(`📈 Data Source Breakdown:`);
      console.log(`   Live (Real) Opportunities: ${realOpportunities.length}`);
      console.log(`   Demo (Mock) Opportunities: ${mockOpportunities.length}`);

      if (realOpportunities.length > 0) {
        console.log('✅ SUCCESS: Real data is being served!');
        console.log('\n🎯 Real Opportunities:');
        realOpportunities.forEach((opp, index) => {
          console.log(`${index + 1}. ${opp.protocol} - ${opp.pair} (${opp.chain})`);
        });
      } else {
        console.log('❌ ISSUE: Only mock data is being served');
        console.log('   This suggests the real adapter is encountering an error');
      }

    } else {
      console.log('⚠️  No opportunities returned');
    }

  } catch (error) {
    console.error('❌ FAILED to test real data adapter:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testRealDataAdapter().catch(console.error);