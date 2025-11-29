import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // const { id } = req.query;

  return res.status(200).json({
    success: true,
    data: {
      volume24h: 0,
      volume7d: 0,
      price: 1.0,
      marketCap: 0,
      fullyDilutedValuation: 0,
      circulatingSupply: 0,
      totalSupply: 0
    },
    timestamp: Date.now(),
    requestId: `market_${Date.now()}`,
    processingTime: 0,
    cacheStatus: 'fresh'
  });
}