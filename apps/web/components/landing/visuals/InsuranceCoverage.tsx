"use client";

import React, { memo, useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";

export const InsuranceCoverage = memo(() => {
  const [coverage, setCoverage] = useState(60);
  const isDraggingRef = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Optimized drag handling with RAF
  const updateCoverage = useCallback((clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const next = Math.max(0, Math.min(100, Math.round(pct)));

    setCoverage(next);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    updateCoverage(e.clientX);

    const handlePointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;

      requestAnimationFrame(() => {
        updateCoverage(ev.clientX);
      });
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
  }, [updateCoverage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        setCoverage(c => Math.max(0, c - step));
        break;
      case "ArrowRight":
        e.preventDefault();
        setCoverage(c => Math.min(100, c + step));
        break;
      case "Home":
        setCoverage(0);
        break;
      case "End":
        setCoverage(100);
        break;
    }
  }, []);

  // Memoize derived values
  const premium = ((coverage * 0.02).toFixed(1));
  const coveredRisks = useMemo(() => [
    "Protocol Exploit",
    "Oracle Failure",
    "Governance Attack"
  ], []);

  const policyHash = "0x7f9a8b3c";

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
              <span className="text-xs text-[var(--gold-300)]">✓</span>
            </div>
            <span className="text-sm tracking-[0.05em] text-white/60">Coverage Config</span>
          </div>
          <span className="rounded-full bg-[var(--gold-300)]/15 px-3 py-1 text-xs tracking-[0.05em] text-[var(--gold-300)]">
            configurable
          </span>
        </div>

        {/* Coverage Config Panel */}
        <div className="relative flex-1 rounded-xl bg-gradient-to-b from-white/5 to-white/0 p-6 mb-6">
          {/* Coverage Slider */}
          <div className="mb-7">
            <div className="flex justify-between text-sm text-white/80 mb-4">
              <span className="font-medium">Coverage Amount</span>
              <span className="text-[var(--gold-300)] font-bold text-lg">{coverage}%</span>
            </div>

            <div
              ref={sliderRef}
              className="relative h-2 bg-white/10 rounded-full mb-5 cursor-pointer select-none"
              onPointerDown={handlePointerDown}
              onKeyDown={handleKeyDown}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={coverage}
              tabIndex={0}
              style={{ touchAction: "none" }}
            >
              <div
                className="h-full bg-[var(--gold-300)]/80 rounded-full"
                style={{ width: `${coverage}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[var(--gold-300)] shadow-lg touch-none"
                style={{ left: `${coverage}%`, transform: "translate(-50%, -50%)" }}
              />
            </div>
          </div>

          {/* Premium Calculation */}
          <div className="flex justify-between items-center mb-6 p-3 rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-white/80">Monthly Premium</span>
            <span className="text-lg font-bold text-[var(--gold-300)]">{premium}%/mo</span>
          </div>

          {/* Covered Risks - reduced animations */}
          <div className="mb-6">
            <div className="text-xs tracking-[0.05em] text-white/60 mb-3">Covered risks:</div>
            <div className="space-y-2">
              {coveredRisks.map((risk) => (
                <div
                  key={risk}
                  className="flex items-center gap-3 text-sm text-white/80 opacity-100"
                >
                  <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  </span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Hash & Button */}
          <div className="absolute bottom-2 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-[0.01em] text-white/40">Policy:</span>
              <span className="text-xs font-mono tracking-[0.01em] text-white/60 bg-white/5 px-2 py-1 rounded">
                {policyHash}
              </span>
            </div>
            <motion.button
              className="px-4 py-2 text-xs font-semibold text-white/60 bg-white/10 rounded-md border border-white/20 hover:bg-white/15 transition-colors"
              disabled
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Activate
            </motion.button>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1.15 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[10.25px] uppercase tracking-[0.01em] text-white/55">Coverage</span>
            <span className="text-[13.5px] font-semibold text-[var(--gold-300)]">{coverage}%</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1.15 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[10.25px] uppercase tracking-[0.01em] text-white/55">Premium</span>
            <span className="text-[13.5px] font-semibold text-[var(--gold-300)]">{premium}%/mo</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1.15 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[10.25px] uppercase tracking-[0.01em] text-white/55">Claim Window</span>
            <span className="text-[13.5px] font-semibold text-[var(--gold-300)]">48h</span>
          </div>
        </div>
      </div>
    </>
  );
});

InsuranceCoverage.displayName = "InsuranceCoverage";