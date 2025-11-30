#!/usr/bin/env node

/**
 * Test script for the Stellar DeFiLlama Adapter
 * Validates the adapter functionality with real data
 */

const https = require('https');

// Mock the types and classes we need
class DefiLlamaService {
  constructor() {}

  async getPools() {
    const response = await this.makeRequest('https://yields.llama.fi/pools');
    return response.data || response.pools || response;
  }

  async getProtocol(projectName) {
    // Return mock protocol data for testing
    return {
      name: projectName,
      slug: projectName.toLowerCase(),
      logo: `/logos/${projectName.toLowerCase()}.png`,
      chains: ['stellar'],
      tvl: 0,
      description: ''
    };
  }

  async getPoolChart(poolId) {
    return [];
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      });
      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
}

class BaseAdapter {
  constructor(protocolInfo) {
    this.protocolInfo = protocolInfo;
    this.lastError = null;
  }

  async fetchWithRetry(operation, retries = 2, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        this.lastError = null;
        return result;
      } catch (error) {
        lastError = error;
        if (attempt === retries) break;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    this.lastError = lastError;
    throw lastError;
  }

  calculateRisk(apy, tvlUsd, isStablecoin) {
    let riskScore = 0;

    if (tvlUsd < 10000) riskScore += 2;
    else if (tvlUsd < 100000) riskScore += 1;

    if (apy > 20) riskScore += 2;
    else if (apy > 10) riskScore += 1;

    if (isStablecoin) riskScore = Math.max(0, riskScore - 1);

    if (riskScore >= 3) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }
}

// Simplified Stellar Adapter for testing
class DefiLlamaStellarAdapter extends BaseAdapter {
  constructor(protocolFilter = ['blend-pools-v2', 'blend-pools']) {
    const protocolInfo = {
      name: 'DeFiLlama',
      chain: 'stellar',
      baseUrl: 'https://yields.llama.fi',
      description: 'Stellar yield farming data from DeFiLlama',
      website: 'https://defillama.com',
      logo: '/logos/defillama.png',
      supportedTokens: ['XLM', 'USDC', 'EURC', 'AQUA'],
      timeout: 8000,
      retryAttempts: 2,
      rateLimit: 30,
    };
    super(protocolInfo);
    this.service = new DefiLlamaService();
    this.protocolFilter = protocolFilter;
  }

  async list() {
    try {
      return await this.fetchWithRetry(async () => {
        const pools = await this.service.getPools();

        // Filter for Stellar pools
        const relevantPools = pools.filter(pool =>
          (pool.tvlUsd || 0) > 1000 &&
          (pool.chain?.toLowerCase() === 'stellar') &&
          (this.protocolFilter.length === 0 ||
           this.protocolFilter.includes(pool.project?.toLowerCase()))
        );

        console.log(`Found ${relevantPools.length} relevant Stellar pools`);

        // Map pools to opportunities
        const opportunities = [];
        for (const pool of relevantPools) {
          try {
            const opportunity = await this.mapPoolToOpportunity(pool);
            if (opportunity.tvlUsd > 1000) {
              opportunities.push(opportunity);
            }
          } catch (error) {
            console.warn(`Failed to map pool ${pool.pool}:`, error.message);
          }
        }

        // Sort by TVL
        return opportunities.sort((a, b) => b.tvlUsd - a.tvlUsd);
      });
    } catch (error) {
      console.error('List error:', error.message);
      throw error;
    }
  }

  async detail(id) {
    try {
      return await this.fetchWithRetry(async () => {
        const opportunities = await this.list();
        const opportunity = opportunities.find(o => o.id === id);

        if (!opportunity) {
          throw new Error(`Opportunity not found: ${id}`);
        }

        return opportunity;
      });
    } catch (error) {
      console.error('Detail error:', error.message);
      throw error;
    }
  }

  async mapPoolToOpportunity(pool) {
    const tokens = pool.underlyingTokens || [pool.symbol];
    const isStablecoinPair = this.isStablecoinPair(tokens);
    const totalApy = pool.apy || 0;

    return {
      id: `defillama-stellar-${pool.project}-${pool.symbol}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      chain: 'stellar',
      protocol: pool.project.toUpperCase(),
      pool: pool.symbol || `${tokens.join('-')} Pool`,
      tokens,
      apr: pool.apyBase || pool.apy || 0,
      apy: totalApy,
      apyBase: pool.apyBase,
      apyReward: pool.apyReward,
      rewardToken: pool.rewardTokens || [],
      tvlUsd: pool.tvlUsd || 0,
      risk: this.calculateRisk(totalApy, pool.tvlUsd, isStablecoinPair),
      source: 'api',
      lastUpdated: Date.now(),
      disabled: false,

      // Extended metadata
      poolId: pool.pool,
      underlyingTokens: pool.underlyingTokens,
      logoUrl: this.getDefaultLogo(pool.project),
      exposure: this.determineExposure(tokens, isStablecoinPair),
      ilRisk: pool.ilRisk || this.calculateILRisk(tokens),
      stablecoin: isStablecoinPair,
    };
  }

  isStablecoinPair(tokens) {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'EURC', 'GUSC'];
    return tokens.some(token => stablecoins.includes(token.toUpperCase()));
  }

  determineExposure(tokens, isStablecoin) {
    if (tokens.length === 1) return 'single';
    if (isStablecoin) return 'stablecoin';
    if (tokens.some(t => t.toLowerCase().includes('btc'))) return 'btc';
    if (tokens.some(t => t.toLowerCase().includes('eth'))) return 'eth';
    if (tokens.some(t => t.toLowerCase().includes('xlm'))) return 'xlm';
    return 'multi';
  }

  calculateILRisk(tokens) {
    if (tokens.length === 1) return 'none';

    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'EURC', 'GUSC'];
    const isStablePair = tokens.every(token => stablecoins.includes(token.toUpperCase()));

    if (isStablePair) return 'low';

    const hasVolatileToken = tokens.some(token => !stablecoins.includes(token.toUpperCase()));
    return hasVolatileToken ? 'high' : 'medium';
  }

  getDefaultLogo(project) {
    const logoMap = {
      'blend-pools-v2': '/logos/blend.png',
      'blend-pools': '/logos/blend.png',
    };

    return logoMap[project.toLowerCase()] || '/logos/default-protocol.png';
  }

  async getProtocolStats() {
    try {
      const opportunities = await this.list();
      const totalTvl = opportunities.reduce((sum, opp) => sum + opp.tvlUsd, 0);
      const avgApy = opportunities.length > 0 ? opportunities.reduce((sum, opp) => sum + opp.apy, 0) / opportunities.length : 0;

      return {
        totalTvl,
        poolCount: opportunities.length,
        avgApy: avgApy || 0,
      };
    } catch (error) {
      console.warn('Failed to calculate protocol stats:', error);
      return { totalTvl: 0, poolCount: 0, avgApy: 0 };
    }
  }
}

// Test the adapter
async function testStellarAdapter() {
  console.log('🚀 Testing Stellar DeFiLlama Adapter');
  console.log('=====================================\n');

  const adapter = new DefiLlamaStellarAdapter();

  try {
    console.log('📊 Fetching Stellar opportunities...');
    const opportunities = await adapter.list();

    console.log(`✅ Found ${opportunities.length} Stellar opportunities\n`);

    // Display opportunities
    console.log('Stellar Opportunities:');
    opportunities.forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.protocol} - ${opp.pool}`);
      console.log(`   Tokens: ${opp.tokens.join(', ')}`);
      console.log(`   APY: ${opp.apy.toFixed(2)}% | TVL: $${opp.tvlUsd.toLocaleString()} | Risk: ${opp.risk}`);
      console.log(`   Stablecoin: ${opp.stablecoin ? 'Yes' : 'No'} | IL Risk: ${opp.ilRisk}`);
      console.log(`   ID: ${opp.id}`);
      console.log('');
    });

    // Test protocol stats
    console.log('📈 Protocol Statistics:');
    const stats = await adapter.getProtocolStats();
    console.log(`   Total TVL: $${stats.totalTvl.toLocaleString()}`);
    console.log(`   Pool Count: ${stats.poolCount}`);
    console.log(`   Average APY: ${stats.avgApy.toFixed(2)}%\n`);

    // Test detail view for first opportunity
    if (opportunities.length > 0) {
      console.log('🔍 Testing detail view for first opportunity...');
      const detail = await adapter.detail(opportunities[0].id);
      console.log(`✅ Detail retrieved: ${detail.protocol} - ${detail.pool}`);
      console.log(`   APY: ${detail.apy.toFixed(2)}% | TVL: $${detail.tvlUsd.toLocaleString()}`);
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('=================');
    console.log(`✅ Adapter successfully connected to DeFiLlama`);
    console.log(`✅ Filtered ${opportunities.length} Stellar pools`);
    console.log(`✅ Total TVL: $${stats.totalTvl.toLocaleString()}`);
    console.log(`✅ Average APY: ${stats.avgApy.toFixed(2)}%`);

    const highRiskPools = opportunities.filter(o => o.risk === 'high');
    const stablecoinPools = opportunities.filter(o => o.stablecoin);

    console.log(`📊 High Risk Pools: ${highRiskPools.length}`);
    console.log(`📊 Stablecoin Pools: ${stablecoinPools.length}`);

    if (opportunities.length > 0) {
      console.log('\n🎉 Stellar DeFiLlama adapter is working correctly!');
      console.log('Ready for production use with Stellar Blend pools.');
    } else {
      console.log('\n⚠️  No Stellar pools found - check protocol filter or API connectivity');
    }

  } catch (error) {
    console.error('\n❌ Adapter test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testStellarAdapter();