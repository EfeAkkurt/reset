"use client";
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Logger } from "@/lib/adapters/real";
import { OpportunityHero } from "@/components/opportunity/OpportunityHero";
import { OpportunityOverviewCard } from "@/components/opportunity/OpportunityOverviewCard";
import { DepositCalculator } from "@/components/opportunity/DepositCalculator";
import { InsuranceCard } from "@/components/opportunity/InsuranceCard";
import { RiskAnalysis } from "@/components/opportunity/RiskAnalysis";
import { useCompare } from "@/components/opportunity/CompareBar";
import { GitCompare, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChartDataError,
  DataLoadingError,
} from "@/components/ui/ErrorNotification";
import { getTestNetOpportunities } from "@/lib/mock/testnet-opportunities";

type CardOpportunity = {
  id: string;
  protocol: string;
  pair: string;
  chain: string;
  apr: number; // percent
  apy: number; // percent
  risk: "Low" | "Medium" | "High";
  tvlUsd: number;
  rewardToken: string;
  lastUpdated: string; // label like 5m, 2h
  originalUrl: string;
  summary: string;
  logoUrl?: string;
  // Extended metadata may exist but is not required here
  ilRisk?: string;
  exposure?: string;
  volume24h?: number;
};

export default function OpportunityDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addItem } = useCompare();

  const [data, setData] = React.useState<CardOpportunity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [errorType, setErrorType] = React.useState<
    "chart-data" | "general" | null
  >(null);

  // Retry function for data loading
  const handleRetry = React.useCallback(() => {
    setLoading(true);
    setError(null);
    setErrorType(null);
  }, []);

  // Load opportunity data
  React.useEffect(() => {
    if (!id) return;

    const opportunityId = Array.isArray(id) ? id[0] : id;

    let mounted = true;

    async function loadRealOpportunity() {
      try {
        setLoading(true);
        setError(null);

        // Check if this is a TestNet opportunity first
        if (opportunityId === 'testnet-mock-yield-stellar') {
          const testNetOpps = getTestNetOpportunities();
          const testNetOpp = testNetOpps.find(opp => opp.id === opportunityId);

          if (testNetOpp && mounted) {
            Logger.info(`Loaded TestNet opportunity detail`, { opportunityId });

            // Transform to CardOpportunity format
            const cardOpportunity: CardOpportunity = {
              id: testNetOpp.id,
              protocol: testNetOpp.protocol,
              pair: testNetOpp.pool || `${testNetOpp.tokens[0]} Yield`,
              chain: testNetOpp.chain,
              apr: testNetOpp.apr,
              apy: testNetOpp.apy,
              risk: testNetOpp.risk.charAt(0).toUpperCase() + testNetOpp.risk.slice(1) as "Low" | "Medium" | "High",
              tvlUsd: testNetOpp.tvlUsd,
              rewardToken: Array.isArray(testNetOpp.rewardToken) ? testNetOpp.rewardToken.join(', ') : testNetOpp.rewardToken,
              lastUpdated: new Date(testNetOpp.lastUpdated).toLocaleDateString(),
              originalUrl: `#`, // No external URL for TestNet
              summary: `Reset Mock Yield Protocol - ${testNetOpp.apr}% APR on XLM`,
            };

            setData(cardOpportunity);
            setLoading(false);
            return;
          }
        }

        Logger.info(`Loading opportunity detail via API`, { opportunityId });
        const resp = await fetch(`/api/opportunities/${opportunityId}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        const opportunity: CardOpportunity | null = json.item || null;

        if (!mounted) return;

        if (opportunity) {
          Logger.info(`Loaded opportunity detail from REAL APIs`, {
            opportunityId,
          });
          Logger.debug(`Data loaded`, {
            opportunityId,
            protocol: opportunity.protocol,
          });
          setData(opportunity);
        } else {
          Logger.warn(`Opportunity not found in real data`, { opportunityId });
          setError("Opportunity data is temporarily unavailable");
          setErrorType("general");
        }
      } catch (fetchError) {
        Logger.error(`Failed to load real data`, fetchError, { opportunityId });
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : "Unknown error";

        // Determine error type based on error message
        if (errorMessage.includes("404")) {
          setError("Protocol details are temporarily unavailable");
          setErrorType("general");
        } else if (
          errorMessage.includes("400") &&
          errorMessage.includes("chart")
        ) {
          setError("Chart data is temporarily unavailable");
          setErrorType("chart-data");
        } else {
          setError("Data loading failed. Please try again later.");
          setErrorType("general");
        }

        setData(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRealOpportunity();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Loading opportunity...
          </h2>
          <p className="mt-2 text-gray-600">Fetching the latest data</p>
        </motion.div>
      </div>
    );
  }

  // Error or not found state
  if (!data && error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {errorType === "chart-data" && (
            <ChartDataError onRetry={handleRetry} />
          )}
          {errorType === "general" && (
            <DataLoadingError message={error} onRetry={handleRetry} />
          )}
          {!errorType && (
            <DataLoadingError message={error} onRetry={handleRetry} />
          )}

          <div className="mt-6 text-center">
            <Link
              href="/opportunities"
              className="typo-link-emerald inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to opportunities
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {data
            ? `${data.protocol} ${data.pair} | Stellar DeFi | Reset`
            : "Stellar Opportunity Details | Reset"}
        </title>
        <meta
          name="description"
          content={
            data
              ? `Detailed analysis of ${data.protocol} ${data.pair} yield opportunity on Stellar. Risk assessment, insurance compatibility, and performance metrics for ${data.chain} DeFi.`
              : "View detailed information about Stellar yield opportunities with risk analysis and insurance optimization."
          }
        />
        <meta
          property="og:title"
          content={
            data
              ? `${data.protocol} ${data.pair} | Stellar DeFi | Reset`
              : "Stellar Opportunity Details | Reset"
          }
        />
        <meta
          property="og:description"
          content={
            data
              ? `Comprehensive analysis of ${data.protocol} ${data.pair} on Stellar. Risk score: ${data?.risk || 'Low'}. TVL: $${(data?.tvlUsd / 1000000).toFixed(1)}M. Optimized for DeFi insurance.`
              : "Stellar DeFi opportunities with institutional-grade risk analysis and insurance optimization."
          }
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={
            data
              ? `${data.protocol} ${data.pair} | Reset UI`
              : "Opportunity Details | Reset UI"
          }
        />
        <meta
          name="twitter:description"
          content={
            data
              ? `${data.protocol} ${data.pair} on Stellar - ${data.apr}% APR, $${(data.tvlUsd / 1000000).toFixed(1)}M TVL, ${data.risk} risk. Insurance-optimized yield opportunity.`
              : "Stellar DeFi opportunities with institutional risk analysis and insurance optimization."
          }
        />
      </Head>
      <main className="relative min-h-screen bg-[#030304] pb-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,162,51,0.15),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-10">
          {error && data && (
            <div className="mb-6">
              {errorType === "chart-data" && (
                <ChartDataError onRetry={handleRetry} />
              )}
              {errorType === "general" && (
                <DataLoadingError message={error} onRetry={handleRetry} />
              )}
              {!errorType && (
                <DataLoadingError message={error} onRetry={handleRetry} />
              )}
            </div>
          )}

          {data && <OpportunityHero data={data} />}

          {data && (
            <div className="mt-6 flex items-center justify-end">
              <motion.button
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  Logger.info("Adding to compare", { opportunityId: data.id });
                  addItem(
                    data as unknown as import("@/components/opportunity/CompareBar").CompareItem,
                  );
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(243,162,51,0.4)] bg-black/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#F3A233] shadow-[0_10px_20px_rgba(0,0,0,0.35)] transition hover:border-[#F3A233] hover:text-white"
              >
                <GitCompare size={16} />
                Add to Compare
              </motion.button>
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-8 lg:sticky lg:top-24">
              {data && <OpportunityOverviewCard data={data} />}
              {data && <RiskAnalysis data={data} />}
            </div>
            <div className="space-y-8">
              {data && <DepositCalculator data={data} />}
              {data && (
                <InsuranceCard
                  amount={2500}
                  days={90}
                  premiumRate30d={0.0015}
                  coverageByTier={{ basic: 0.6, standard: 0.8, plus: 0.9 }}
                  deductiblePct={0.1}
                  coverageCapUSD={100000}
                  riskScore={32}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
