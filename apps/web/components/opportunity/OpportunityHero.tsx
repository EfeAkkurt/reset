"use client";
import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

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
  logoUrl?: string;
};

interface OpportunityHeroProps {
  data: Opportunity;
}

export function OpportunityHero({ data }: OpportunityHeroProps) {
  const { protocol, pair, risk, chain, lastUpdated, apr, apy, tvlUsd, summary } =
    data;

  const formatTVL = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(0)}`;
  };

  const heroStats = [
    {
      label: "APR",
      value: `${apr.toFixed(2)}%`,
      delta: apr >= 0 ? "+0.42%" : "-0.42%",
      tone: apr >= 0 ? "positive" : "negative",
    },
    {
      label: "APY",
      value: `${apy.toFixed(2)}%`,
      delta: apy >= 0 ? "+0.60%" : "-0.60%",
      tone: apy >= 0 ? "positive" : "negative",
    },
    {
      label: "TVL",
      value: formatTVL(tvlUsd),
      delta: "+$1.2M",
      tone: "neutral",
    },
  ];

  // Title Case Helper
  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const title = `${toTitleCase(protocol)} — ${pair}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
      whileHover={{ y: -4, boxShadow: "0 24px 80px rgba(0,0,0,0.85)" }}
      className="relative overflow-hidden rounded-[32px] border border-[rgba(255,182,72,0.16)] bg-[#121214] px-6 py-8 shadow-[0_0_80px_rgba(0,0,0,0.75)] md:px-12 md:py-10"
    >
      {/* Background Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(224,145,44,0.14),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(224,145,44,0.08),transparent_50%)]" />

      <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left Column: Title Block (7-8 cols) */}
        <div className="flex flex-col justify-center md:col-span-7 lg:col-span-8">
          <h1 className="font-semibold leading-[1.05] text-white text-[40px] md:text-[46px]">
            {title}
          </h1>
          <div className="mt-3 h-[2px] w-[72px] bg-[#E0912C]" />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,182,72,0.16)] bg-[#1A1B1E]/80 px-3 py-[6px] text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]">
              {chain || "Stellar"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,182,72,0.16)] bg-[#1A1B1E]/80 px-3 py-[6px] text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]">
              <span
                className={clsx(
                  "h-[6px] w-[6px] rounded-full",
                  risk === "Low"
                    ? "bg-emerald-400"
                    : risk === "Medium"
                      ? "bg-[#E0912C]"
                      : "bg-rose-500",
                )}
              />
              {risk} Risk
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,182,72,0.16)] bg-[#1A1B1E]/80 px-3 py-[6px] text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]">
              Updated {lastUpdated || "4m"}
            </span>
          </div>

          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[#D8D9DE]">
            {summary ||
              "Fiat-onchain pool optimized for European corridors with streaming fees."}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.01em] text-[#D8D9DE]/70">
            <span className="inline-flex items-center before:mr-2 before:h-[6px] before:w-[6px] before:rounded-full before:bg-[#E0912C] before:content-['']">
              Chain • {chain || "Stellar"}
            </span>
            <span className="inline-flex items-center before:mr-2 before:h-[6px] before:w-[6px] before:rounded-full before:bg-[#E0912C] before:content-['']">
              Risk band • {risk}
            </span>
            <span className="inline-flex items-center before:mr-2 before:h-[6px] before:w-[6px] before:rounded-full before:bg-[#E0912C] before:content-['']">
              Telemetry • Live
            </span>
          </div>
        </div>

        {/* Right Column: KPI Stack (4-5 cols) */}
        <div className="flex flex-col justify-center md:col-span-5 lg:col-span-4">
          <motion.div
            whileHover={{
              y: -2,
              boxShadow: "0 0 40px rgba(224,145,44,0.28)",
              borderColor: "rgba(255,182,72,0.3)",
            }}
            className="ml-auto flex w-full max-w-[260px] flex-col gap-3 rounded-[24px] border border-[rgba(255,182,72,0.16)] bg-gradient-to-b from-[#1A1B1E]/96 to-[#121214]/96 p-5 transition-colors"
          >
            {heroStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                className="flex items-baseline justify-between"
              >
                <span className="text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]/80">
                  {stat.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[22px] font-semibold leading-none text-white">
                    {stat.value}
                  </span>
                  <span
                    className={clsx(
                      "inline-flex items-center rounded-full px-2 py-[3px] text-[11px]",
                      stat.label === "TVL"
                        ? "bg-[rgba(255,182,72,0.15)] text-[#F3A233]"
                        : "bg-[rgba(12,181,120,0.12)] text-[#4ADE80]",
                    )}
                  >
                    {stat.delta}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <p className="mt-3 text-right text-[11px] text-[#D8D9DE]/60">
            Real-time telemetry from DeFiLlama & Stellar pools.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
