"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

export const WithdrawWidget = memo(() => {
  const [amount, setAmount] = useState("0.00");

  // Memoize max amount to prevent recreation
  const maxAmount = useMemo(() => "1,250.00", []);

  const handleMax = useCallback(() => {
    setAmount(maxAmount);
  }, [maxAmount]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setAmount(value);
    }
  }, []);

  // CSS animation classes for route flow (replaced from heavy motion animations)
  const routeFlowArrows = useMemo(() => [
    { delay: "0s" },
    { delay: "0.75s" }
  ], []);

  return (
    <>
      {/* Background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(60% 60% at 60% 40%, rgba(255,182,72,0.14) 0%, rgba(255,182,72,0.04) 35%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Hover gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[var(--gold-300)]/10 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10 lg:p-12 h-full flex flex-col">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--gold-300)]/20 flex items-center justify-center">
              <span className="text-xs text-[var(--gold-300)]">⭘</span>
            </div>
            <span className="text-sm text-white/60">Withdraw Widget</span>
          </div>
          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400 border border-green-500/30">
            live
          </span>
        </div>

        {/* Withdraw Widget Panel */}
        <div className="relative flex-1 rounded-xl bg-gradient-to-b from-white/5 to-white/0 p-6 mb-6">
          {/* Amount Input */}
          <div className="mb-6">
            <div className="text-xs text-white/60 mb-2">Amount</div>
            <div className="relative bg-white/5/30 border border-white/10 rounded-lg p-3.5 hover:bg-white/5/50 transition-colors">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full bg-transparent text-white text-lg font-semibold outline-none placeholder-white/20 pr-16"
                inputMode="decimal"
              />
              <motion.button
                onClick={handleMax}
                className="absolute right-3.5 top-1/4 px-3 py-1.5 text-xs font-medium text-[var(--gold-300)] bg-[var(--gold-300)]/10 rounded-md border border-[var(--gold-300)]/30 hover:bg-[var(--gold-300)]/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
              >
                MAX
              </motion.button>
            </div>
            <div className="text-xs text-white/60 mt-1">USDC Available</div>
          </div>

          {/* Route Visualization - simplified */}
          <div className="mb-6 p-3.5 rounded-lg bg-white/5/30 border border-white/10">
            {/* ETA/Fee with CSS animations */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-sm text-white/80 animate-pulse">
                <span>⏱</span>
                <span>~12s</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div
                className="flex items-center gap-1.5 text-sm text-white/80 animate-pulse"
                style={{ animationDelay: "1s" }}
              >
                <span>⚡</span>
                <span>$0.03</span>
              </div>
            </div>

            {/* Route Flow - CSS animations instead of motion */}
            <div className="flex items-center justify-center gap-2 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white/30 rounded-full" />
                <span>Wallet</span>
              </span>

              {routeFlowArrows.map((_, i) => (
                <span
                  key={i}
                  className="text-lg inline-block animate-slide-right"
                  style={{
                    animationDelay: routeFlowArrows[i].delay,
                    animation: "slideRight 1.5s ease-in-out infinite",
                  }}
                >
                  →
                </span>
              ))}

              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[var(--gold-300)]/50 rounded-full" />
                <span>Vault</span>
              </span>

              {routeFlowArrows.map((_, i) => (
                <span
                  key={`arrow2-${i}`}
                  className="text-lg inline-block animate-slide-right"
                  style={{
                    animationDelay: `${0.75 + routeFlowArrows[i].delay}s`,
                    animation: "slideRight 1.5s ease-in-out infinite",
                  }}
                >
                  →
                </span>
              ))}

              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white/30 rounded-full" />
                <span>Wallet</span>
              </span>
            </div>
          </div>

          {/* Withdraw Button - optimized hover effect */}
          <motion.button
            className="w-full py-3 bg-gradient-to-r from-[var(--gold-300)]/80 to-[var(--gold-300)]/60 text-black font-bold text-sm rounded-lg hover:from-[var(--gold-300)] hover:to-[var(--gold-300)]/80 transition-all shadow-lg"
            whileTap={{ scale: 0.98 }}
            style={{
              willChange: "transform",
            }}
            type="button"
          >
            Withdraw
          </motion.button>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wide text-white/55">Lockup</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">None</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wide text-white/55">Status</span>
            <span className="text-sm font-semibold text-green-400">Live</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wide text-white/55">APY (net)</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">12.4%</span>
          </div>
        </div>
      </div>

      {/* CSS for slide animation is now in CSS module */}
    </>
  );
});

WithdrawWidget.displayName = "WithdrawWidget";