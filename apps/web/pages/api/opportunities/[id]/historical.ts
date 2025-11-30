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

    const tvlValues = detail.historical.tvl.map((v) => v.value);
    const avgTvl = tvlValues.length ? tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length : 0;
    const apyValues = detail.historical.apy.map((v) => v.value);
    const avgApy = apyValues.length ? apyValues.reduce((a, b) => a + b, 0) / apyValues.length : 0;

    return res.status(200).json({
      success: true,
      data: detail.historical,
      summary: {
        avgTvl,
        avgApy,
        volatility: detail.performance.volatility.daily,
        sharpeRatio: detail.performance.riskAdjustedReturns.sharpeRatio,
        maxDrawdown: detail.performance.drawdown.maxDrawdown,
      },
      metadata: {
        requestId: `historical_${oppId}_${Date.now()}`,
        processingTime: 0,
        timeRange: `${days}d`,
        granularity: 'daily',
        dataTypes: ['tvl', 'apy', 'volume', 'fees'],
        dataPoints: detail.historical.tvl.length,
      }
    });
  } catch (error) {
    console.error(`[API /opportunities/${oppId}/historical] failed`, error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
