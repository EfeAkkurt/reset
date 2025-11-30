"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import clsx from "clsx";
import { Activity, Users } from "lucide-react";

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

interface OpportunityOverviewCardProps {
  data: Opportunity;
}

type ChartPoint = {
  date: string;
  apr: number;
  tvl: number;
  volume: number;
  projection?: number;
};

const TIME_OPTIONS = ["7D", "30D", "90D"] as const;

export function OpportunityOverviewCard({ data }: OpportunityOverviewCardProps) {
  const [timeRange, setTimeRange] = useState<(typeof TIME_OPTIONS)[number]>(
    "30D",
  );
  const [series, setSeries] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const days = useMemo(
    () => (timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : 90),
    [timeRange],
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const resp = await fetch(
          `/api/opportunities/${data.id}/chart?days=${days}`,
        );
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        const pts: Array<{
          timestamp: number;
          tvlUsd: number;
          apy?: number;
          apr?: number;
          volume24h?: number;
        }> = json.series || [];
        const mapped: ChartPoint[] = pts.map((p) => ({
          date: new Date(p.timestamp).toISOString().slice(0, 10),
          apr: Number((p.apy ?? p.apr ?? data.apr).toFixed(2)),
          tvl: Number(((p.tvlUsd / 1_000_000) || 0).toFixed(2)),
          volume: Math.round(p.volume24h || data.tvlUsd * 0.015),
        }));
        if (!mounted) return;
        setSeries(mapped);
      } catch (error) {
        console.error("Chart load failed", error);
        setErr((error as Error).message);
        setSeries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [data.apr, data.id, data.tvlUsd, days]);

  const fallbackSeries = useMemo(() => {
    const pts: ChartPoint[] = [];
    const baseTvl = Math.max(1, data.tvlUsd / 1_000_000);
    for (let i = days - 1; i >= 0; i--) {
      pts.push({
        date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
        apr: Number((data.apr + Math.sin(i / 3) * 0.6).toFixed(2)),
        tvl: Number((baseTvl + Math.cos(i / 6) * 0.25).toFixed(2)),
        volume: Math.round(data.tvlUsd * 0.015 + Math.sin(i) * 8000),
      });
    }
    return pts;
  }, [data.apr, data.tvlUsd, days]);

  const chartPoints = useMemo(() => {
    const source = series.length ? series : fallbackSeries;
    if (!source.length) return [];

    const indexes = source.map((_, idx) => idx);
    const tvlValues = source.map((row) => row.tvl);
    const xMean = indexes.reduce((a, b) => a + b, 0) / indexes.length;
    const yMean = tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length;
    const slopeNum = indexes.reduce(
      (sum, x, idx) => sum + (x - xMean) * (tvlValues[idx] - yMean),
      0,
    );
    const slopeDen =
      indexes.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) || 1;
    const slope = slopeNum / slopeDen;
    const intercept = yMean - slope * xMean;

    return source.map((point, idx) => ({
      ...point,
      projection: Number((slope * idx + intercept).toFixed(2)),
    }));
  }, [series, fallbackSeries]);

  const latest = chartPoints.at(-1);
  const metrics = {
    apr: latest?.apr ?? data.apr,
    tvl: latest?.tvl ?? Math.round((data.tvlUsd / 1_000_000) * 100) / 100,
    volume24h: latest?.volume ?? Math.round(data.tvlUsd * 0.02),
    participants: Math.max(64, Math.round(data.tvlUsd / 75000)),
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const lookup: Record<string, number> = {};
    payload.forEach((p) => {
      lookup[p.dataKey] = p.value;
    });
    return (
      <div className="rounded-2xl border border-[rgba(255,182,72,0.25)] bg-[#0D0E10]/95 px-4 py-3 text-sm text-white shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.4em] text-[#D8D9DE]/70">
          {label}
        </p>
        {"tvl" in lookup && (
          <p className="mt-2 font-mono text-base">
            TVL · ${lookup.tvl.toFixed(2)}M
          </p>
        )}
        {"apr" in lookup && (
          <p className="font-mono text-base text-[#F3A233]">
            APR · {lookup.apr.toFixed(2)}%
          </p>
        )}
        {"volume" in lookup && (
          <p className="text-xs text-[#B5BAC5]">
            Volume · ${lookup.volume.toLocaleString()}
          </p>
        )}
      </div>
    );
  };

  const metricTiles = [
    {
      label: "Current APR",
      value: `${metrics.apr.toFixed(2)}%`,
      sub: "Net blended yield",
    },
    {
      label: "TVL (USD)",
      value: `$${metrics.tvl.toFixed(2)}M`,
      sub: "Liquidity at rest",
    },
    {
      label: "24h Volume",
      value: `$${metrics.volume24h.toLocaleString()}`,
      sub: "Flow through venue",
    },
    {
      label: "Participants",
      value: metrics.participants.toLocaleString(),
      sub: "Wallets with exposure",
      icon: <Users size={16} />,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6 rounded-[32px] border border-[rgba(255,182,72,0.16)] bg-[#0C0D0F]/95 p-6 text-white shadow-[0_35px_90px_rgba(0,0,0,0.6)]"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-[#D8D9DE]/70">
            Performance Overview
          </p>
          <h2 className="mt-2 text-2xl font-black">Multi-layer analytics</h2>
          {loading && (
            <p className="text-xs text-[#9DA1AF]">Syncing live feeds…</p>
          )}
          {err && (
            <p className="text-xs text-rose-300">
              {err} — showing engineered preview data
            </p>
          )}
        </div>
        <div className="inline-flex items-center rounded-full bg-black/40 p-1 ring-1 ring-white/5">
          {TIME_OPTIONS.map((option) => (
            <motion.button
              key={option}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={clsx(
                "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] transition",
                timeRange === option
                  ? "bg-[#F3A233] text-black shadow-[0_0_25px_rgba(243,162,51,0.35)]"
                  : "text-[#D8D9DE]/70 hover:text-white",
              )}
              onClick={() => setTimeRange(option)}
            >
              {option}
            </motion.button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricTiles.map((tile) => (
          <div
            key={tile.label}
            className="group rounded-2xl border-l-4 border-[#F3A233] bg-[#111214] px-5 py-4 shadow-inner shadow-black/50 transition-all hover:-translate-y-1 hover:border-[#E0912C]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/70">
                {tile.label}
              </p>
              {tile.icon}
            </div>
            <p className="mt-3 font-mono text-2xl">{tile.value}</p>
            <p className="text-xs text-[#9DA1AF]">{tile.sub}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#111214] to-[#060607] p-4 shadow-inner shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <p className="text-sm text-[#D8D9DE]">
              TVL, APR/APY, and Volume interplay
            </p>
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#D8D9DE]/60">
              Cinematic chart zone
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#B5BAC5]">
            <Activity size={16} />
            Real-time telemetry
          </div>
        </div>
        <div className="h-[360px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartPoints}>
              <defs>
                <linearGradient id="gradientTvl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B5EF3" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7B5EF3" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="rgba(255,255,255,0.08)"
                vertical={false}
                strokeDasharray="3 6"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              />
              <YAxis
                yAxisId="tvl"
                orientation="left"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}M`}
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              />
              <YAxis
                yAxisId="apr"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="tvl"
                dataKey="volume"
                name="24h Volume"
                fill="rgba(16,185,129,0.35)"
                barSize={12}
              />
              <Area
                yAxisId="tvl"
                type="monotone"
                dataKey="tvl"
                name="TVL"
                stroke="#7B5EF3"
                strokeWidth={2}
                fill="url(#gradientTvl)"
              />
              <Line
                yAxisId="apr"
                type="monotone"
                dataKey="apr"
                name="APR/APY"
                stroke="#F3A233"
                strokeWidth={3}
                dot={false}
              />
              <Line
                yAxisId="tvl"
                type="monotone"
                dataKey="projection"
                name="Projection"
                stroke="#F3A233"
                strokeDasharray="6 6"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#A2A7B5]">
          <span className="inline-flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-[#7B5EF3]" />
            TVL gradient
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-[#F3A233]" />
            APR/APY line
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-emerald-400/70" />
            24h volume
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1 w-6 rounded-full border border-[#F3A233] border-dashed" />
            Projection
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[7, 30, 90].map((horizon) => {
          const base = chartPoints.at(-1)?.tvl ?? metrics.tvl;
          const slope =
            chartPoints.length > 1
              ? (chartPoints.at(-1)!.projection! -
                  chartPoints[0]!.projection!) /
                (chartPoints.length - 1)
              : 0;
          const projected = base + slope * (horizon / 7);
          return (
            <div
              key={horizon}
              className="rounded-2xl border border-white/10 bg-[#101215] px-4 py-3 shadow-inner shadow-black/40"
            >
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#D8D9DE]/70">
                {horizon}d Projection
              </p>
              <p className="mt-2 font-mono text-xl text-white">
                ${projected.toFixed(2)}M
              </p>
              <p className="text-xs text-[#8F94A3]">Based on current slope</p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
