"use client";
import React from "react";
import Head from "next/head";
import { Logger } from "@/lib/adapters/real";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import AnimatedFilterBar from "@/components/AnimatedFilterBar";
// import { SkeletonGrid } from "@/components/opportunities/SkeletonGrid";
import { EmptyState } from "@/components/opportunities/EmptyState";
import HeroHeader from "@/components/HeroHeader";
import HeroKpiBar from "@/components/HeroKpiBar";
import type { CardOpportunity } from "@/lib/types";
// Removed chain filter pills - only Stacks for now
import OpportunityCardPlaceholder from "@/components/OpportunityCardPlaceholder";
// Enhanced components temporarily removed due to TypeScript errors
// import { ChartTimeSelector } from "@/components/enhanced/TimeSelector";

export default function OpportunitiesPage() {
  const [risk, setRisk] = React.useState<"all" | "Low" | "Medium" | "High">(
    "all",
  );
  // const [chain] = React.useState<"stacks">("stacks"); // Only Stacks for now - unused
  const [sort, setSort] = React.useState<{
    key: keyof CardOpportunity;
    dir: "asc" | "desc";
  }>({
    key: "apr",
    dir: "desc",
  });
  // const [timeframe, setTimeframe] = React.useState<"7D" | "30D" | "90D">("7D");
  const [loading, setLoading] = React.useState(true);
  const [opportunities, setOpportunities] = React.useState<CardOpportunity[]>(
    [],
  );
  const [error, setError] = React.useState<string | null>(null);

  // Load opportunities data from real APIs only
  React.useEffect(() => {
    let mounted = true;

    async function loadRealData() {
      try {
        setLoading(true);
        setError(null);

        Logger.info(
          "🚀 Loading opportunities via API bridge (/api/opportunities)...",
        );

        const resp = await fetch("/api/opportunities");
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        const realOpportunities: CardOpportunity[] = (json.items || []).map(
          (it: CardOpportunity) => ({
            ...it,
            source: it.source ?? "live",
          }),
        );

        // Basic stats (client-side)
        const realStats = {
          avgApr7d: realOpportunities.length
            ? realOpportunities.reduce((a, o) => a + o.apr, 0) /
              realOpportunities.length
            : 0,
          totalTvlUsd: realOpportunities.reduce((a, o) => a + o.tvlUsd, 0),
          results: realOpportunities.length,
        };

        if (!mounted) return;

        Logger.info(
          `✅ Loaded ${realOpportunities.length} opportunities`,
        );
        Logger.info(
          `📊 Stats: ${realStats.avgApr7d.toFixed(1)}% avg APR, $${(realStats.totalTvlUsd / 1_000_000).toFixed(1)}M TVL`,
        );

        setOpportunities(realOpportunities);
      } catch (error) {
        Logger.error(
          "❌ FAILED to load real data - this should not happen in production!",
          error,
        );
        setError(
          `Real data loading failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setOpportunities([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRealData();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    Logger.debug(
      `🔍 Filtering ${opportunities.length} opportunities with risk='${risk}'`,
    );

    const result = opportunities.filter((o) => {
      // Support all chains
      if (!o.chain) return false;

      // Hide opportunities with 0.00 APR and APY
      if (o.apr === 0 && o.apy === 0) return false;

      // Risk filter
      if (risk !== "all" && o.risk !== risk) return false;

      return true;
    });

    Logger.debug(`✅ Filtered to ${result.length} opportunities`);
    return result;
  }, [opportunities, risk]);

  const sorted = React.useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const rankRisk = (r: string) => (r === "Low" ? 1 : r === "Medium" ? 2 : 3);

    const result = [...filtered].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let va: any, vb: any;

      if (sort.key === "risk") {
        va = rankRisk(a.risk);
        vb = rankRisk(b.risk);
      } else {
        va = a[sort.key as keyof CardOpportunity];
        vb = b[sort.key as keyof CardOpportunity];
      }

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    Logger.debug(
      `📈 Sorted ${result.length} opportunities by ${sort.key} ${sort.dir}`,
    );
    return result;
  }, [filtered, sort]);

  // Update displayed stats based on filtered results
  const displayStats = React.useMemo(() => {
    const count = filtered.length;
    const avgAPR = count ? filtered.reduce((a, o) => a + o.apr, 0) / count : 0; // Already percent
    const sumTVL = filtered.reduce((a, o) => a + o.tvlUsd, 0);

    Logger.debug(
      `📊 Display stats: count=${count}, avgAPR=${avgAPR.toFixed(1)}%, totalTVL=$${(sumTVL / 1_000_000).toFixed(1)}M`,
    );

    return {
      avgApr7d: avgAPR,
      totalTvlUsd: sumTVL,
      results: count,
    };
  }, [filtered]);

  
  return (
    <>
      <Head>
        <title>Yield Opportunities | Reset</title>
        <meta
          name="description"
          content="Explore the best yield farming opportunities across Stellar. Find the highest APR/APY rates live today."
        />
        <meta property="og:title" content="Yield Opportunities | Reset" />
        <meta
          property="og:description"
          content="Explore the best yield farming opportunities across Stellar. Find the highest APR/APY rates live today."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Yield Opportunities | Reset" />
        <meta
          name="twitter:description"
          content="Explore the best yield farming opportunities across Stellar. Find the highest APR/APY rates live today."
        />
      </Head>
      <main className="relative overflow-hidden bg-[#050505] pb-20 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at top, rgba(240,145,44,0.08), transparent 55%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <HeroHeader
          title="Explore Yield Opportunities"
          size="standard"
          // Multi-chain support enabled
          kpis={<HeroKpiBar kpis={displayStats} />}
        />

        <div className="relative z-10 -mt-4">
          <AnimatedFilterBar
            defaultRisk={
              risk === "Medium"
                ? "medium"
                : risk === "High"
                  ? "high"
                  : risk === "Low"
                    ? "low"
                    : "all"
            }
            defaultSort={
              `${sort.key === "tvlUsd" ? "tvl" : sort.key}-${sort.dir}` as
                | "apr-desc"
                | "apr-asc"
                | "apy-desc"
                | "apy-asc"
                | "tvl-desc"
                | "tvl-asc"
                | "risk-desc"
                | "risk-asc"
            }
            onRiskChange={(r) => {
              Logger.debug(`🎯 Risk filter changed: '${r}'`);
              const mapped =
                r === "medium"
                  ? "Medium"
                  : r === "high"
                    ? "High"
                    : r === "low"
                      ? "Low"
                      : "all";
              setRisk(mapped as typeof risk);
            }}
            onSortChange={(s) => {
              const [sortKey, dir] = s.split("-") as [string, "asc" | "desc"];
              const key = (
                sortKey === "tvl" ? "tvlUsd" : sortKey
              ) as keyof CardOpportunity;
              Logger.debug(`📈 Sort changed: ${key} ${dir}`);
              setSort({ key, dir });
            }}
          />
        </div>

        <section className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:py-8" style={{zIndex: 1}}>
          {error ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <OpportunityCardPlaceholder key={i} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState
              onReset={() => {
                Logger.info("🔄 Resetting all filters to default values");
                setRisk("all");
                setSort({ key: "apr", dir: "desc" });
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((o, index) => {
                Logger.debug(
                  `🃏 Rendering opportunity ${index + 1}/${sorted.length}: ${o.protocol} - ${o.pair}`,
                );
                return (
                  <OpportunityCard
                    key={o.id}
                    data={o}
                    disabled={false}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
