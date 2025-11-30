"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Bar,
  Line,
} from "recharts";
import clsx from "clsx";

// --- Types ---

export type OpportunityPoint = {
  timestamp: string; // ISO string
  tvlUsd: number;
  apr: number; // in %
  apy: number; // in %
  volume24hUsd: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
};

export type TimeRange = "1H" | "6H" | "24H" | "7D" | "30D" | "90D";
export type ChartMode = "overview" | "yield" | "volume" | "price";

interface CinematicOpportunityChartProps {
  data?: OpportunityPoint[]; // Optional for now, will use mock if missing
  initialTimeRange?: TimeRange;
  initialMode?: ChartMode;
}

// --- Helper Components ---

const TimeRangePill = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(224,145,44,0.15)" }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={clsx(
      "relative rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
      active
        ? "bg-[var(--gold-500)] text-black"
        : "border border-[rgba(216,217,222,0.18)] bg-[rgba(255,255,255,0.02)] text-[var(--text-2)] hover:border-[var(--gold-500)] hover:text-white"
    )}
  >
    {label}
  </motion.button>
);

const ChartModePill = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={clsx(
      "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
      active
        ? "bg-[rgba(224,145,44,0.15)] text-[var(--gold-500)] ring-1 ring-[var(--gold-500)]"
        : "text-[var(--text-2)] hover:text-white"
    )}
  >
    {label}
  </motion.button>
);

const LegendDot = ({
  color,
  label,
}: {
  color: string;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    <div
      className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
      style={{ background: color }}
    />
    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-2)]/80">
      {label}
    </span>
  </div>
);

// --- Mock Data Generator ---

const generateMockData = (range: TimeRange): OpportunityPoint[] => {
  const now = Date.now();
  const points: OpportunityPoint[] = [];
  let count = 90;
  let interval = 24 * 60 * 60 * 1000; // 1 day

  if (range === "1H") {
    count = 60;
    interval = 60 * 1000; // 1 min
  } else if (range === "6H") {
    count = 72;
    interval = 5 * 60 * 1000; // 5 min
  } else if (range === "24H") {
    count = 48;
    interval = 30 * 60 * 1000; // 30 min
  } else if (range === "7D") {
    count = 84;
    interval = 2 * 60 * 60 * 1000; // 2 hours
  }

  let baseTvl = 185000000;
  let baseApr = 8.5;
  let baseVol = 2500000;

  for (let i = count; i >= 0; i--) {
    const time = now - i * interval;
    // Add some random walk
    baseTvl += (Math.random() - 0.5) * 1000000;
    baseApr += (Math.random() - 0.5) * 0.2;
    baseVol += (Math.random() - 0.5) * 500000;

    // Ensure bounds
    baseVol = Math.max(500000, baseVol);

    points.push({
      timestamp: new Date(time).toISOString(),
      tvlUsd: baseTvl,
      apr: baseApr,
      apy: baseApr * 1.05, // slightly higher
      volume24hUsd: baseVol,
    });
  }
  return points;
};

// --- Main Component ---

/**
 * Cinematic Analytics Chart
 * Inspired by award-level DeFi dashboards (multi-metric, multi-axis, cinematic look).
 * Ready to plug into live Stellar yield data.
 */
export function CinematicOpportunityChart({
  data: propData,
  initialTimeRange = "30D",
  initialMode = "overview",
}: CinematicOpportunityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [mode, setMode] = useState<ChartMode>(initialMode);
  const [chartData, setChartData] = useState<OpportunityPoint[]>([]);

  // Simulate data fetching/aggregation
  useEffect(() => {
    if (propData && propData.length > 0) {
      // In a real app, we would filter propData based on timeRange here
      setChartData(propData);
    } else {
      setChartData(generateMockData(timeRange));
    }
  }, [timeRange, propData]);

  // Formatters
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    if (timeRange === "1H" || timeRange === "6H" || timeRange === "24H") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Custom Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const pt = payload[0].payload as OpportunityPoint;

    return (
      <div className="rounded-2xl border border-[rgba(255,182,72,0.3)] bg-[rgba(10,10,10,0.95)] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--text-2)]/70">
          {new Date(pt.timestamp).toLocaleString()}
        </p>
        <div className="space-y-1 font-mono text-sm">
          <div className="flex items-center justify-between gap-6">
            <span className="text-[var(--text-2)]">TVL</span>
            <span className="text-white">
              ${(pt.tvlUsd / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-[var(--text-2)]">Yield</span>
            <span className="text-[var(--gold-400)]">
              APR {pt.apr.toFixed(2)}% • APY {pt.apy.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-[var(--text-2)]">Vol</span>
            <span className="text-emerald-400">
              ${(pt.volume24hUsd / 1000000).toFixed(2)}M
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="flex h-full flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-2)]/70">
            PERFORMANCE OVERVIEW
          </p>
          <h3 className="mt-1 text-sm font-medium tracking-[0.14em] text-[var(--text)] md:text-base">
            Multi-layer analytics
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
            {(["overview", "yield", "volume"] as ChartMode[]).map((m) => (
              <ChartModePill
                key={m}
                active={mode === m}
                label={m}
                onClick={() => setMode(m)}
              />
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1">
            {(["1H", "6H", "24H", "7D", "30D", "90D"] as TimeRange[]).map((t) => (
              <TimeRangePill
                key={t}
                active={timeRange === t}
                label={t}
                onClick={() => setTimeRange(t)}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Chart Container */}
      <div className="relative flex-1 rounded-3xl border border-[rgba(255,182,72,0.14)] bg-[radial-gradient(circle_at_top_left,rgba(224,145,44,0.08),transparent_55%),linear-gradient(to_bottom,#121214,#0A0A0A)] px-2 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.75)] md:px-6 md:py-5">
        <div className="absolute left-6 top-5 z-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-2)]/60">
            Cinematic chart zone
          </p>
        </div>

        <div className="h-[320px] w-full pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={timeRange + mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F3A233" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#C77E25" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6FCF97" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#6FCF97" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 7"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                    dy={10}
                  />

                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={formatCurrency}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={formatPercent}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                    width={40}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: "rgba(255,255,255,0.2)",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />

                  {/* Volume Bar */}
                  <Bar
                    dataKey="volume24hUsd"
                    yAxisId="left"
                    barSize={mode === "volume" ? 8 : 4}
                    fill={
                      mode === "volume"
                        ? "url(#volGradient)"
                        : "rgba(111, 207, 151, 0.42)"
                    }
                    radius={[4, 4, 0, 0]}
                    opacity={mode === "yield" ? 0.3 : mode === "volume" ? 1 : 0.75}
                    animationDuration={1000}
                  />

                  {/* TVL Area/Bar */}
                  {mode !== "volume" && (
                    <Area
                      type="monotone"
                      dataKey="tvlUsd"
                      yAxisId="left"
                      stroke="none"
                      fill="url(#tvlGradient)"
                      fillOpacity={mode === "yield" ? 0.2 : 0.25}
                      animationDuration={1000}
                    />
                  )}

                  {/* APY Line */}
                  <Line
                    type="monotone"
                    dataKey="apy"
                    yAxisId="right"
                    stroke="#E0912C"
                    strokeWidth={mode === "yield" ? 3 : 2.2}
                    dot={
                      mode === "yield"
                        ? { r: 4, fill: "#E0912C", stroke: "#000", strokeWidth: 2 }
                        : false
                    }
                    activeDot={{
                      r: 6,
                      fill: "#E0912C",
                      stroke: "rgba(224,145,44,0.5)",
                      strokeWidth: 4,
                    }}
                    animationDuration={1500}
                  />

                  {/* APR Line (only in yield mode) */}
                  {mode === "yield" && (
                    <Line
                      type="monotone"
                      dataKey="apr"
                      yAxisId="right"
                      stroke="#60A5FA" // Soft blue for APR
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#60A5FA", stroke: "#000", strokeWidth: 1 }}
                      strokeDasharray="4 4"
                      animationDuration={1500}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
          </section>
  );
}
