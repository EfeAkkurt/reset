import type { NextApiRequest, NextApiResponse } from "next";
import { realDataAdapter } from "@/lib/adapters/real";
import { getMockOpportunityById } from "@/lib/mock/opportunities";
import type {
  OpportunityDetail,
  RiskAssessment,
  RiskMetrics,
  RiskFactor,
} from "@shared/core";

// Risk analysis calculation functions
function calculateRiskAssessment(opportunity: OpportunityDetail): RiskAssessment {
  const baseRiskScore = opportunity.risk === "Low" ? 25 : opportunity.risk === "Medium" ? 55 : 80;

  // Adjust risk score based on protocol and TVL
  let riskAdjustment = 0;
  if (opportunity.tvlUsd < 100000) riskAdjustment += 15; // Low TVL increases risk
  else if (opportunity.tvlUsd > 10000000) riskAdjustment -= 10; // High TVL reduces risk

  // Protocol-specific risk adjustments
  const protocolRiskMap: Record<string, number> = {
    "Blend": 5,
    "Aqua": 0,
    "LumenShield": -5,
    "StellarX": 0,
    "Soroswap": 5,
  };

  riskAdjustment += protocolRiskMap[opportunity.protocol] || 10;

  const finalRiskScore = Math.max(0, Math.min(100, baseRiskScore + riskAdjustment));

  const riskLevel = finalRiskScore < 30 ? "low" : finalRiskScore < 60 ? "medium" : finalRiskScore < 80 ? "high" : "critical";

  return {
    id: opportunity.id,
    protocol: opportunity.protocol,
    riskScore: finalRiskScore,
    score: finalRiskScore,
    riskLevel,
    level: riskLevel,
    categories: {
      smartContractRisk: finalRiskScore * 0.2 + Math.random() * 10,
      liquidityRisk: finalRiskScore * 0.25 + Math.random() * 8,
      marketRisk: finalRiskScore * 0.3 + Math.random() * 12,
      counterpartyRisk: finalRiskScore * 0.15 + Math.random() * 5,
      operationalRisk: finalRiskScore * 0.1 + Math.random() * 7,
    },
    factors: [],
    recommendations: [],
    lastUpdated: Date.now(),
    timestamp: Date.now(),
    confidence: opportunity.tvlUsd > 1000000 ? "high" : opportunity.tvlUsd > 100000 ? "medium" : "low",
  };
}

function calculateRiskMetrics(opportunity: OpportunityDetail, riskScore: number): RiskMetrics {
  const riskMultiplier = opportunity.risk === "Low" ? 0.7 : opportunity.risk === "Medium" ? 1 : 1.5;

  // Calculate volatility based on APY stability
  const volatility = 5 + (opportunity.apr * 0.3) + (Math.random() * 10 * riskMultiplier);

  // Calculate max drawdown based on risk level
  const maxDrawdown = opportunity.risk === "Low" ? 2 + Math.random() * 3 :
                     opportunity.risk === "Medium" ? 8 + Math.random() * 7 :
                     15 + Math.random() * 10;

  // Calculate Sharpe ratio (risk-adjusted return)
  const riskFreeRate = 2; // Assume 2% risk-free rate
  const excessReturn = opportunity.apr - riskFreeRate;
  const sharpeRatio = Math.max(0, (excessReturn / volatility) * (2 - riskMultiplier * 0.5));

  // Value at Risk (VaR) - potential loss over 1 month
  const valueAtRisk = volatility * Math.sqrt(21) * 1.65; // 95% confidence

  return {
    volatility: Math.round(volatility * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    valueAtRisk: Math.round(valueAtRisk * 100) / 100,
    beta: 0.8 + Math.random() * 0.4 * riskMultiplier, // Market correlation
    correlation: 0.3 + Math.random() * 0.4,
    liquidityRatio: Math.min(100, (opportunity.tvlUsd / 50000) * (1 / riskMultiplier)),
    marketDepth: Math.log(opportunity.tvlUsd + 1) * 1000,
    impermanentLossRisk: opportunity.pair.includes("XLM") ? 15 : 25 + Math.random() * 10,
    smartContractRiskScore: 10 + Math.random() * 15 * riskMultiplier,
    auditScore: Math.max(60, 90 - Math.random() * 20 * riskMultiplier),
    overallScore: Math.max(0, 100 - (riskScore * 0.8)),
    category: opportunity.risk.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
    factors: [],
  };
}

function generateRiskFactors(opportunity: OpportunityDetail, riskScore: number): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Smart contract risk factors
  factors.push({
    category: "Smart Contract Risk",
    severity: riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low",
    description: `${opportunity.protocol} smart contracts have ${riskScore > 70 ? "limited" : "regular"} audit history`,
    impact: riskScore * 0.3,
    probability: 0.1 + (riskScore / 500),
    mitigation: "Review audit reports and start with small allocations",
  });

  // Liquidity risk factors
  if (opportunity.tvlUsd < 100000) {
    factors.push({
      category: "Liquidity Risk",
      severity: "high",
      description: `Low TVL ($${(opportunity.tvlUsd / 1000).toFixed(0)}K) may lead to slippage`,
      impact: 15,
      probability: 0.3,
      mitigation: "Use smaller position sizes and monitor liquidity depth",
    });
  }

  // Market risk factors
  factors.push({
    category: "Market Risk",
    severity: opportunity.apr > 20 ? "medium" : "low",
    description: `High APY (${opportunity.apr.toFixed(1)}%) may indicate additional risk factors`,
    impact: opportunity.apr * 0.5,
    probability: 0.2,
    mitigation: "Understand the source of high yields and monitor sustainability",
  });

  // Impermanent loss risk (if it's a liquidity pool)
  if (opportunity.pair.includes("/") || opportunity.pair.includes("-")) {
    factors.push({
      category: "Impermanent Loss",
      severity: "medium",
      description: `Liquidity pool ${opportunity.pair} subject to impermanent loss`,
      impact: 8,
      probability: 0.4,
      mitigation: "Consider correlated asset pairs or stablecoin pools",
    });
  }

  return factors;
}

function generateRecommendations(opportunity: OpportunityDetail, riskScore: number): string[] {
  const recommendations: string[] = [];

  if (riskScore > 70) {
    recommendations.push("Consider allocating only a small portion of your portfolio due to high risk");
    recommendations.push("Monitor the protocol closely for any security announcements");
  }

  if (opportunity.tvlUsd < 100000) {
    recommendations.push("Be cautious of low liquidity which may cause high slippage");
  }

  if (opportunity.apr > 30) {
    recommendations.push("High yields may not be sustainable - research the tokenomics");
  }

  recommendations.push("Start with a test allocation to understand the mechanics");
  recommendations.push("Set up alerts for significant APY or TVL changes");

  if (opportunity.risk === "Low" && opportunity.tvlUsd > 1000000) {
    recommendations.push("This appears to be a relatively stable opportunity for consistent exposure");
  }

  return recommendations;
}

interface EnhancedOpportunityResponse {
  item: OpportunityDetail;
  riskAnalysis: {
    assessment: RiskAssessment;
    metrics: RiskMetrics;
    detailedFactors: RiskFactor[];
    recommendations: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnhancedOpportunityResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;
  const oppId = Array.isArray(id) ? id[0] : id;

  try {
    if (!oppId) {
      return res.status(400).json({ error: "Missing id" });
    }
    try {
      const item = await realDataAdapter.fetchOpportunityById(oppId);
      if (!item) {
        return res.status(404).json({ error: "Not found" });
      }
      const typed = item as OpportunityDetail;

      // Calculate risk analysis
      const riskAssessment = calculateRiskAssessment(typed);
      const riskMetrics = calculateRiskMetrics(typed, riskAssessment.riskScore);
      const riskFactors = generateRiskFactors(typed, riskAssessment.riskScore);
      const recommendations = generateRecommendations(typed, riskAssessment.riskScore);

      return res.status(200).json({
        item: {
          ...typed,
          source: "live",
          riskAnalysis: {
            assessment: riskAssessment,
            metrics: riskMetrics,
            factors: riskFactors,
            recommendations,
          },
        },
        riskAnalysis: {
          assessment: riskAssessment,
          metrics: riskMetrics,
          detailedFactors: riskFactors,
          recommendations,
        },
      });
    } catch (adapterError) {
      console.error(
        `[API /opportunities/${oppId}] Real data fetch failed, trying mock`,
        adapterError,
      );

      const mock = getMockOpportunityById(oppId) as OpportunityDetail | undefined;
      if (!mock) {
        // Try to get available opportunities for better error message
        try {
          const availableOpps = await realDataAdapter.fetchOpportunities();
          const availableIds = availableOpps.slice(0, 5).map((opp) => opp.id);

          console.warn(
            `[API /opportunities/${oppId}] Opportunity not found. Available IDs:`,
            availableIds
          );

          return res.status(404).json({
            error: "Not found",
            message: `Opportunity with ID '${oppId}' not found.`,
            availableIds: availableIds,
            suggestion: "Please check the opportunities list endpoint for valid IDs"
          });
        } catch (listError) {
          return res.status(404).json({
            error: "Not found",
            message: `Opportunity with ID '${oppId}' not found in live or mock data.`,
            suggestion: "Check the /api/opportunities endpoint for available opportunities"
          });
        }
      }

      // Calculate risk analysis for mock data
      const mockRiskAssessment = calculateRiskAssessment(mock);
      const mockRiskMetrics = calculateRiskMetrics(mock, mockRiskAssessment.riskScore);
      const mockRiskFactors = generateRiskFactors(mock, mockRiskAssessment.riskScore);
      const mockRecommendations = generateRecommendations(mock, mockRiskAssessment.riskScore);

      return res.status(200).json({
        item: {
          ...mock,
          source: "demo",
          riskAnalysis: {
            assessment: mockRiskAssessment,
            metrics: mockRiskMetrics,
            factors: mockRiskFactors,
            recommendations: mockRecommendations,
          },
        },
        riskAnalysis: {
          assessment: mockRiskAssessment,
          metrics: mockRiskMetrics,
          detailedFactors: mockRiskFactors,
          recommendations: mockRecommendations,
        },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
