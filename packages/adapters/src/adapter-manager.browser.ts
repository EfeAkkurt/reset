/**
 * Browser-compatible Adapter Manager
 *
 * Provides mock data for browser environment when SQLite is not available
 */

import { Opportunity as SharedOpportunity } from "@adapters/core";
import { getTestNetOpportunities } from "../../../apps/web/lib/mock/testnet-opportunities";

export class AdapterManager {
  constructor() {
    console.log("📱 Browser Adapter Manager initialized (mock data mode)");
  }

  async getAllOpportunities(): Promise<SharedOpportunity[]> {
    console.log("📋 Returning mock opportunities for browser environment");

    // Return testnet opportunities as mock data
    const mockOpps = getTestNetOpportunities();

    return mockOpps.map(opp => ({
      id: opp.id,
      protocol: opp.protocol,
      pool: (opp as any).pair || (opp as any).pool || 'Unknown Pool',
      chain: opp.chain,
      apr: opp.apr / 100, // Convert percentage to decimal
      apy: opp.apy / 100,
      risk: opp.risk.toLowerCase() === 'medium' ? 'med' : opp.risk.toLowerCase() as 'low' | 'med' | 'high',
      tvlUsd: opp.tvlUsd,
      rewardToken: opp.rewardToken,
      lastUpdated: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      poolId: opp.id,
      logoUrl: opp.logoUrl,
      exposure: "mixed",
      stablecoin: (opp as any).pair?.toLowerCase().includes("usd") || (opp as any).pair?.toLowerCase().includes("stable") || false,
      ilRisk: "medium",
      tokens: (opp as any).tokens || [],
      source: 'mock'
    }));
  }

  async getOpportunityDetail(id: string): Promise<SharedOpportunity> {
    const opportunities = await this.getAllOpportunities();
    const opportunity = opportunities.find(opp => opp.id === id);

    if (!opportunity) {
      throw new Error(`Opportunity with id ${id} not found`);
    }

    return opportunity;
  }

  async getChartData(poolId: string): Promise<any[]> {
    // Return mock chart data
    const points: any[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * dayMs);
      const baseTvl = 1000000 + Math.random() * 500000;
      const tvlUsd = baseTvl + (Math.random() - 0.5) * 100000;
      const apy = 5 + Math.random() * 15;

      points.push({
        timestamp,
        tvlUsd,
        apy,
        apyBase: apy * 0.8,
        apyReward: apy * 0.2
      });
    }

    return points;
  }
}