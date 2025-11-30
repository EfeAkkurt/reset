import { LlamaPool, LlamaProtocol } from '../types/defillama';

export class DefiLlamaService {
  private readonly baseUrl = 'https://yields.llama.fi';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getPools(): Promise<LlamaPool[]> {
    return this.fetchWithCache('pools', `${this.baseUrl}/pools`, (data) => {
      return data.data || data.pools || data;
    });
  }

  async getProtocol(projectName: string): Promise<LlamaProtocol> {
    const cacheKey = `protocol-${projectName}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Try to get protocol info from the main API
      const response = await fetch(`https://api.llama.fi/protocols`);
      const protocols = await response.json();

      const protocol = protocols.find((p: any) =>
        p.name?.toLowerCase() === projectName.toLowerCase() ||
        p.slug?.toLowerCase() === projectName.toLowerCase()
      );

      const protocolData: LlamaProtocol = {
        name: protocol?.name || projectName,
        slug: protocol?.slug || projectName,
        logo: protocol?.logo || `/logos/${projectName.toLowerCase()}.png`,
        chains: protocol?.chains || ['stellar'],
        tvl: protocol?.tvl || 0,
        description: protocol?.description || ''
      };

      this.cache.set(cacheKey, {
        data: protocolData,
        timestamp: Date.now()
      });

      return protocolData;
    } catch (error) {
      // Return fallback protocol info
      const fallbackData: LlamaProtocol = {
        name: projectName,
        slug: projectName.toLowerCase(),
        logo: `/logos/${projectName.toLowerCase()}.png`,
        chains: ['stellar'],
        tvl: 0,
        description: ''
      };

      this.cache.set(cacheKey, {
        data: fallbackData,
        timestamp: Date.now()
      });

      return fallbackData;
    }
  }

  async getPoolChart(poolId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chart/${poolId}`);
      if (!response.ok) {
        return [];
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to fetch chart data for pool ${poolId}:`, error);
      return [];
    }
  }

  private async fetchWithCache<T>(
    cacheKey: string,
    url: string,
    dataExtractor: (data: any) => T
  ): Promise<T> {
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      const data = dataExtractor(rawData);

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Failed to fetch ${cacheKey}:`, error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}