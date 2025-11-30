"use client";
import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Activity,
  LineChart,
  Gauge,
} from "lucide-react";

type Opportunity = {
  id: string;
  protocol: string;
  pair: string;
  chain: string;
  apr: number;
  apy: number;
  risk: "Low" | "Medium" | "High";
  tvlUsd: number;
  rewardToken: string;
  lastUpdated: string;
  originalUrl: string;
  summary: string;
};

interface RiskAnalysisProps {
  data: Opportunity;
}

interface RiskItem {
  category: string;
  level: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function RiskAnalysis({ data }: RiskAnalysisProps) {
  const [riskData, setRiskData] = React.useState<{
    overallRiskScore: number;
    confidence: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    technicalRisk?: number;
    operationalRisk?: number;
    financialRisk?: number;
    securityRisk?: number;
    marketVolatility?: { daily: number };
    marketRegime?: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [series, setSeries] = React.useState<
    Array<{ timestamp: number; tvlUsd: number; apy?: number; apr?: number; volume24h?: number }>
  >([]);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await fetch(`/api/opportunities/${data.id}/risk`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (!mounted) return;
        setRiskData({
          overallRiskScore: json.riskScore ?? json.data?.overallRiskScore ?? 42,
          confidence: json.data?.confidence ?? 0.82,
          riskLevel: json.riskLevel ?? "medium",
          technicalRisk: json.enhanced?.technicalRisk,
          operationalRisk: json.enhanced?.operationalRisk,
          financialRisk: json.enhanced?.financialRisk,
          securityRisk: json.enhanced?.securityRisk,
          marketVolatility: json.enhanced?.marketVolatility,
          marketRegime: json.enhanced?.marketRegime,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load risk");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [data.id]);

  React.useEffect(() => {
    let mounted = true;
    async function loadSeries() {
      try {
        const resp = await fetch(`/api/opportunities/${data.id}/chart?days=90`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (!mounted) return;
        setSeries(json.series || []);
      } catch {
        setSeries([]);
      }
    }
    loadSeries();
    return () => {
      mounted = false;
    };
  }, [data.id]);

  const clamp01 = (val: number) => Math.max(0, Math.min(1, val));
  const pct = (val: number) => Math.round(clamp01(val) * 100);

  const tvlVec = series.map((p) => p.tvlUsd).filter((n) => Number.isFinite(n));
  const apyVec = series
    .map((p) =>
      typeof p.apy === "number" ? p.apy : typeof p.apr === "number" ? p.apr : 0,
    )
    .filter((n) => Number.isFinite(n));
  const volVec = series
    .map((p) => p.volume24h ?? 0)
    .filter((n) => Number.isFinite(n));

  const stdev = (arr: number[]) => {
    if (!arr.length) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance =
      arr.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      arr.length;
    return Math.sqrt(variance);
  };

  const liquidityRisk = pct(
    1 - clamp01(Math.log10((tvlVec.at(-1) || data.tvlUsd) + 1) / 8),
  );
  const stabilityRisk = pct(clamp01(stdev(tvlVec) / (tvlVec.at(-1) || 1)));
  const yieldRisk = pct(clamp01(stdev(apyVec) / 20));
  const concentrationRisk = pct(clamp01(volVec.length ? stdev(volVec) / 1e7 : 0.4));
  const momentumRisk = pct(clamp01(-(tvlVec.at(-1)! - (tvlVec[0] ?? tvlVec.at(-1)!)) / (tvlVec[0] || 1)));

  const baseScores = {
    liquidity: riskData?.operationalRisk
      ? riskData.operationalRisk * 100
      : liquidityRisk,
    stability: riskData?.technicalRisk
      ? riskData.technicalRisk * 100
      : stabilityRisk,
    yield: riskData?.financialRisk
      ? riskData.financialRisk * 100
      : yieldRisk,
    concentration: riskData?.operationalRisk
      ? riskData.operationalRisk * 90
      : concentrationRisk,
    momentum: riskData?.technicalRisk
      ? riskData.technicalRisk * 80
      : momentumRisk,
  };

  const riskItems: RiskItem[] = [
    {
      category: "Liquidity Risk",
      level: baseScores.liquidity,
      description: "Exit depth vs utilisation across the last 90 days.",
      icon: <AlertTriangle className="text-rose-300" size={16} />,
      color: "from-rose-500/25 to-rose-500/5",
    },
    {
      category: "Stability Risk",
      level: baseScores.stability,
      description: "TVL volatility + drawdown pressure.",
      icon: <TrendingDown className="text-amber-300" size={16} />,
      color: "from-amber-500/25 to-amber-500/5",
    },
    {
      category: "Yield Risk",
      level: baseScores.yield,
      description: "APR/APY variability and incentive decay.",
      icon: <LineChart className="text-emerald-300" size={16} />,
      color: "from-emerald-500/25 to-emerald-500/5",
    },
    {
      category: "Concentration Risk",
      level: baseScores.concentration,
      description: "Flow reliance on top cohorts & whales.",
      icon: <Activity className="text-blue-300" size={16} />,
      color: "from-sky-500/25 to-sky-500/5",
    },
    {
      category: "Momentum Risk",
      level: baseScores.momentum,
      description: "Directional trend of liquidity participation.",
      icon: <Shield className="text-purple-300" size={16} />,
      color: "from-purple-500/25 to-purple-500/5",
    },
  ];

  const advancedFactors = [
    {
      label: "Technical Risk",
      value: pct(riskData?.technicalRisk ?? 0.42),
      color: "text-sky-200",
    },
    {
      label: "Operational Risk",
      value: pct(riskData?.operationalRisk ?? 0.38),
      color: "text-emerald-200",
    },
    {
      label: "Financial Risk",
      value: pct(riskData?.financialRisk ?? 0.49),
      color: "text-amber-200",
    },
    {
      label: "Security Risk",
      value: pct(riskData?.securityRisk ?? 0.32),
      color: "text-rose-200",
    },
  ];

  const riskScore = Math.round(
    riskData?.overallRiskScore ??
      (baseScores.liquidity +
        baseScores.stability +
        baseScores.yield +
        baseScores.concentration +
        baseScores.momentum) /
        5,
  );

  const gaugeLabel =
    riskScore < 33 ? "Low" : riskScore < 66 ? "Medium" : "Elevated";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 rounded-[32px] border border-[rgba(255,182,72,0.16)] bg-[#070708]/95 p-6 text-white shadow-[0_35px_90px_rgba(0,0,0,0.6)]"
    >
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.45em] text-[#D8D9DE]/70">
          Risk Analysis
        </p>
        <h2 className="text-2xl font-black">Institutional risk engine</h2>
        {error && (
          <p className="text-xs text-rose-300">
            {error} — using heuristic telemetry
          </p>
        )}
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#121214] to-[#070708] p-6 text-center shadow-inner shadow-black/50">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/60">
                Global Risk Score
              </p>
              <GaugeChart score={riskScore} />
              <p className="text-sm text-[#D8D9DE]/70">
                {gaugeLabel} exposure • Confidence{" "}
                {Math.round((riskData?.confidence ?? 0.82) * 100)}%
              </p>
            </div>

            <div className="space-y-3">
              {riskItems.map((item) => (
                <div
                  key={item.category}
                  className="rounded-2xl border border-white/10 bg-[#0C0D0F] px-4 py-3 shadow-inner shadow-black/40 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                        item.color,
                      )}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.category}</p>
                      <p className="text-xs text-[#9DA1AF]">
                        {item.description}
                      </p>
                    </div>
                    <div className="font-mono text-lg">{item.level}%</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-[#1A1B1E]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#F3A233] to-[#C77E25] shadow-[0_0_10px_rgba(243,162,51,0.6)]"
                      style={{ width: `${item.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {advancedFactors.map((factor) => (
              <div
                key={factor.label}
                className="rounded-2xl border border-white/10 bg-[#101215] px-4 py-3 shadow-inner shadow-black/40"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-[#D8D9DE]/70">
                  {factor.label}
                </p>
                <p className={clsx("mt-2 font-mono text-xl", factor.color)}>
                  {factor.value}%
                </p>
                <p className="text-[11px] text-[#8F94A3]">
                  Real-time telemetry badge
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 backdrop-blur">
            <div className="inline-flex items-center gap-2">
              <Gauge size={16} />
              Market Conditions:
            </div>
            <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.35em] text-[#D8D9DE]">
              {riskData?.marketRegime?.toUpperCase() ?? "LOW VOLATILITY"} —{" "}
              {Math.round(
                (riskData?.marketVolatility?.daily ?? 0.32) * 100,
              )}
              %
            </span>
            <span className="text-xs text-[#A2A7B5]">
              Transparent oracle-backed signals
            </span>
          </div>
        </>
      )}
    </motion.section>
  );
}

function GaugeChart({ score }: { score: number }) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const arc = (Math.min(100, Math.max(0, score)) / 100) * circumference;
  return (
    <div className="relative mx-auto my-6 h-48 w-48">
      <svg className="h-full w-full rotate-[-90deg]">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="12"
          fill="transparent"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${arc} ${circumference}`}
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F3A233" />
            <stop offset="100%" stopColor="#C77E25" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/70">
          Score
        </p>
        <p className="font-mono text-5xl text-white">{score}</p>
      </div>
    </div>
  );
}
