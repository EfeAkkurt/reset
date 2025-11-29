import { Opportunity } from '@adapters/core';

export const TESTNET_MOCK_YIELD_OPPORTUNITY: Opportunity = {
  id: 'testnet-mock-yield-eth',
  chain: 'ethereum',
  protocol: 'Mock Yield Protocol',
  pool: 'ETH Yield Pool',
  tokens: ['ETH', 'USDC'],
  apr: 4.5, // 4.5% APR
  apy: 4.61, // 4.61% APY (compounded)
  rewardToken: 'ETH',
  tvlUsd: 15000, // Mock TVL for demo
  risk: 'low',
  source: 'mock',
  lastUpdated: Date.now(),
  poolId: 'testnet-mock-yield-746521428',
  logoUrl: '/logos/mock-yield.svg',
  exposure: 'Mixed Assets',
  ilRisk: 'Low',
  stablecoin: true,
};

export const TESTNET_OPPORTUNITIES: Opportunity[] = [
  TESTNET_MOCK_YIELD_OPPORTUNITY,
];

export const isTestNetMode = (): boolean => {
  // Check both server-side and client-side environment variables
  return process.env.ALGORAND_NETWORK === 'testnet' ||
         process.env.NEXT_PUBLIC_ALGORAND_NETWORK === 'testnet';
};

export const getTestNetOpportunities = (): Opportunity[] => {
  if (!isTestNetMode()) {
    return [];
  }
  return TESTNET_OPPORTUNITIES;
};