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

  // Enhanced token information
  protocolPair?: string;
  rewardTokens?: string[];
  allTokens?: string[];
  tokens?: string[];

  volume24h?: number;
  volume7d?: number;
  uniqueUsers24h?: number;
  uniqueUsers7d?: number;
  concentrationRisk?: number;
  userRetention?: number;
};

// Helper function to format token addresses for display
const formatTokenAddress = (address: string): string => {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// Helper function to get token name from address
const getTokenName = (address: string): string => {
  // Common Stellar token mappings
  const tokenMap: Record<string, string> = {
    "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA": "XLM",
    "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75": "USDC",
    "CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY": "BLEND",
    "GBBD47IFQFT3GABX2GMFIITWL43G3K5ZDYOXGFAEAA3LDR5ATIAPIKOZ": "YXLM",
    "GA5ZSEJYB37JRC5AVCIA5MOPFZPOMXIE6MMPQ65GWDRPBPE7Y3YPB5FZ": "EURC",
  };

  return tokenMap[address] || formatTokenAddress(address);
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

          {/* Protocol as Main Title */}
          <p className="text-xl font-semibold text-white">
            {data.protocol.split('-').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')}
          </p>

          {/* Pair as Subtitle */}
          <p className="text-sm text-white/80">{data.pair}</p>


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
      {/* Token Information */}
      <div className="space-y-1 flex items-center w-full">

        {/* Token Pair Display */}
        <div className="flex-1 flex items-center gap-2 text-xs text-white/50">

          <span>Pool:</span>
          {data.tokens && data.tokens.length > 0 ? (
            <div className="flex items-center gap-1">
              {data.tokens.slice(0, 2).map((token, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-white/10 rounded text-white">
                  {getTokenName(token)}
                </span>
              ))}
              {data.tokens.length > 2 && (
                <span className="text-white/40">+{data.tokens.length - 2}</span>
              )}
            </div>
          ) : (
            <span className="px-1.5 py-0.5 bg-white/10 rounded text-white">
              {getTokenName(data.pair)}
            </span>
          )}

        </div>

        <div className="flex-1 flex items-center gap-1">

          {/* Reward Tokens Display */}
          {data.rewardTokens && data.rewardTokens.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/50">Rewards:</span>
              <div className="flex items-center gap-1">
                {data.rewardTokens.slice(0, 3).map((token, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-green-300">
                    {getTokenName(token)}
                  </span>
                ))}
                {data.rewardTokens.length > 3 && (
                  <span className="text-green-300/60">+{data.rewardTokens.length - 3}</span>
                )}
              </div>
            </div>
          )}

        </div>

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
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/45">
        {label}
      </p>
      <p className="mt-2 font-mono text-xl text-white">{value}</p>
    </div>
  );
}
