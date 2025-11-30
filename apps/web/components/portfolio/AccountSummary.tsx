"use client";
import React from "react";
import { formatUSD } from "@/lib/format";
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

export const AccountSummary: React.FC<{ rows: RedirectEntry[] }> = ({
  rows,
}) => {
  const total = rows.reduce((acc, r) => acc + r.amount, 0);
  const avgAPR = rows.length
    ? rows.reduce((a, r) => a + r.apr, 0) / rows.length
    : 0;
  const estTotal = rows.reduce(
    (acc, r) => acc + r.amount * (r.apr / 100) * (r.days / 365),
    0,
  );

  return (
    <section className="space-y-5 text-white lg:sticky lg:top-24">
      <div className="relative overflow-hidden rounded-[28px] border border-[rgba(255,182,72,0.25)] bg-gradient-to-b from-[#151518] to-[#0A0A0B] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-40" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-[#D8D9DE]/70">
            Account Summary
          </p>
          <div className="mt-6 grid gap-5">
            <KPI label="Total Principal (USD)" value={formatUSD(total)} />
            <KPI
              label="Weighted Avg APR"
              value={`${avgAPR.toFixed(2)}%`}
              muted="Annualized"
            />
            <KPI
              label="Estimated Total Return (30D)"
              value={formatUSD(estTotal)}
              muted="Projection"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

function KPI({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: string;
}) {
  return (
    <div className="group">
      <div className="text-[12px] uppercase tracking-[0.4em] text-[#D8D9DE]/70">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-black tabular-nums text-white">
        {value}
      </div>
      {muted && (
        <div className="text-xs uppercase tracking-[0.4em] text-[#D8D9DE]/40">
          {muted}
        </div>
      )}
      <div className="mt-3 h-[2px] w-12 bg-[rgba(255,182,72,0.24)] transition-all group-hover:w-20 group-hover:bg-[#F3A233]" />
    </div>
  );
}
