import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  return res.status(200).json({
    success: true,
    data: {
      id,
      name: "Mock Opportunity",
      chain: "ethereum",
      protocol: "Mock Protocol",
      pool: "Mock Pool",
      tokens: ["USDC"],
      apr: 5.0,
      apy: 5.1,
      tvlUsd: 1000000,
      risk: "low",
      source: "mock",
      lastUpdated: Date.now(),
      description: "This is a mock opportunity for testing purposes.",
      website: "https://example.com",
      logo: "/logos/ethereum.svg",
      supportedTokens: ["USDC"],
      poolId: id,
      underlyingTokens: ["USDC"],
      volume24h: 10000,
      fees24h: 50,
      exposure: "stablecoin",
      ilRisk: "none",
      stablecoin: true,
      volume7d: 70000,
      volume30d: 300000,
      uniqueUsers24h: 100,
      uniqueUsers7d: 500,
      uniqueUsers30d: 1500,
      concentrationRisk: 10,
      userRetention: 90
    },
    requestId: `req_${Date.now()}`,
    processingTime: 0,
    dataSize: 0
  });
}