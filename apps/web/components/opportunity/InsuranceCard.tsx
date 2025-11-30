"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheckIcon, Activity, Zap } from "lucide-react";
import clsx from "clsx";

type Tier = "basic" | "standard" | "plus";

type Props = {
  amount?: number;
  days?: number;
  premiumRate30d?: number;
  coverageByTier?: Record<Tier, number>;
  deductiblePct?: number;
  coverageCapUSD?: number;
  riskScore?: number;
};

const defaultCoverageByTier: Record<Tier, number> = {
  basic: 0.6,
  standard: 0.8,
  plus: 0.9,
};

export function InsuranceCard({
  amount = 2500,
  days = 90,
  premiumRate30d = 0.0015,
  coverageByTier = defaultCoverageByTier,
  deductiblePct = 0.1,
  coverageCapUSD = 100000,
  riskScore = 32,
}: Props) {
  const [enabled, setEnabled] = React.useState(false);
  const [tier, setTier] = React.useState<Tier>("standard");

  const months = Math.max(1, Math.ceil(days / 30));
  const premiumUSD = enabled ? amount * premiumRate30d * months : 0;
  const coveredAmount = enabled ? amount * coverageByTier[tier] : 0;
  const deductibleUSD = coveredAmount * deductiblePct;
  const estimatedPayout = Math.min(
    Math.max(0, coveredAmount - deductibleUSD),
    coverageCapUSD,
  );

  return (
    <section className="space-y-4 rounded-[32px] border border-[rgba(255,182,72,0.2)] bg-[#070708]/95 p-6 text-white shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-500/15 text-green-200">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-[#D8D9DE]/70">
              Yield Insurance
            </p>
            <h3 className="text-xl font-black">
              Protect principal exposure
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEnabled((prev) => !prev)}
          className={clsx(
            "relative inline-flex h-10 w-20 items-center rounded-full border border-white/15 p-1 transition",
            enabled ? "bg-[#F3A233]/20" : "bg-white/5",
          )}
          aria-pressed={enabled}
        >
          <motion.span
            layout
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-black shadow"
            animate={{ x: enabled ? 40 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            {enabled ? "ON" : "OFF"}
          </motion.span>
        </button>
      </header>
      <p className="text-xs uppercase tracking-[0.35em] text-[#D8D9DE]/60">
        Protect principal exposure
      </p>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            key="insurance-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5 overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-3">
              {(["basic", "standard", "plus"] as Tier[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setTier(option)}
                  className={clsx(
                    "rounded-2xl border px-3 py-3 text-center text-xs uppercase tracking-[0.35em]",
                    tier === option
                      ? "border-[#F3A233] bg-[#F3A233] text-black"
                      : "border-white/10 text-[#D8D9DE]/70 hover:border-[#F3A233]/30",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="grid gap-3 rounded-[28px] border border-white/10 bg-[#0D0E10] p-4 shadow-inner shadow-black/40 md:grid-cols-2">
              <Stat label="Premium" value={premiumUSD} badge="≈0.18% / 30d" />
              <Stat label="Covered" value={coveredAmount} badge={`${(coverageByTier[tier] * 100).toFixed(0)}%`} />
              <Stat label="Deductible" value={deductibleUSD} badge={`${(deductiblePct * 100).toFixed(0)}%`} />
              <Stat label="Payout Limit" value={estimatedPayout} badge={`Cap $${coverageCapUSD.toLocaleString()}`} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <ListCard
                title="Covered Perils"
                accent="emerald"
                lines={[
                  "Protocol bankruptcy / exploit",
                  "Smart-contract malfunction",
                  "Severe LP insolvency",
                ]}
              />
              <ListCard
                title="Not Covered"
                accent="rose"
                lines={[
                  "Private key compromise",
                  "Market drawdown / IL",
                  "Sanctions & compliance events",
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-[#1DD1A1]/10 to-[#F3A233]/10 px-4 py-3 text-xs text-[#D8D9DE]">
              <Activity size={16} />
              <span>Market condition: Low volatility</span>
              <span>Risk cost: {riskScore}%</span>
              <span className="inline-flex items-center gap-1 text-[#F3A233]">
                <Zap size={14} />
                Transparent oracle terms
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Stat({
  label,
  value,
  badge,
}: {
  label: string;
  value: number;
  badge: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.35em] text-[#D8D9DE]/70">
        {label}
      </p>
      <p className="mt-2 font-mono text-xl">
        ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      <p className="text-[11px] text-[#8F94A3]">{badge}</p>
    </div>
  );
}

function ListCard({
  title,
  lines,
  accent,
}: {
  title: string;
  lines: string[];
  accent: "emerald" | "rose";
}) {
  const palette =
    accent === "emerald"
      ? "from-emerald-400/15 to-emerald-500/5"
      : "from-rose-500/15 to-rose-500/5";
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-gradient-to-br p-4 text-sm text-[#C6CAD8]",
        palette,
      )}
    >
      <p className="font-semibold text-white">{title}</p>
      <ul className="mt-2 space-y-1 text-xs">
        {lines.map((line) => (
          <li key={line}>• {line}</li>
        ))}
      </ul>
    </div>
  );
}
