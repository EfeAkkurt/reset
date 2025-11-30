import { Adapter, Opportunity, ProtocolInfo } from '../types';
import { BaseAdapter } from './base-adapter';
import { DefiLlamaService } from '../services/defillama';
import { LlamaPool } from '../types/defillama';

export class DefiLlamaStellarAdapter extends BaseAdapter {
  private service: DefiLlamaService;
  private protocolFilter: string[];

  constructor(protocolFilter: string[] = ['blend-pools-v2', 'blend-pools']) {
    const protocolInfo: ProtocolInfo = {
      name: 'DeFiLlama',
      chain: 'stellar',
      baseUrl: 'https://yields.llama.fi',
      description: 'Stellar yield farming data from DeFiLlama',
      website: 'https://defillama.com',
      logo: '/logos/defillama.png',
      supportedTokens: ['XLM', 'USDC', 'EURC', 'AQUA'],
      rateLimit: 30, // 30 requests per minute
      retryAttempts: 2,
      timeout: 8000,
    };
    super(protocolInfo);
    this.service = new DefiLlamaService();
    this.protocolFilter = protocolFilter;
  }

  async list(): Promise<Opportunity[]> {
    try {
      return await this.fetchWithRetry(async () => {
        // Use your existing DefiLlamaService with the working getPoolsByChain method
        const pools = await this.service.getPoolsByChain('stellar');

        // Filter by protocol if specified
        const filteredPools = this.protocolFilter.length === 0
          ? pools
          : pools.filter(pool =>
              this.protocolFilter.includes(pool.project?.toLowerCase())
            );

        // Filter by minimum TVL
        const relevantPools = filteredPools.filter(
          pool => (pool.tvlUsd || 0) > 1000 // $1,000 minimum TVL
        );

        console.log(`DefiLlama Stellar: Found ${relevantPools.length} pools from ${pools.length} total Stellar pools`);

        // Map pools to opportunities using your established pattern
        const opportunities = await Promise.allSettled(
          relevantPools.map(pool => this.mapPoolToOpportunity(pool))
        );

        // Filter out failed mappings and sort by TVL
        const validOpportunities = opportunities
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<Opportunity>).value)
          .filter(opportunity => opportunity.tvlUsd > 1000) // Filter low liquidity
          .sort((a, b) => b.tvlUsd - a.tvlUsd);

        return validOpportunities;
      });
    } catch (error) {
      this.handleError(error, 'list');
    }
  }

  async detail(id: string): Promise<Opportunity> {
    try {
      return await this.fetchWithRetry(async () => {
        // Get all opportunities and find by exact ID match
        const opportunities = await this.list();
        const opportunity = opportunities.find(o => o.id === id);

        if (!opportunity) {
          throw new Error(`Opportunity not found: ${id}`);
        }

        return opportunity;
      });
    } catch (error) {
      this.handleError(error, 'detail');
    }
  }

  async getChartData(poolId: string) {
    try {
      return await this.service.getPoolChart(poolId);
    } catch (error) {
      console.warn(`Chart data unavailable for pool ${poolId}:`, error);
      return [];
    }
  }

  private async mapPoolToOpportunity(pool: LlamaPool): Promise<Opportunity> {
    // Fetch protocol information for logo using your existing service
    let logoUrl = '';
    try {
      const protocol = await this.service.getProtocol(pool.project);
      logoUrl = protocol.logo;
    } catch {
      // Use default logo mapping if API call fails
      logoUrl = this.getDefaultLogo(pool.project);
    }

    const tokens = pool.underlyingTokens || [pool.symbol];
    const isStablecoinPair = this.isStablecoinPair(tokens);
    const totalApy = pool.apy || 0;

    return {
      id: this.createOpportunityId(pool.project, pool.symbol),
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
      risk: this.calculateRisk(pool.apyBase || pool.apy || 0, pool.tvlUsd, isStablecoinPair),
      source: 'api',
      lastUpdated: Date.now(),
      disabled: false,

      // Extended metadata following your established pattern
      poolId: pool.pool,
      underlyingTokens: pool.underlyingTokens,
      logoUrl,
      exposure: this.determineExposure(tokens, isStablecoinPair),
      ilRisk: pool.ilRisk || this.calculateILRisk(tokens),
      stablecoin: isStablecoinPair,
    };
  }

  private isStablecoinPair(tokens: string[]): boolean {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'EURC', 'GUSC'];
    return tokens.some(token =>
      stablecoins.includes(token.toUpperCase())
    );
  }

  private determineExposure(tokens: string[], isStablecoin: boolean): string {
    if (tokens.length === 1) return 'single';
    if (isStablecoin) return 'stablecoin';
    if (tokens.some(t => t.toLowerCase().includes('btc'))) return 'btc';
    if (tokens.some(t => t.toLowerCase().includes('eth'))) return 'eth';
    if (tokens.some(t => t.toLowerCase().includes('xlm'))) return 'xlm';
    return 'multi';
  }

  private calculateILRisk(tokens: string[]): string {
    if (tokens.length === 1) return 'none';

    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'EURC', 'GUSC'];
    const isStablePair = tokens.every(token =>
      stablecoins.includes(token.toUpperCase())
    );

    if (isStablePair) return 'low';

    const hasVolatileToken = tokens.some(token =>
      !stablecoins.includes(token.toUpperCase())
    );

    return hasVolatileToken ? 'high' : 'medium';
  }

  private getDefaultLogo(project: string): string {
    const logoMap: Record<string, string> = {
      'blend-pools-v2': '/logos/blend.png',
      'blend-pools': '/logos/blend.png',
    };

    return logoMap[project.toLowerCase()] || '/logos/default-protocol.png';
  }
}