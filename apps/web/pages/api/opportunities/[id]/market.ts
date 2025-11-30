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
      data: detail.market,
      timestamp: Date.now(),
      requestId: `market_${oppId}_${Date.now()}`,
      processingTime: 0,
      cacheStatus: 'fresh'
    });
  } catch (error) {
    console.error(`[API /opportunities/${oppId}/market] failed`, error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
