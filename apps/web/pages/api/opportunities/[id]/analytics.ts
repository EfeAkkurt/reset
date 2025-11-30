import { NextApiRequest, NextApiResponse } from 'next';
import { buildOpportunityDetailData } from '@/lib/server/buildOpportunityDetail';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, timeRange = '30' } = req.query;
  const oppId = Array.isArray(id) ? id[0] : id;
  const days = Number(Array.isArray(timeRange) ? timeRange[0] : timeRange) || 30;

  if (!oppId) {
    return res.status(400).json({ success: false, error: 'Missing id' });
  }

  try {
    const detail = await buildOpportunityDetailData(oppId, days);
    if (!detail) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        market: detail.market,
        risk: detail.risk,
        performance: detail.performance,
        rewards: detail.rewards,
        analytics: detail.analytics,
        social: detail.social,
      },
      timestamp: Date.now(),
      metadata: {
        requestId: `analytics_${oppId}_${Date.now()}`,
        processingTime: 0,
        metricsCount: 1,
        timeRange: `${days}d`,
        granularity: 'daily'
      }
    });
  } catch (error) {
    console.error(`[API /opportunities/${oppId}/analytics] failed`, error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
