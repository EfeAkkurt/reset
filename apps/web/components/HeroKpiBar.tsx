"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
// Temporarily removed enhanced components due to TypeScript errors
// import { APRMetricsCard, TVLMetricsCard, ParticipantMetricsCard } from "./enhanced/MetricsCard";

type Kpis = {
  avgApr7d: number;
  totalTvlUsd: number;
  results: number;
};

type Props = {
  kpis: Kpis;
};

export function HeroKpiBar({ kpis }: Props) {
  const reduceMotion = useReducedMotion();

  const fadeInAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
      };

  // Simulate some changes for demo purposes
  const mockChange24h = {
    apr: 0.5, // 0.5% change in APR
    tvl: 2.3, // 2.3% change in TVL
    participants: 1.2, // 1.2% change in participants
  };

  return (
    <motion.div
      className="mx-auto -mt-8 max-w-5xl px-4 sm:-mt-12"
      {...fadeInAnim}
    >
      <div className="rounded-[28px] border border-alpha-gold-16 bg-[rgba(18,18,20,0.92)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {/* Placeholder for APR Metrics Card */}
          <div className="rounded-2xl border border-alpha-gold-16 bg-[var(--neutral-800)] p-5 shadow-[0_15px_35px_rgba(0,0,0,0.35)]">
            <h3 className="mb-1 text-sm font-medium text-[var(--text-2)]">
              Average APR
            </h3>
            <p className="text-3xl font-semibold text-white">
              {Number.isFinite(kpis.avgApr7d) ? kpis.avgApr7d.toFixed(2) : "0.00"}%
            </p>
            <p className="text-xs font-medium text-gold-400">
              +{mockChange24h.apr}%
            </p>
          </div>

          {/* Placeholder for TVL Metrics Card */}
          <div className="rounded-2xl border border-alpha-gold-16 bg-[var(--neutral-800)] p-5 shadow-[0_15px_35px_rgba(0,0,0,0.35)]">
            <h3 className="mb-1 text-sm font-medium text-[var(--text-2)]">
              Total TVL
            </h3>
            <p className="text-3xl font-semibold text-white">
              ${Number.isFinite(kpis.totalTvlUsd) ? (kpis.totalTvlUsd / 1_000_000).toFixed(1) : "0.0"}M
            </p>
            <p className="text-xs font-medium text-gold-400">
              +{mockChange24h.tvl}%
            </p>
          </div>

          {/* Placeholder for Participants Metrics Card */}
          <div className="rounded-2xl border border-alpha-gold-16 bg-[var(--neutral-800)] p-5 shadow-[0_15px_35px_rgba(0,0,0,0.35)]">
            <h3 className="mb-1 text-sm font-medium text-[var(--text-2)]">
              Participants
            </h3>
            <p className="text-3xl font-semibold text-white">
              {Number.isFinite(kpis.results) ? kpis.results : 0}
            </p>
            <p className="text-xs font-medium text-gold-400">
              +{mockChange24h.participants}%
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default HeroKpiBar;
