"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
// Local type definitions
type RedirectEntry = {
  id: string;
  protocol: string;
  pair: string;
  apr: number;
  amount: number;
  days: number;
  ts: number;
  chain: string;
  txid?: string;
  action?: "Deposit" | "Withdraw";
};

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
};

import { protocolLogo } from "@/lib/logos";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { formatUSD, formatTVL } from "@/lib/format";

// Local constants
const RISK_COLORS: Record<string, string> = {
  Low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  Medium: "border-[rgba(243,162,51,0.45)] bg-[rgba(243,162,51,0.12)] text-[#F3A233]",
  High: "border-red-400/50 bg-red-500/10 text-red-200",
};

// Mocked opportunity catalog with randomized APR/APY/TVL per reload scenario
function getOpportunityById(id: string): Opportunity | undefined {
  // Determine scenario to vary values on reload
  let scenario: "A" | "B" = "A";
  if (typeof window !== "undefined") {
    const s = window.localStorage.getItem("portfolio_mock_scenario");
    if (s === "A" || s === "B") scenario = s;
  }

  // Seeded RNG for deterministic per-id, per-scenario numbers
  const seeded = (key: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6d2b79f5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const rnd = seeded(`${id}:${scenario}`);
  const between = (min: number, max: number) => min + (max - min) * rnd();

  const base: Record<
    string,
    {
      protocol: string;
      pair: string;
      chain: string;
      risk: "Low" | "Medium" | "High";
      rewardToken: string;
      apr: [number, number];
      apy: [number, number];
      tvl: [number, number]; // USD
    }
  > = {
    "zest-stx": {
      protocol: "ZEST",
      pair: "STX",
      chain: "stacks",
      risk: "Medium",
      rewardToken: "ZEST",
      apr: scenario === "A" ? [9, 16] : [12, 20],
      apy: scenario === "A" ? [11, 19] : [14, 22],
      tvl: [1_000_000, 6_000_000],
    },
    "zest-aeusdc": {
      protocol: "ZEST",
      pair: "AEUSDC",
      chain: "stacks",
      risk: "Low",
      rewardToken: "ZEST",
      apr: scenario === "A" ? [5, 8] : [6, 10],
      apy: scenario === "A" ? [6, 10] : [7, 12],
      tvl: [2_000_000, 8_000_000],
    },
  };

  const meta = base[id];
  if (!meta) return undefined;

  const apr = +between(meta.apr[0], meta.apr[1]).toFixed(1);
  const apy = +between(meta.apy[0], meta.apy[1]).toFixed(1);
  const tvlUsd =
    Math.round(between(meta.tvl[0], meta.tvl[1]) / 10_000) * 10_000;
  const lastUpdated = ["3m", "5m", "12m", "1h"][Math.floor(between(0, 3.99))];
  const risk: "Low" | "Medium" | "High" = (["Low", "Medium", "High"] as const)[
    Math.floor(between(0, 2.999))
  ];

  return {
    id,
    protocol: meta.protocol,
    pair: meta.pair,
    chain: meta.chain,
    apr,
    apy,
    risk,
    tvlUsd,
    rewardToken: meta.rewardToken,
    lastUpdated,
    originalUrl: "",
    summary: `${meta.protocol} ${meta.pair} pool on Stellar with ${risk} risk`,
  };
}

type Position = {
  id: string;
  protocol: string;
  pair: string;
  risk: "Low" | "Medium" | "High";
  tvlUsd: number;
  rewardToken: string;
  apr?: number;
  apy?: number;
  deposited: number;
  current: number;
  chain: string;
  txs: RedirectEntry[];
};

function buildPositions(rows: RedirectEntry[]): Position[] {
  const map: Record<string, Position> = {};
  for (const r of rows) {
    const opp = getOpportunityById(r.id);
    if (!opp) continue;
    const key = r.id;
    if (!map[key]) {
      map[key] = {
        id: opp.id,
        protocol: opp.protocol,
        pair: opp.pair,
        risk: opp.risk,
        tvlUsd: opp.tvlUsd,
        rewardToken: opp.rewardToken,
        apr: opp.apr,
        apy: opp.apy,
        deposited: 0,
        current: 0,
        chain: opp.chain,
        txs: [],
      };
    }
    const est = r.amount * (r.apr / 100) * (r.days / 365);
    map[key].deposited += r.amount;
    map[key].current += r.amount + est;
    map[key].txs.push(r);
  }
  return Object.values(map);
}

export const PositionsList: React.FC<{ rows: RedirectEntry[] }> = ({
  rows,
}) => {
  const positions = React.useMemo(() => buildPositions(rows), [rows]);
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
      <AnimatePresence>
        {positions.map((p, idx) => {
          const l = protocolLogo(p.protocol);
          const data = Array.from({ length: 14 }).map((_, i) => ({
            x: i,
            y: Number(
              (p.current / (p.deposited || 1) + Math.sin(i / 1.5) * 0.04).toFixed(
                4,
              ),
            ),
          }));
          const chainLabel = p.chain.toUpperCase();
          const aprText =
            typeof p.apr === "number" ? `${p.apr.toFixed(1)}%` : "--";
          const apyText =
            typeof p.apy === "number" ? `${p.apy.toFixed(1)}%` : "--";
          return (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              className="relative overflow-hidden rounded-[28px] border border-[rgba(255,182,72,0.12)] bg-gradient-to-b from-[#191A1E] via-[#111215] to-[#090909] p-6 text-white shadow-[0_30px_70px_rgba(0,0,0,0.65)]"
            >
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 text-lg font-bold shadow-inner shadow-black/60"
                    style={{ background: l.bg, color: l.fg }}
                  >
                    {l.letter}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.45em] text-[#D8D9DE]/70">
                      {p.protocol} Strategy
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {p.pair}
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#D8D9DE]/60">
                      {chainLabel} · TVL {(p.tvlUsd / 1_000_000).toFixed(2)}M
                    </p>
                  </div>
                </div>
                <RiskBadge level={p.risk} />
              </div>

              <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <Metric label="Deposited" value={formatUSD(p.deposited)} />
                <Metric label="Current Value" value={formatUSD(p.current)} />
                <Metric
                  label="APR / APY"
                  value={`${aprText} / ${apyText}`}
                />
                <Metric label="TVL ($M)" value={formatTVL(p.tvlUsd)} />
                <Metric
                  label="Reward Token"
                  value={`${p.rewardToken} (est.)`}
                  className="md:col-span-2"
                />
              </div>

              <div className="mt-6">
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ left: 0, right: 0 }}>
                      <defs>
                        <linearGradient
                          id={`position-gradient-${idx}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#F3A233"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="100%"
                            stopColor="#F3A233"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="y"
                        stroke="#F3A233"
                        strokeWidth={2}
                        fill={`url(#position-gradient-${idx})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-[#F3A233]/35 to-transparent" />
              </div>

              <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.35em] text-[#D8D9DE]/60">
                Reward schedule aligned with ZEST incentives.
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <ActionButton onClick={() => toggle(p.id)}>Details</ActionButton>
                <ActionButton href={`/opportunities/${p.id}`} variant="gold">
                  Deposit
                </ActionButton>
                <ActionButton variant="outline" disabled>
                  Withdraw
                </ActionButton>
              </div>

              <AnimatePresence>
                {open[p.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B0D] p-4 text-sm text-[#D8D9DE]"
                  >
                    <div className="text-[11px] uppercase tracking-[0.4em] text-[#F3A233]">
                      Transaction History
                    </div>
                    <div className="mt-3 space-y-2 text-[13px]">
                      {p.txs.map((t, index) => (
                        <div
                          key={`${t.txid || index}-${t.ts}`}
                          className="flex items-center justify-between"
                        >
                          <span className="tabular-nums text-white">
                            {t.action || "Deposit"} •{" "}
                            {new Date(t.ts).toLocaleDateString()}
                          </span>
                          {t.txid && (
                            <a
                              className="text-[#F3A233] underline-offset-4 hover:underline"
                              href={`https://explorer.hiro.so/txid/${t.txid}?chain=testnet`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Explorer
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

function Metric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`group ${className}`}>
      <div className="text-[11px] uppercase tracking-[0.4em] text-[#D8D9DE]/60">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg tabular-nums text-white">
        {value}
      </div>
      <div className="mt-2 h-[1px] w-8 bg-[rgba(255,182,72,0.2)] transition-all group-hover:w-14 group-hover:bg-[#F3A233]" />
    </div>
  );
}

function RiskBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] ${RISK_COLORS[level]}`}
      style={{ borderWidth: '0.7px' }}
    >
      {level} Risk
    </span>
  );
}

type ActionButtonProps = {
  children: React.ReactNode;
  variant?: "ghost" | "gold" | "outline";
  href?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function ActionButton({
  children,
  variant = "ghost",
  href,
  className = "",
  ...props
}: ActionButtonProps) {
  const base =
    "flex-1 rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] transition disabled:pointer-events-none disabled:opacity-40 text-center inline-flex items-center justify-center";
  const variants: Record<string, string> = {
    ghost:
      "border-white/10 bg-transparent text-white hover:border-[#F3A233]/40",
    gold:
      "border-[#F3A233] bg-[#F3A233] text-black shadow-[0_0_25px_rgba(243,162,51,0.3)] hover:shadow-[0_0_35px_rgba(243,162,51,0.45)]",
    outline:
      "border-white/20 text-white hover:border-[#F3A233]/50 hover:text-[#F3A233]",
  };

  if (href) {
    return (
      <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
