"use client";
import React, { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { Calculator, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
};

interface DepositCalculatorProps {
  data: Opportunity;
}

type CompoundFrequency =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Annually";

const PERIODS_PER_YEAR: Record<CompoundFrequency, number> = {
  Daily: 365,
  Weekly: 52,
  Monthly: 12,
  Quarterly: 4,
  Annually: 1,
};

export function DepositCalculator({ data }: DepositCalculatorProps) {
  const [amount, setAmount] = useState(2500);
  const [days, setDays] = useState(120);
  const [frequency, setFrequency] = useState<CompoundFrequency>("Monthly");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  useEffect(() => {
    if (activeTab === "withdraw" && amount < 100) {
      setAmount(100);
    }
  }, [activeTab, amount]);

  const returns = useMemo(() => {
    const dailyRate = data.apr / 100 / 365;
    const simpleReturn = amount * dailyRate * days;
    const n = PERIODS_PER_YEAR[frequency];
    const compoundedAmount =
      amount * Math.pow(1 + data.apr / 100 / n, (n * days) / 365);
    const compoundReturn = compoundedAmount - amount;

    return {
      simple: simpleReturn,
      compound: compoundReturn,
      final: compoundedAmount,
      effectiveAPY:
        days === 0
          ? 0
          : (((compoundedAmount / amount - 1) * 365) / days) * 100,
    };
  }, [amount, data.apr, days, frequency]);

  return (
    <section className="space-y-5 rounded-[32px] border border-[rgba(255,182,72,0.2)] bg-gradient-to-br from-[#0F1012] via-[#050505] to-[#010101] p-6 text-white shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#D8D9DE]/70">
            Deposit Simulator
          </p>
          <h3 className="text-xl font-black">
            {data.protocol} • {data.pair}
          </h3>
        </div>
        <Calculator className="text-[#F3A233]" />
      </header>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <label className="text-xs uppercase tracking-[0.4em] text-[#D8D9DE]/70">
          Amount (USD)
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-3xl">$</span>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full bg-transparent text-3xl font-mono focus:outline-none"
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[500, 1000, 2500, 5000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className="rounded-xl border border-white/10 px-2 py-1 text-xs text-[#D8D9DE]/80 transition hover:border-[#F3A233]/40 hover:text-white"
            >
              ${preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.35em] text-[#D8D9DE]/70">
          Duration
          <span className="font-mono text-white">{days}d</span>
        </label>
        <div className="rounded-2xl border border-white/10 bg-[#101114] px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-[#9DA1AF]">
            <Calendar size={14} />
            Slide to project holding period
          </div>
          <input
            type="range"
            value={days}
            min={1}
            max={365}
            step={1}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-3 w-full accent-[#F3A233]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-[#6C7080]">
            <span>1d</span>
            <span>90d</span>
            <span>180d</span>
            <span>365d</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.35em] text-[#D8D9DE]/70">
          Compounding Frequency
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(PERIODS_PER_YEAR) as CompoundFrequency[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFrequency(option)}
              className={clsx(
                "rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition",
                frequency === option
                  ? "bg-[#F3A233] text-black"
                  : "border border-white/15 text-[#D8D9DE]/60 hover:border-[#F3A233]/30",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#0B0B0E] p-5 shadow-inner shadow-black/50">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/70">
          Results
        </p>
        <div className="mt-4 space-y-4">
          {[
            { label: "Simple Return", value: returns.simple, prefix: "$" },
            { label: "Compound Return", value: returns.compound, prefix: "$" },
            { label: "Final Amount", value: returns.final, prefix: "$" },
            {
              label: "Effective APY",
              value: returns.effectiveAPY,
              prefix: "",
              suffix: "%",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-xs text-[#9DA1AF]">{row.label}</span>
              <span className="font-mono text-lg text-white">
                <CountUp
                  key={`${row.label}-${amount}-${days}-${frequency}`}
                  end={row.value}
                  duration={0.8}
                  decimals={row.label.includes("APY") ? 2 : 2}
                  prefix={row.prefix}
                  suffix={row.suffix}
                  separator=","
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-white/10 p-1">
        {["deposit", "withdraw"].map((tab) => (
          <button
            key={tab}
            className={clsx(
              "flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]",
              activeTab === tab
                ? "bg-[#F3A233] text-black"
                : "text-[#D8D9DE]/70 hover:text-white",
            )}
            onClick={() => setActiveTab(tab as "deposit" | "withdraw")}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#F3A233] bg-[#F3A233] px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black transition hover:shadow-[0_0_35px_rgba(243,162,51,0.4)]"
        >
          <ArrowUpRight size={16} />
          Initiate {activeTab === "deposit" ? "Deposit" : "Withdraw"}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:border-[#F3A233]/40"
        >
          <ArrowDownRight size={16} />
          Ghost Action
        </button>
      </div>
    </section>
  );
}
