import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // const { id } = req.query;

  // Mock response
  return res.status(200).json({
    success: true,
    data: {
      basic: {
        market: { volume24h: 0 },
        risk: { overallRiskScore: 0 },
        performance: { totalReturns: { daily: 0 } },
        rewards: []
      },
      advanced: {
        efficiencyMetrics: {
          feeEfficiency: 0,
          capitalEfficiency: 0,
          volumeEfficiency: 0,
          overallScore: 0
        },
        userBehavior: {
          uniqueUsers24h: 0,
          uniqueUsers7d: 0,
          retentionRate: 0,
          avgDepositSize: 0
        }
      },
      social: {}
    },
    timestamp: Date.now(),
    metadata: {
      requestId: `analytics_${Date.now()}`,
      processingTime: 0,
      metricsCount: 0,
      timeRange: '30d',
      granularity: 'daily'
    }
  });
}