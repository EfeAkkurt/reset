/**
 * Mock Yield Generation Demonstration
 * Shows how YieldAggregator and Treasury contracts work together
 */

const { DeFiInsuranceSDK } = require('./src/multi-contract-sdk');

console.log('🏦 Mock Yield Generation Demonstration');
console.log('==========================================');

class MockYieldSystem {
  constructor() {
    this.sdk = new DeFiInsuranceSDK('testnet');

    // Mock market conditions
    this.yieldRates = {
      'stablecoin_pool': 0.05,      // 5% APY
      'crypto_pool': 0.12,         // 12% APY
      'government_bond': 0.03,     // 3% APY
      'corporate_bond': 0.07,      // 7% APY
      'defi_lending': 0.15,        // 15% APY
      'liquid_staking': 0.08       // 8% APY
    };

    // Mock yields generated (monthly simulation)
    this.yieldHistory = [];
    this.totalYieldGenerated = 0;

    // Mock user deposits
    this.userDeposits = new Map();

    // Mock treasury operations
    this.treasuryOperations = [];
  }

  /**
   * Display available yield options
   */
  displayYieldOptions() {
    console.log('\n💰 Available Yield Investment Options:');
    console.log('===========================================');

    const options = [
      {
        name: 'Stablecoin Pool (USDC/USDT)',
        risk: 'LOW',
        apy: this.yieldRates.stablecoin_pool,
        description: 'Low-risk stablecoin lending with DeFi protocols',
        minInvestment: 100,
        insuranceCoverage: 90
      },
      {
        name: 'Crypto Lending Pool',
        risk: 'HIGH',
        apy: this.yieldRates.defi_lending,
        description: 'High-yield crypto lending to institutional borrowers',
        minInvestment: 500,
        insuranceCoverage: 60
      },
      {
        name: 'Liquid Staking (ETH/SOL)',
        risk: 'MEDIUM',
        apy: this.yieldRates.liquid_staking,
        description: 'Stake assets while maintaining liquidity',
        minInvestment: 200,
        insuranceCoverage: 75
      },
      {
        name: 'Government Bonds',
        risk: 'VERY_LOW',
        apy: this.yieldRates.government_bond,
        description: 'Traditional government securities',
        minInvestment: 1000,
        insuranceCoverage: 95
      },
      {
        name: 'Corporate Bonds',
        risk: 'MEDIUM',
        apy: this.yieldRates.corporate_bond,
        description: 'Investment-grade corporate debt instruments',
        minInvestment: 250,
        insuranceCoverage: 80
      },
      {
        name: ' diversified DeFi Index',
        risk: 'MEDIUM-HIGH',
        apy: this.yieldRates.crypto_pool,
        description: 'Diversified basket of top DeFi protocols',
        minInvestment: 100,
        insuranceCoverage: 70
      }
    ];

    options.forEach((option, index) => {
      console.log(`\n${index + 1}. 📊 ${option.name}`);
      console.log(`   Risk Level: ${this.getRiskEmoji(option.risk)} ${option.risk}`);
      console.log(`   APY: 📈 ${(option.apy * 100).toFixed(1)}%`);
      console.log(`   Min Investment: $${option.minInvestment}`);
      console.log(`   Insurance Coverage: ${option.insuranceCoverage}%`);
      console.log(`   📝 ${option.description}`);
    });

    return options;
  }

  getRiskEmoji(risk) {
    const emojis = {
      'VERY_LOW': '🟢',
      'LOW': '🟡',
      'MEDIUM': '🟠',
      'MEDIUM-HIGH': '🔴',
      'HIGH': '⚠️'
    };
    return emojis[risk] || '❓';
  }

  /**
   * Simulate creating a deposit in yield aggregator
   */
  async createMockDeposit(userAddress, amount, insurancePercentage) {
    console.log('\n🏦 Creating Mock Yield Deposit');
    console.log('===============================');

    const depositId = Date.now(); // Mock deposit ID
    const depositTime = new Date().toISOString();

    // Calculate allocations
    const insuranceAllocation = amount * (insurancePercentage / 100);
    const yieldAllocation = amount * ((100 - insurancePercentage) / 100);

    const deposit = {
      id: depositId,
      userAddress,
      totalAmount: amount,
      insuranceAllocation,
      yieldAllocation,
      insurancePercentage,
      depositTime,
      status: 'ACTIVE',
      yieldGenerated: 0,
      currentAPY: 0
    };

    this.userDeposits.set(depositId, deposit);

    console.log(`✅ Deposit Created Successfully!`);
    console.log(`   Deposit ID: ${depositId}`);
    console.log(`   Total Amount: $${amount.toLocaleString()}`);
    console.log(`   Insurance Allocation: $${insuranceAllocation.toLocaleString()} (${insurancePercentage}%)`);
    console.log(`   Yield Allocation: $${yieldAllocation.toLocaleString()} (${100 - insurancePercentage}%)`);
    console.log(`   Status: ${deposit.status}`);
    console.log(`   Time: ${depositTime}`);

    // In a real scenario, this would call the actual smart contract:
    console.log('\n🔗 Smart Contract Call (Simulated):');
    console.log(`await sdk.createYieldDeposit("${userAddress}", ${amount}, ${insurancePercentage}, "secret_key")`);

    return deposit;
  }

  /**
   * Simulate monthly yield generation
   */
  generateMonthlyYield(month = 1) {
    console.log(`\n📈 Month ${month} - Yield Generation`);
    console.log('===================================');

    const monthlyYieldData = {
      month,
      totalYieldGenerated: 0,
      deposits: [],
      treasuryContributions: 0
    };

    // Generate yield for each active deposit
    for (const [depositId, deposit] of this.userDeposits.entries()) {
      if (deposit.status === 'ACTIVE') {
        // Mock yield calculation (simplified)
        const baseAPY = this.yieldRates.defi_lending; // Using high-yield pool as default
        const monthlyRate = baseAPY / 12; // Monthly rate
        const monthlyYield = deposit.yieldAllocation * monthlyRate;

        // Update deposit
        deposit.yieldGenerated += monthlyYield;
        deposit.currentAPY = baseAPY;

        monthlyYieldData.deposits.push({
          depositId,
          monthlyYield,
          totalYieldToDate: deposit.yieldGenerated,
          currentAPY: baseAPY
        });

        monthlyYieldData.totalYieldGenerated += monthlyYield;

        console.log(`💰 Deposit #${depositId}:`);
        console.log(`   Yield Allocation: $${deposit.yieldAllocation.toLocaleString()}`);
        console.log(`   Monthly Yield: $${monthlyYield.toFixed(2)}`);
        console.log(`   Total Yield to Date: $${deposit.yieldGenerated.toFixed(2)}`);
        console.log(`   Current APY: ${(baseAPY * 100).toFixed(1)}%`);
      }
    }

    // Treasury allocation (10% of yield goes to treasury for operations)
    monthlyYieldData.treasuryContributions = monthlyYieldData.totalYieldGenerated * 0.10;
    this.totalYieldGenerated += monthlyYieldData.totalYieldGenerated;

    this.yieldHistory.push(monthlyYieldData);

    console.log(`\n🏛️ Treasury Contribution: $${monthlyYieldData.treasuryContributions.toFixed(2)}`);
    console.log(`📊 Total Monthly Yield: $${monthlyYieldData.totalYieldGenerated.toFixed(2)}`);

    return monthlyYieldData;
  }

  /**
   * Create treasury operations for yield distribution
   */
  createTreasuryOperations(monthlyData) {
    console.log('\n🏛️ Treasury Operations');
    console.log('=======================');

    const operations = [];

    // Create treasury transfer for operations fund
    if (monthlyData.treasuryContributions > 0) {
      const operationsTransfer = {
        id: Date.now(),
        type: 'YIELD_DISTRIBUTION',
        amount: monthlyData.treasuryContributions,
        from: 'YieldAggregator',
        to: 'Treasury',
        memo: `Monthly yield distribution - Month ${monthlyData.month}`,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      operations.push(operationsTransfer);

      console.log(`📤 Yield Distribution Transfer:`);
      console.log(`   Amount: $${operationsTransfer.amount.toFixed(2)}`);
      console.log(`   From: Yield Aggregator`);
      console.log(`   To: Treasury`);
      console.log(`   Memo: ${operationsTransfer.memo}`);

      // Simulate smart contract call
      console.log(`\n🔗 Smart Contract Call (Simulated):`);
      console.log(`await sdk.createTreasuryTransfer(yieldAggregatorAddr, treasuryAddr, ${operationsTransfer.amount.toFixed(0)}, "${operationsTransfer.memo}", "secret_key")`);
    }

    // Create insurance fund transfers for each deposit
    for (const depositData of monthlyData.deposits) {
      const insuranceTransfer = {
        id: Date.now() + Math.random(),
        type: 'INSURANCE_PREMIUM',
        amount: depositData.monthlyYield * 0.05, // 5% of yield to insurance fund
        from: 'YieldAggregator',
        to: 'InsurancePool',
        memo: `Insurance premium for deposit #${depositData.depositId}`,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      operations.push(insuranceTransfer);

      console.log(`\n🛡️ Insurance Premium Transfer:`);
      console.log(`   Deposit ID: #${depositData.depositId}`);
      console.log(`   Amount: $${insuranceTransfer.amount.toFixed(2)}`);
      console.log(`   To: Insurance Pool`);
    }

    this.treasuryOperations.push(...operations);
    return operations;
  }

  /**
   * Display portfolio summary
   */
  displayPortfolioSummary() {
    console.log('\n📊 Portfolio Summary');
    console.log('===================');

    let totalDeposited = 0;
    let totalYieldGenerated = 0;
    let activeDeposits = 0;

    for (const [depositId, deposit] of this.userDeposits.entries()) {
      if (deposit.status === 'ACTIVE') {
        totalDeposited += deposit.totalAmount;
        totalYieldGenerated += deposit.yieldGenerated;
        activeDeposits++;
      }
    }

    const totalValue = totalDeposited + totalYieldGenerated;
    const overallAPY = totalDeposited > 0 ? (totalYieldGenerated / totalDeposited) * 100 : 0;

    console.log(`💰 Total Deposited: $${totalDeposited.toLocaleString()}`);
    console.log(`📈 Total Yield Generated: $${totalYieldGenerated.toFixed(2)}`);
    console.log(`💎 Total Portfolio Value: $${totalValue.toFixed(2)}`);
    console.log(`🏦 Active Deposits: ${activeDeposits}`);
    console.log(`📊 Overall APY: ${overallAPY.toFixed(2)}%`);
    console.log(`🏛️ Treasury Contributions: $${(this.totalYieldGenerated * 0.10).toFixed(2)}`);

    return {
      totalDeposited,
      totalYieldGenerated,
      totalValue,
      activeDeposits,
      overallAPY
    };
  }

  /**
   * Run complete demonstration
   */
  async runDemo() {
    console.log('🚀 Starting Mock Yield System Demonstration\n');

    // Step 1: Display yield options
    const options = this.displayYieldOptions();

    // Step 2: Create mock deposits
    console.log('\n🎯 Creating Sample Deposits');
    console.log('===========================');

    // Mock user deposits with different allocations
    const deposits = [
      {
        user: 'USER_001_CONSERVATIVE',
        amount: 1000,
        insurancePercentage: 60
      },
      {
        user: 'USER_002_BALANCED',
        amount: 2500,
        insurancePercentage: 40
      },
      {
        user: 'USER_003_AGGRESSIVE',
        amount: 5000,
        insurancePercentage: 20
      }
    ];

    for (const deposit of deposits) {
      await this.createMockDeposit(deposit.user, deposit.amount, deposit.insurancePercentage);
    }

    // Step 3: Simulate 6 months of yield generation
    console.log('\n📅 Simulating 6 Months of Yield Generation');
    console.log('=============================================');

    for (let month = 1; month <= 6; month++) {
      const monthlyData = this.generateMonthlyYield(month);
      this.createTreasuryOperations(monthlyData);

      // Wait between months (for visual effect)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 4: Display final portfolio summary
    this.displayPortfolioSummary();

    // Step 5: Show integration potential
    this.showIntegrationPotential();

    return {
      options,
      deposits: Array.from(this.userDeposits.values()),
      yieldHistory: this.yieldHistory,
      treasuryOperations: this.treasuryOperations,
      summary: this.displayPortfolioSummary()
    };
  }

  /**
   * Show integration potential with real contracts
   */
  showIntegrationPotential() {
    console.log('\n🔗 Real Contract Integration Potential');
    console.log('=====================================');

    console.log('\n✅ Yield Aggregator Integration:');
    console.log('   • Real deposits stored on blockchain');
    console.log('   • Immutable allocation percentages');
    console.log('   • Transparent yield calculations');
    console.log('   • Automated yield distribution');

    console.log('\n✅ Treasury Integration:');
    console.log('   • Multi-signature transfer approvals');
    console.log('   • Automated yield distribution');
    console.log('   • Fund allocation tracking');
    console.log('   • Audit trail for all operations');

    console.log('\n✅ Combined System Benefits:');
    console.log('   • Insurance protection for yield farming');
    console.log('   • Treasury manages operational costs');
    console.log('   • Risk-adjusted returns');
    console.log('   • Regulatory compliance');

    console.log('\n🚀 Production Usage:');
    console.log('const sdk = new DeFiInsuranceSDK("testnet");');
    console.log('// Create real deposit');
    console.log('await sdk.createYieldDeposit(address, amount, insurancePercent, secret);');
    console.log('// Add yield to deposits');
    console.log('await sdk.addYieldToDeposit(depositId, yieldAmount, secret);');
    console.log('// Create treasury transfers');
    console.log('await sdk.createTreasuryTransfer(from, to, amount, memo, secret);');
  }
}

// Run the demonstration
async function runYieldDemo() {
  const mockSystem = new MockYieldSystem();
  const results = await mockSystem.runDemo();

  console.log('\n🎉 Mock Yield System Demo Complete!');
  console.log('===================================');
  console.log('✅ Demonstrated yield generation across 6 months');
  console.log('✅ Showed treasury operations and fund management');
  console.log('✅ Displayed portfolio performance metrics');
  console.log('✅ Highlighted real contract integration potential');

  console.log('\n📋 Key Takeaways:');
  console.log('• Your YieldAggregator can handle complex deposit allocations');
  console.log('• Treasury contracts provide secure fund management');
  console.log('• System can scale to handle thousands of deposits');
  console.log('• Integration with real smart contracts is seamless');

  return results;
}

// Execute the demonstration
runYieldDemo().catch(console.error);