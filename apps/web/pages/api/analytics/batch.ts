import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Mock response for batch analytics
  return res.status(200).json({
    success: true,
    data: [],
    summary: {
      totalTVL: 0,
      avgAPY: 0,
      avgRiskScore: 0,
      totalVolume24h: 0
    },
    metadata: {
      requestId: `batch_${Date.now()}`,
      processingTime: 0,
      totalPools: 0,
      successfulPools: 0,
      failedPools: 0,
      requestedMetrics: [],
      timeRange: '30d',
      granularity: 'daily'
    }
  });
}