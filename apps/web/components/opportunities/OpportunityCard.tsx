"use client";

import React from "react";
import clsx from "clsx";
import { useRouter } from "next/router";
import { ArrowUpRight } from "lucide-react";
import { formatPct, formatTVL } from "@/lib/format";

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
  source?: "live" | "demo";
  logoUrl?: string;

  volume24h?: number;
  volume7d?: number;
  uniqueUsers24h?: number;
  uniqueUsers7d?: number;
  concentrationRisk?: number;
  userRetention?: number;
};

export const OpportunityCard: React.FC<
  { data: Opportunity } & { disabled?: boolean } & { onClick?: () => void }
> = ({ data, disabled, onClick }) => {
  const router = useRouter();

  const handleNavigate = React.useCallback(() => {
    if (disabled) return;
    if (onClick) {
      onClick();
      return;
    }
    void router.push(`/opportunities/${data.id}`);
  }, [data.id, disabled, onClick, router]);


  const riskStyles: Record<
    Opportunity["risk"],
    { badge: string; dot: string }
  > = {
    Low: {
      badge: "border-gold-500/30 bg-alpha-gold-16 text-gold-100",
      dot: "bg-gold-400/60",
    },
    Medium: {
      badge: "border-gold-500/50 bg-gold-500/10 text-gold-200",
      dot: "bg-gold-400/80",
    },
    High: {
      badge: "border-gold-500 bg-gold-500/20 text-gold-200",
      dot: "bg-gold-400",
    },
  };

  return (
    <article
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === "Enter") handleNavigate();
      }}
      aria-label={`View ${data.protocol} ${data.pair}`}
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-alpha-gold-16/50 bg-[var(--neutral-800)] p-6 text-left transition duration-300",
        "shadow-[0_20px_50px_rgba(0,0,0,0.45)] hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-[0_30px_60px_rgba(0,0,0,0.55)]",
        disabled && "cursor-not-allowed opacity-60",
        !disabled && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            {data.protocol}
          </p>
          <p className="text-xl font-semibold text-white">{data.pair}</p>
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border py-1 text-xs font-semibold transition-colors",
            {
              Low: "px-2.5",
              Medium: "px-3.5",
              High: "px-3.5",
            }[data.risk],
            riskStyles[data.risk].badge,
          )}
          style={data.risk === "Low" ? { letterSpacing: "0.16em" } : undefined}
        >
          <span
            className={clsx("h-2 w-2 rounded-full", riskStyles[data.risk].dot)}
          />
          {data.risk}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/50">
            APR
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {formatPct(data.apr, 2)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/50">
            APY
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {formatPct(data.apy, 2)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/50">
            TVL
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {formatTVL(data.tvlUsd)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-gold-400">
        <span className="text-sm font-medium">View details</span>
        <span className="rounded-full border border-gold-500/50 bg-gold-500/10 p-2 transition group-hover:bg-gold-500/30 group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
};
