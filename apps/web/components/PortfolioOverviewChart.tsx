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
import CountUp from "react-countup";
import clsx from "clsx";

type Period = "24H" | "7D" | "30D";
type Row = { t: string; total: number; pnl: number; chg24h: number };

const PERIOD_OPTIONS: Period[] = ["24H", "7D", "30D"];

function demo(rows = 30): Row[] {
  const out: Row[] = [];
  let total = 100000;
  let pnl = 0;
  const baseDate = new Date(Math.floor(Date.now() / 86400000) * 86400000);
  for (let i = rows - 1; i >= 0; i--) {
    const dt = new Date(baseDate.getTime() - i * 86400000);
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
  const periodDays = period === "24H" ? 1 : period === "7D" ? 7 : 30;
  const chartData = useMemo(
    () => (data?.length ? data : demo(periodDays)),
    [data, periodDays],
  );
  const reduceMotion = useReducedMotion();

  const kpis = useMemo(() => {
    const last = chartData.at(-1)!;
    const first = chartData[0]!;
    const periodLabel =
      period === "24H" ? "24 Hours" : period === "7D" ? "7 Days" : "30 Days";
    const changePct = ((last.total - first.total) / first.total) * 100;
    return {
      total: last.total,
      pnl: last.pnl,
      changePct,
      change24h: last.chg24h,
      periodLabel,
    };
  }, [chartData, period]);

  return (
    <motion.section
      id="portfolio-overview"
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={clsx(
        "relative overflow-hidden rounded-[32px] border border-[rgba(255,182,72,0.16)] bg-gradient-to-b from-[#1B1C1F] via-[#111214] to-[#08080A] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.65)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-40" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-[#D8D9DE]/70">
              Reset Portfolio
            </p>
            <h3 className="mt-2 font-display text-3xl font-black">
              Portfolio Overview
            </h3>
            <p className="mt-2 text-sm text-[#D8D9DE]/80">
              Wealth-management telemetry with total portfolio, net PnL, and
              risk-aligned change signals.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-black/30 p-1 ring-1 ring-white/5">
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

        <div className="grid gap-3 md:grid-cols-3">
          <MetricBadge label="Total Portfolio">
            <CountUp end={kpis.total} duration={0.8} prefix="$" separator="," />
          </MetricBadge>
          <MetricBadge
            label="Net PnL"
            tone={kpis.pnl >= 0 ? "positive" : "negative"}
          >
            <CountUp
              end={Math.abs(kpis.pnl)}
              duration={0.8}
              prefix={kpis.pnl >= 0 ? "+$" : "-$"}
              separator=","
            />
          </MetricBadge>
          <MetricBadge
            label={`${kpis.periodLabel} Change`}
            tone={kpis.changePct >= 0 ? "positive" : "negative"}
          >
            <CountUp
              end={Math.abs(kpis.changePct)}
              duration={0.8}
              decimals={2}
              prefix={kpis.changePct >= 0 ? "+ " : "- "}
              suffix="%"
            />
          </MetricBadge>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 20, bottom: 0, left: -10 }}
            >
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B266FF" stopOpacity={0.35} />
                  <stop offset="85%" stopColor="#6B32C9" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#6B32C9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="3 8"
              />
              <Tooltip content={<Tip />} cursor={{ strokeDasharray: "3 3" }} />
              <XAxis
                dataKey="t"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "#9A9CA5", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "#9A9CA5", fontSize: 12 }}
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
                fill="rgba(88,226,117,0.55)"
                radius={[3, 3, 0, 0]}
                barSize={8}
                name="24H Change"
                isAnimationActive={!reduceMotion}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Portfolio Value"
                stroke="#D05BFF"
                strokeWidth={3}
                fill="url(#gTotal)"
                isAnimationActive={!reduceMotion}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                name="Net PnL"
                stroke="#5CB4FF"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={!reduceMotion}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.section>
  );
}

function MetricBadge({
  label,
  children,
  tone = "neutral",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneColor =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-rose-300"
        : "text-white";
  return (
    <div className="group rounded-2xl border border-white/8 bg-[#151518] px-5 py-4 shadow-inner shadow-black/40">
      <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#D8D9DE]/60">
        {label}
      </div>
      <div
        className={clsx(
          "mt-2 font-mono text-2xl tabular-nums text-white",
          toneColor,
        )}
      >
        {children}
      </div>
      <div className="mt-3 h-[1px] w-12 bg-[rgba(255,182,72,0.16)] transition-all group-hover:w-20 group-hover:bg-[#F3A233]" />
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
        "rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.45em] transition",
        active
          ? "bg-[#F3A233] text-black shadow-[0_0_25px_rgba(243,162,51,0.45)]"
          : "text-[#D8D9DE]/60 hover:text-white",
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
    <div className="rounded-2xl border border-white/10 bg-[#0C0C0D] px-4 py-3 text-sm text-white shadow-[0_15px_45px_rgba(0,0,0,0.65)]">
      <div className="text-[11px] uppercase tracking-[0.4em] text-[#D8D9DE]/60">
        {label}
      </div>
      <div className="mt-2 space-y-1 text-[13px]">
        {"total" in row && (
          <div>Total · ${Intl.NumberFormat().format(row.total)}</div>
        )}
        {"pnl" in row && (
          <div>Net PnL · ${Intl.NumberFormat().format(row.pnl)}</div>
        )}
        {"chg24h" in row && (
          <div>24H Change · ${Intl.NumberFormat().format(row.chg24h)}</div>
        )}
      </div>
    </div>
  );
}
