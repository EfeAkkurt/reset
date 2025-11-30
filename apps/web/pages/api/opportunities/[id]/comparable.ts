import { NextApiRequest, NextApiResponse } from 'next';
import { realDataAdapter } from '@/lib/adapters/real';
import type { OpportunityDetail } from '@shared/core';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const oppId = Array.isArray(id) ? id[0] : id;

  if (!oppId) {
    return res.status(400).json({ success: false, error: 'Missing id' });
  }

  try {
    const target = await realDataAdapter.fetchOpportunityById(oppId);
    const all = await realDataAdapter.fetchOpportunities();
    const peers = all
      .filter((opp) => opp.id !== oppId && opp.chain === target?.chain)
      .map((opp) => ({
        name: opp.pair,
        protocol: opp.protocol,
        chain: opp.chain as any,
        tvl: opp.tvlUsd,
        apy: opp.apy,
        volume24h: opp.volume24h ?? opp.tvlUsd * 0.02,
        riskScore: opp.risk === 'Low' ? 30 : opp.risk === 'Medium' ? 55 : 75,
        score: opp.apy - (opp.risk === 'High' ? 20 : 0),
        reasons: ["Similar chain", "Comparable APY"],
      }))
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 3);

    return res.status(200).json({
      success: true,
      data: peers,
      metadata: {
        sourcePoolId: oppId,
        count: peers.length,
      }
    });
  } catch (error) {
    console.error(`[API /opportunities/${oppId}/comparable] failed`, error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
