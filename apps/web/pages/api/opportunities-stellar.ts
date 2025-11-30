import { NextApiRequest, NextApiResponse } from 'next';

interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy?: number;
  apyBase?: number;
  apyReward?: number;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  pool: string;
  exposure?: string;
  ilRisk?: string;
  stablecoin?: boolean;
}

interface Opportunity {
  id: string;
  chain: string;
  protocol: string;
  pool: string;
  pair: string;
  tokens: string[];
  apr: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  rewardToken: string | string[];
  tvlUsd: number;
  risk: "Low" | "Medium" | "High";
  source: "api" | "mock" | "live";
  lastUpdated: number | string;
  disabled?: boolean;
  poolId?: string;
  underlyingTokens?: string[];
  volume24h?: number;
  fees24h?: number;
  logoUrl?: string;
  exposure?: string;
  ilRisk?: string;
  stablecoin?: boolean;
  originalUrl?: string;
  summary?: string;
  protocolPair?: string;
  rewardTokens?: string[];
  allTokens?: string[];
}

async function fetchDefiLlamaPools(): Promise<DefiLlamaPool[]> {
  try {
    const response = await fetch('https://yields.llama.fi/pools');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch DeFiLlama pools:', error);
    throw error;
  }
}

function transformDefiLlamaPool(pool: DefiLlamaPool): Opportunity | null {
  // Filter for Stellar chains only
  if (pool.chain !== 'Stellar') {
    return null;
  }

  // Filter for valid pools with meaningful data
  if (!pool.tvlUsd || pool.tvlUsd < 1000) {
    return null;
  }

  const apy = pool.apy || pool.apyBase || 0;
  const apyBase = pool.apyBase || 0;
  const apyReward = pool.apyReward || 0;
  const apr = apy * 0.9; // Rough approximation from APY to APR

  // Determine risk level based on APY and pool characteristics
  let risk: "low" | "med" | "high" = "med";
  if (apy > 20) risk = "high";
  else if (apy < 5 && pool.stablecoin) risk = "low";
  else if (pool.ilRisk === "low" && pool.stablecoin) risk = "low";
  else if (apy > 15 || pool.ilRisk === "high") risk = "high";

  // Convert to CardOpportunity risk format
  const cardRisk: "Low" | "Medium" | "High" =
    risk === "low" ? "Low" :
    risk === "high" ? "High" : "Medium";

  // Create pair name from underlying tokens
  const underlyingTokens = pool.underlyingTokens || [];
  const pair = underlyingTokens.length >= 2
    ? `${underlyingTokens[0].slice(0, 4)}-${underlyingTokens[1].slice(0, 4)}`
    : pool.symbol || `${pool.project} Pool`;

  // Get reward tokens for display
  const rewardTokens = pool.rewardTokens || [];
  const primaryRewardToken = rewardTokens[0] || "XLM";

  // Generate ID that matches real data adapter format
  // Create cleaner IDs like "blend-pools-v2-xlm" instead of "stellar-blend-pools-v2-uuid"
  const primaryToken = underlyingTokens.length > 0 ? underlyingTokens[0].slice(-4).toLowerCase() :
                      pool.symbol?.slice(-4).toLowerCase() || 'pool';

  const id = `${pool.project.toLowerCase()}-${primaryToken}`;

  return {
    id,
    chain: pool.chain.toLowerCase() as "stellar",
    protocol: pool.project,
    pair,
    apr: Math.round(apr * 100) / 100,
    apy: Math.round(apy * 100) / 100,
    risk: cardRisk,
    tvlUsd: Math.round(pool.tvlUsd * 100) / 100,
    rewardToken: primaryRewardToken,
    lastUpdated: "Live", // Always show as live data
    originalUrl: `https://defillama.com/yields/pool/${pool.pool || id}`,
    summary: `${pool.project} ${pair} pool on Stellar - ${(Math.round(apy * 100) / 100).toFixed(2)}% APY`,
    source: "live" as const,
    logoUrl: `https://icons.llama.fi/icons/${pool.project.toLowerCase()}.png`,
    // Include additional fields for potential use
    pool: pool.pool || pool.symbol || `${pool.project} Pool`,
    tokens: pool.underlyingTokens || [pool.symbol || pool.project],
    apyBase: Math.round(apyBase * 100) / 100,
    apyReward: Math.round(apyReward * 100) / 100,
    disabled: false,
    poolId: pool.pool,
    underlyingTokens: pool.underlyingTokens,
    volume24h: Math.round(pool.tvlUsd * 0.03), // Estimate 3% daily volume
    fees24h: Math.round(pool.tvlUsd * 0.03 * 0.003), // Estimate 0.3% fee on volume
    exposure: pool.exposure,
    ilRisk: pool.ilRisk,
    stablecoin: pool.stablecoin || false,
    // Add enhanced token information for better UI display
    protocolPair: `${pool.project.toUpperCase()} - ${pair}`,
    rewardTokens: rewardTokens.length > 0 ? rewardTokens : [primaryRewardToken],
    allTokens: [...(pool.underlyingTokens || []), ...rewardTokens],
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 [STELLAR-API] Fetching real Stellar opportunities from DeFiLlama...');

    // Fetch pools from DeFiLlama
    const pools = await fetchDefiLlamaPools();
    console.log(`📊 [STELLAR-API] Fetched ${pools.length} total pools from DeFiLlama`);

    // Filter and transform to opportunities
    const opportunities: Opportunity[] = pools
      .map(pool => transformDefiLlamaPool(pool))
      .filter((opp): opp is Opportunity => opp !== null);

    console.log(`✅ [STELLAR-API] Successfully processed ${opportunities.length} Stellar opportunities`);

    if (opportunities.length === 0) {
      console.log('⚠️  [STELLAR-API] No Stellar opportunities found, checking if any Stellar pools exist...');
      const stellarPools = pools.filter(pool => pool.chain === 'Stellar');
      console.log(`📋 [STELLAR-API] Found ${stellarPools.length} raw Stellar pools`);
      if (stellarPools.length > 0) {
        console.log('🔍 [STELLAR-API] Sample Stellar pool:', JSON.stringify(stellarPools[0], null, 2));
      }
    }

    // Add summary statistics
    const summary = {
      totalOpportunities: opportunities.length,
      totalTVL: opportunities.reduce((sum, opp) => sum + opp.tvlUsd, 0),
      averageAPY: opportunities.length > 0
        ? opportunities.reduce((sum, opp) => sum + opp.apy, 0) / opportunities.length
        : 0,
      dataSource: "live",
      lastUpdated: Date.now(),
      chains: ["stellar"],
      protocols: [...new Set(opportunities.map(opp => opp.protocol))],
    };

    console.log(`📈 [STELLAR-API] Summary: ${summary.totalOpportunities} opportunities, $${(summary.totalTVL / 1000000).toFixed(2)}M total TVL, ${summary.averageAPY.toFixed(2)}% avg APY`);

    // Return response with both opportunities and metadata
    res.status(200).json({
      success: true,
      data: opportunities,
      meta: {
        ...summary,
        averageAPY: Math.round(summary.averageAPY * 100) / 100,
        totalTVL: Math.round(summary.totalTVL * 100) / 100,
      }
    });

  } catch (error) {
    console.error('❌ [STELLAR-API] Failed to fetch opportunities:', error);

    // Return detailed error information
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch Stellar opportunities',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      }
    });
  }
}