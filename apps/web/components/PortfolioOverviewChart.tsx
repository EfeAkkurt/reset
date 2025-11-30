"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

type Period = "24H" | "7D" | "30D" | "90D";
type Row = { t: string; total: number; pnl: number; chg24h: number };

const PERIOD_OPTIONS: Period[] = ["24H", "7D", "30D", "90D"];

const RANGE_CONFIG: Record<
  Period,
  { points: number; stepMinutes: number; queryDays: number }
> = {
  "24H": { points: 24, stepMinutes: 60, queryDays: 1 },
  "7D": { points: 7, stepMinutes: 1440, queryDays: 7 },
  "30D": { points: 30, stepMinutes: 1440, queryDays: 30 },
  "90D": { points: 90, stepMinutes: 1440, queryDays: 90 },
};

function demo(points = 30, stepMinutes = 1440): Row[] {
  const out: Row[] = [];
  let total = 100000;
  let pnl = 0;
  const baseDate = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const dt = new Date(baseDate - i * stepMinutes * 60_000);
    const r = (Math.random() - 0.45) * 0.02;
    const change = total * r;
    total = Math.max(2000, total + change);
    pnl += change * 0.4;
    out.push({
      t: dt.toISOString().slice(0, 10),
      total: Math.round(total),
      pnl: Math.round(pnl),
      chg24h: Math.round(change),
    });
  }
  return out;
}

export default function PortfolioOverviewChart({
  data,
  className,
  period = "30D",
  onPeriodChange,
}: {
  data?: Row[];
  className?: string;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
}) {
  const reduceMotion = useReducedMotion();
  const config = RANGE_CONFIG[period];
  const chartData = useMemo(() => {
    const source = data?.length ? data : demo(config.points, config.stepMinutes);
    if (!source.length) return [];
    const trimmed =
      source.length > config.points
        ? source.slice(source.length - config.points)
        : source;
    return trimmed;
  }, [data, config.points, config.stepMinutes]);

  const kpis = useMemo(() => {
    if (!chartData.length) {
      return {
        total: 0,
        pnl: 0,
        changePct: 0,
        changeLabel: "Change",
        volume: 0,
        participants: 0,
        apr: 0,
      };
    }
    const last = chartData.at(-1)!;
    const first = chartData[0]!;
    const changePct = ((last.total - first.total) / first.total) * 100;
    return {
      total: last.total,
      pnl: last.pnl,
      changePct,
      changeLabel:
        period === "24H" ? "24H Change" : `${period} Performance`,
      volume: Math.abs(last.chg24h * 12),
      participants: Math.max(72, Math.round(last.total / 90000)),
      apr: Math.max(0, ((last.pnl - (chartData.at(-2)?.pnl ?? 0)) / last.total) * 100),
    };
  }, [chartData, period]);

  const projections = useMemo(() => {
    const base = kpis.total;
    return [7, 30, 90].map((h) => {
      const projectedApy = Math.max(0, kpis.apr * (h / 30));
      const gain = (base * projectedApy) / 100;
      const confidence =
        gain > base * 0.015 ? "High" : gain > base * 0.008 ? "Medium" : "Low";
      return { horizon: h, projectedApy, gain, confidence };
    });
  }, [kpis.apr, kpis.total]);

  return (
    <motion.section
      id="portfolio-overview"
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={clsx(
        "relative overflow-hidden rounded-[40px] border border-[rgba(255,182,72,0.18)] bg-[#121214] p-8 text-white shadow-[0_45px_120px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-70" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]/70">
              Reset Portfolio
            </p>
            <h3 className="mt-2 font-display text-3xl font-black">
              Portfolio Overview
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-[#D8D9DE]/80">
              Total portfolio telemetry with institutional-grade risk tracking
              and engineered charting.
            </p>
          </div>
          <div className="inline-flex items-center rounded-full bg-black/40 p-1 ring-1 ring-white/5">
            {PERIOD_OPTIONS.map((option) => (
              <TimeframeButton
                key={option}
                label={option}
                active={period === option}
                onClick={() => onPeriodChange?.(option)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricBadge
            label="Current APR"
            value={kpis.apr}
            suffix="%"
            tone={kpis.apr >= 0 ? "positive" : "negative"}
          />
          <MetricBadge label="TVL (USD)" value={kpis.total} prefix="$" />
          <MetricBadge label="24H Volume" value={kpis.volume} prefix="$" />
          <MetricBadge
            label="Participants"
            value={kpis.participants}
            suffix=""
          />
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#151618] to-[#0A0B0C] p-5 shadow-inner shadow-black/60">
          <div className="pointer-events-none absolute inset-2 rounded-[24px] border border-white/5 opacity-40" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px]" />
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 text-sm text-[#CED1DB]">
            <span>TVL (area) • Net PnL (line) • 24H Change (bars)</span>
            <span className="text-xs uppercase tracking-[0.01em] text-[#D8D9DE]/70">
              Live charting
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 20, bottom: 0, left: -10 }}
              >
                <defs>
                  <linearGradient id="portfolioArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F3A233" stopOpacity={0.4} />
                    <stop offset="90%" stopColor="#C77E25" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 6"
                />
                <Tooltip content={<Tip />} cursor={{ strokeDasharray: "3 3" }} />
                <XAxis
                  dataKey="t"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                  width={80}
                  tickFormatter={(value) =>
                    `$${Intl.NumberFormat("en-US", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(value)}`
                  }
                />
                <Bar
                  dataKey="chg24h"
                  fill="rgba(45,225,186,0.35)"
                  radius={[4, 4, 2, 2]}
                  name="24H Change"
                  barSize={10}
                  isAnimationActive={!reduceMotion}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Value"
                  stroke="#F3A233"
                  strokeWidth={3}
                  fill="url(#portfolioArea)"
                  isAnimationActive={!reduceMotion}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  name="Net PnL"
                  stroke="#8BCBFF"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={!reduceMotion}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#A2A8B7]">
            <LegendSwatch color="#F3A233" label="Total Value" />
            <LegendSwatch color="#8BCBFF" label="Net PnL" />
            <LegendSwatch color="#2DE1BA" label="24H Change" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {projections.map((proj) => (
            <ProjectionCard key={proj.horizon} {...proj} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function MetricBadge({
  label,
  value,
  prefix = "",
  suffix = "",
  tone = "neutral",
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-rose-300"
        : "text-white";
  return (
    <div className="group rounded-3xl border border-white/10 bg-[#17181D] px-5 py-4 shadow-inner shadow-black/30">
      <p className="text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]/70">
        {label}
      </p>
      <p className={clsx("mt-2 font-mono text-3xl", toneClass)}>
        {prefix}
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        {suffix}
      </p>
      <div className="mt-3 h-px w-10 bg-[rgba(255,182,72,0.25)] transition-all group-hover:w-20 group-hover:bg-[#F3A233]" />
    </div>
  );
}

function TimeframeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] transition",
        active
          ? "bg-[#F3A233] text-black shadow-[0_0_30px_rgba(243,162,51,0.35)]"
          : "text-[#D8D9DE]/70 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row: Record<string, number> = {};
  payload.forEach((p) => (row[p.dataKey] = p.value));
  return (
    <div className="rounded-2xl border border-[rgba(255,182,72,0.3)] bg-[#0B0B0E]/95 px-4 py-3 text-sm text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      <p className="text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]/60">
        {label}
      </p>
      {"total" in row && (
        <p className="mt-2 font-mono text-base">
          Total · ${row.total.toLocaleString()}
        </p>
      )}
      {"pnl" in row && (
        <p className="font-mono text-base text-[#4DB4FF]">
          Net PnL · ${row.pnl.toLocaleString()}
        </p>
      )}
      {"chg24h" in row && (
        <p className="text-xs text-[#16A34A]">
          24H Change · ${row.chg24h.toLocaleString()}
        </p>
      )}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-1 w-8 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function ProjectionCard({
  horizon,
  projectedApy,
  gain,
  confidence,
}: {
  horizon: number;
  projectedApy: number;
  gain: number;
  confidence: string;
}) {
  const confidenceTone =
    confidence === "High"
      ? "text-emerald-300"
      : confidence === "Medium"
        ? "text-amber-200"
        : "text-rose-200";
  return (
    <div className="rounded-3xl border border-white/10 bg-[#101115] px-5 py-4 shadow-inner shadow-black/40">
      <p className="text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]/70">
        {horizon}d Projection
      </p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-[#9EA2B3]">Projected APY</span>
        <span className="font-mono text-xl text-white">
          {projectedApy.toFixed(2)}%
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-[#9EA2B3]">Expected gain</span>
        <span className="font-mono text-lg text-white">
          ${gain.toFixed(2)}
        </span>
      </div>
      <p className={clsx("mt-2 text-xs uppercase tracking-[0.01em]", confidenceTone)}>
        {confidence} confidence
      </p>
    </div>
  );
}
