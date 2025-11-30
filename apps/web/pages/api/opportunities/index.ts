import type { NextApiRequest, NextApiResponse } from "next";
import { realDataAdapter } from "@/lib/adapters/real";
import { getMockOpportunities } from "@/lib/mock/opportunities";
import type { OpportunityDetail, OpportunitySummary } from "@shared/core";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | {
        items: CardOpportunity[];
        metadata: {
          totalItems: number;
          totalTvl: number;
          avgApr: number;
          avgApy: number;
          riskDistribution: {
            low: number;
            medium: number;
            high: number;
          };
          chainDistribution: Record<string, number>;
          lastUpdate: string;
          dataQuality: {
            completeness: number;
            reliability: number;
            overallScore: number;
          };
          dataSource: "live" | "demo";
        };
      }
    | { error: string }
  >,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let rawItems: OpportunityDetail[];
    let dataSource: "live" | "demo" = "live";

    try {
      const items = await realDataAdapter.fetchOpportunities();
      rawItems = items as OpportunityDetail[];
    } catch (adapterError) {
      console.error(
        "[API /opportunities] Real data fetch failed, using mock data",
        adapterError,
      );
      dataSource = "demo";
      rawItems = getMockOpportunities();
    }

    const withSource: OpportunitySummary[] = rawItems.map(({ riskAnalysis, insurance, ...rest }) => ({
      ...rest,
      source: dataSource,
    }));

    // Calculate enhanced metadata
    const totalItems = rawItems.length;
    const totalTvl = rawItems.reduce((sum, item) => sum + item.tvlUsd, 0);
    const avgApr =
      totalItems > 0
        ? rawItems.reduce((sum, item) => sum + item.apr, 0) / totalItems
        : 0;
    const avgApy =
      totalItems > 0
        ? rawItems.reduce((sum, item) => sum + item.apy, 0) / totalItems
        : 0;

    // Risk distribution
    const riskDistribution = {
      low: rawItems.filter((item) => item.risk === "Low").length,
      medium: rawItems.filter((item) => item.risk === "Medium").length,
      high: rawItems.filter((item) => item.risk === "High").length,
    };

    // Chain distribution
    const chainDistribution: Record<string, number> = {};
    rawItems.forEach((item) => {
      chainDistribution[item.chain] = (chainDistribution[item.chain] || 0) + 1;
    });

    // Data quality assessment
    const dataQuality = {
      completeness: Math.min(1, totalItems / 50), // Expect at least 50 opportunities
      reliability: 0.9, // Assume good reliability
      overallScore: Math.min(1, (totalItems / 50) * 0.9 + 0.1),
    };

    const metadata = {
      totalItems,
      totalTvl,
      avgApr,
      avgApy,
      riskDistribution,
      chainDistribution,
      lastUpdate: new Date().toISOString(),
      dataQuality,
      dataSource,
    };

    return res.status(200).json({ items: withSource, metadata });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
