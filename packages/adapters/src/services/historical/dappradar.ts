/**
 * DAppRadar Service - Fetches user metrics and dApp usage data
 */

export interface UserMetrics {
  uniqueUsers24h: number;
  uniqueUsers7d: number;
  uniqueUsers30d: number;
  userRetention: number;
}

export interface DAppRadarResponse {
  data: UserMetrics;
  timestamp: number;
}

export class DAppRadarService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = config?.baseUrl || 'https://api.dappradar.com';
    this.apiKey = config?.apiKey;
  }

  async getProtocolUserMetrics(protocol: string): Promise<UserMetrics> {
    try {
      // Mock implementation - replace with actual DAppRadar API call
      console.log(`👥 Fetching user metrics for protocol: ${protocol}`);

      // Return mock data for now
      const mockData: UserMetrics = {
        uniqueUsers24h: Math.floor(Math.random() * 1000) + 100,
        uniqueUsers7d: Math.floor(Math.random() * 5000) + 500,
        uniqueUsers30d: Math.floor(Math.random() * 15000) + 2000,
        userRetention: Math.random() * 0.8 + 0.2, // 20% - 100%
      };

      return mockData;
    } catch (error) {
      console.error(`❌ Failed to fetch user metrics for ${protocol}:`, error);
      throw error;
    }
  }

  async getStellarDefiMetrics(): Promise<UserMetrics> {
    try {
      console.log('👥 Fetching Stellar DeFi user metrics');

      // Mock data for Stellar ecosystem
      return {
        uniqueUsers24h: Math.floor(Math.random() * 5000) + 1000,
        uniqueUsers7d: Math.floor(Math.random() * 25000) + 5000,
        uniqueUsers30d: Math.floor(Math.random() * 80000) + 15000,
        userRetention: Math.random() * 0.6 + 0.3,
      };
    } catch (error) {
      console.error('❌ Failed to fetch Stellar DeFi metrics:', error);
      throw error;
    }
  }

  
  async getDAppRankings(category?: string): Promise<any[]> {
    try {
      console.log(`📊 Fetching dApp rankings${category ? ` for category: ${category}` : ''}`);

      // Mock implementation
      return [
        { name: 'StellarX', category: 'dex', users: 15000, volume: 25000000 },
        { name: 'Soroban Pools', category: 'lend', users: 8000, volume: 12000000 },
        { name: 'Aqua Network', category: 'dex', users: 12000, volume: 18000000 },
      ];
    } catch (error) {
      console.error('❌ Failed to fetch dApp rankings:', error);
      throw error;
    }
  }

  private async makeAPICall(endpoint: string, params?: Record<string, any>): Promise<any> {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey || '',
      },
    });

    if (!response.ok) {
      throw new Error(`DAppRadar API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const dappradarService = new DAppRadarService();
