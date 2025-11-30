"use client";
import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
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

  const descriptorStack = [
    chain || "Stellar",
    `${risk} Risk`,
    `Updated ${lastUpdated || "—"}`,
  ];

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

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-[rgba(255,182,72,0.18)] bg-[#121214] p-6 md:p-10 text-white shadow-[0_45px_120px_rgba(0,0,0,0.6)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(243,162,51,0.25),transparent_60%)]" />

      <div className="relative z-10 space-y-6">
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-[#D8D9DE]/70"
        >
          <Link
            href="/opportunities"
            className="transition hover:text-white"
            aria-label="Back to opportunities"
          >
            Opportunities
          </Link>
          <ChevronRight size={14} />
          <span>{protocol}</span>
        </motion.nav>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-black uppercase tracking-tight"
            >
              {protocol} — {pair}
            </motion.h1>
            <div className="mt-3 h-px w-24 bg-[rgba(255,182,72,0.4)]" />
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/80">
              {descriptorStack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[rgba(255,182,72,0.16)] px-3 py-1"
                >
                  {item}
                </span>
              ))}
            </div>
            {summary && (
              <p className="mt-4 max-w-3xl text-sm text-[#D8D9DE]/85">
                {summary}
              </p>
            )}
          </div>

          <div className="grid flex-1 gap-3">
            {heroStats.map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -4, rotateX: 1.5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="group rounded-[22px] border border-[rgba(255,182,72,0.2)] bg-[#111214]/80 px-5 py-4 shadow-inner shadow-black/40 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#D8D9DE]/70">
                    {stat.label}
                  </p>
                  <span
                    className={clsx(
                      "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]",
                      stat.tone === "positive"
                        ? "bg-emerald-400/20 text-emerald-200"
                        : stat.tone === "negative"
                          ? "bg-rose-500/20 text-rose-200"
                          : "bg-[rgba(255,182,72,0.15)] text-[#F3A233]",
                    )}
                  >
                    {stat.delta}
                  </span>
                </div>
                <p className="mt-3 font-mono text-[2.4rem] leading-none text-white">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
