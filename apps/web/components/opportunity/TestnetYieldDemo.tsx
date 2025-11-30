import React, { useState } from "react";
import { motion } from "framer-motion";
import { useYieldAggregatorDemo } from "@/hooks/useYieldAggregatorDemo";
import { useStellarWallet } from "@/components/providers/StellarWalletProvider";

export function TestnetYieldDemo() {
  const { address, connect } = useStellarWallet();
  const { state, pending, deposit, addYield } = useYieldAggregatorDemo();
  const [amount, setAmount] = useState(10);
  const [insurancePct, setInsurancePct] = useState(10);

  return (
    <section className="space-y-4 rounded-[28px] border border-white/10 bg-[#0B0B0E]/90 p-5 text-white shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/70">
            Live Testnet Yield
          </p>
          <h3 className="text-xl font-black">Reset Yield Aggregator (testnet)</h3>
          <p className="text-xs text-[#9DA1AF]">
            Contract: CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD
          </p>
        </div>
        {!address && (
          <button
            type="button"
            onClick={connect}
            className="rounded-full border border-[#F3A233]/60 bg-[#F3A233]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            Connect wallet
          </button>
        )}
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/70">
            Amount (XLM units)
          </p>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 1)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-lg font-mono text-white focus:outline-none"
          />
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/70">
            Insurance %
          </p>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={insurancePct}
            onChange={(e) => setInsurancePct(Number(e.target.value))}
            className="mt-3 w-full accent-[#F3A233]"
          />
          <p className="mt-1 text-sm text-white/70">{insurancePct}%</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => deposit(amount, insurancePct)}
          className="inline-flex items-center gap-2 rounded-full border border-[#F3A233]/80 bg-[#F3A233] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-black transition disabled:opacity-60"
        >
          {pending ? "Submitting..." : "Deposit to testnet"}
        </button>
        {state?.depositId && (
          <button
            type="button"
            onClick={() => addYield(1)}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100"
          >
            Add +1 demo yield
          </button>
        )}
      </div>

      {state?.depositId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-black/30 p-4"
        >
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D8D9DE]/70">
            Position
          </p>
          <div className="mt-2 grid gap-2 text-sm text-white">
            <div className="flex items-center justify-between">
              <span>Deposit ID</span>
              <code className="rounded bg-white/5 px-2 py-1 text-xs">{state.depositId}</code>
            </div>
            <div className="flex items-center justify-between">
              <span>Amount</span>
              <span className="font-mono">{state.amount} units</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Insurance</span>
              <span className="font-mono">{state.insurancePct}%</span>
            </div>
            {state.txHash && (
              <div className="flex items-center justify-between">
                <span>Tx Hash</span>
                <code className="rounded bg-white/5 px-2 py-1 text-xs">{state.txHash}</code>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </section>
  );
}
