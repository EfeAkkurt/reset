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
        "group relative flex flex-col overflow-hidden rounded-[28px] border border-[rgba(255,182,72,0.18)] bg-[#121214] p-6 text-left transition duration-300",
        "shadow-[0_40px_100px_rgba(0,0,0,0.6)] hover:-translate-y-1 hover:border-[#F3A233]/70 hover:shadow-[0_55px_120px_rgba(0,0,0,0.7)]",
        disabled && "cursor-not-allowed opacity-60",
        !disabled && "cursor-pointer",
      )}
    >
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            {data.protocol}
          </p>
          <p className="text-xl font-semibold text-white">{data.pair}</p>
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] transition-colors",
            riskStyles[data.risk].badge,
          )}
        >
          <span
            className={clsx("h-2 w-1.5 rounded-full", riskStyles[data.risk].dot)}
          />
          {data.risk}
        </span>
      </div>

      <div className="relative mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="APR" value={formatPct(data.apr, 2)} />
        <MetricCard label="APY" value={formatPct(data.apy, 2)} />
        <MetricCard label="TVL" value={formatTVL(data.tvlUsd)} />
      </div>

      <div className="mt-8 flex items-center justify-between text-gold-400">
        <span className="text-sm font-medium tracking-[0.3em] text-white/70">
          View details
        </span>
        <span className="rounded-full border border-gold-500/50 bg-gold-500/10 p-2 transition group-hover:bg-gold-500/30 group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
};

function MetricCard({ label, value }: { label: string; value: string }) {
  const lengthFactor = Math.min(
    1,
    Math.max(0.4, value.toString().replace(/[^0-9.]/g, "").length / 6),
  );
  return (
    <div className="group rounded-2xl border border-white/10 bg-[#101115] px-4 py-3 shadow-inner shadow-black/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/45">
        {label}
      </p>
      <p className="mt-2 font-mono text-xl text-white">{value}</p>
      <div
        className="mt-3 h-px bg-[rgba(255,182,72,0.2)] transition-all group-hover:bg-[#F3A233]"
        style={{
          width: `${lengthFactor * 100}%`,
        }}
      />
    </div>
  );
}
