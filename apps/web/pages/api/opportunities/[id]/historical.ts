import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { timeRange = '30d' } = req.query;

  return res.status(200).json({
    success: true,
    data: [],
    summary: {
      avgTvl: 0,
      avgApy: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    },
    metadata: {
      requestId: `historical_${Date.now()}`,
      processingTime: 0,
      timeRange,
      granularity: 'daily',
      dataTypes: [],
      dataPoints: 0
    }
  });
}