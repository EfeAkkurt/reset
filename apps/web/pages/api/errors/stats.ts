import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalErrors: 0,
        retryCount: 0,
        recoveryCount: 0,
        averageRecoveryTime: 0,
        errorsBySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        }
      },
      recentErrors: [],
      summary: {
        totalErrors: 0,
        errorRate: 0,
        retryRate: 0,
        avgRecoveryTime: '0ms'
      },
      timestamp: Date.now()
    }
  });
}