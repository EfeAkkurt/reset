"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";

interface RiskData {
  axis: string;
  value: number;
  maxValue: number;
}

export const RiskRadar = memo(() => {
  const riskData: RiskData[] = useMemo(() => [
    { axis: "Volatility", value: 0.22, maxValue: 1 },
    { axis: "Liquidity", value: 0.68, maxValue: 1 },
    { axis: "Protocol Health", value: 0.18, maxValue: 1 },
    { axis: "Oracle Risk", value: 0.30, maxValue: 1 },
    { axis: "Code Maturity", value: 0.26, maxValue: 1 },
    { axis: "Centralization", value: 0.35, maxValue: 1 },
  ], []);

  const riskScore = 0.22;
  const riskLevel = riskScore < 0.3 ? "Low" : riskScore < 0.6 ? "Medium" : "High";
  const riskColor = riskScore < 0.3 ? "#FFB648" : riskScore < 0.6 ? "#FFA726" : "#FF6B6B";

  // Pre-calculate radar polygon points
  const radarPoints = useMemo(() => {
    const angleStep = (2 * Math.PI) / riskData.length;
    const centerX = 748; // Half of container width (2x)
    const centerY = 550; // 2x
    const maxRadius = 260; // Optimized radius (2x)

    return riskData.map((point, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const distance = (point.value / point.maxValue) * maxRadius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      return { x, y };
    });
  }, [riskData]);

  // Pre-calculate label positions
  const labelPositions = useMemo(() => {
    const angleStep = (2 * Math.PI) / riskData.length;
    const centerX = 748; // 2x
    const centerY = 550; // 2x
    const labelDistance = 360; // 2x

    return riskData.map((point, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * labelDistance;
      const y = centerY + Math.sin(angle) * labelDistance;
      return { x, y, text: point.axis };
    });
  }, [riskData]);

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
              <span className="text-xs text-[var(--gold-300)]">🛡️</span>
            </div>
            <span className="text-sm text-white/60">Risk Radar</span>
          </div>
          <span className="rounded-full bg-[var(--gold-300)]/15 px-3 py-1 text-xs text-[var(--gold-300)]">
            live
          </span>
        </div>

        {/* Optimized Radar Chart */}
        <div className="relative flex-1 min-h-[900px] overflow-hidden rounded-xl bg-gradient-to-b from-white/5 to-white/0 mb-8">
          <svg
            viewBox="0 0 1496 1100"
            className="absolute inset-0 h-full w-full"
            style={{ maxWidth: "95%", margin: "0 auto" }}
          >
            {/* Static grid circles - reduced from 5 to 3 for performance */}
            {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
              <circle
                key={i}
                cx="748"
                cy="550"
                r={260 * level}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="3"
              />
            ))}

            {/* Grid lines - simplified */}
            {riskData.map((_, i) => {
              const angle = (i * 2 * Math.PI) / riskData.length - Math.PI / 2;
              const x = 748 + Math.cos(angle) * 260;
              const y = 550 + Math.sin(angle) * 260;
              return (
                <line
                  key={i}
                  x1="748"
                  y1="550"
                  x2={x}
                  y2={y}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                />
              );
            })}

            {/* Gradient definition */}
            <defs>
              <radialGradient id="riskGradient">
                <stop offset="0%" stopColor={riskColor} stopOpacity="0.5" />
                <stop offset="100%" stopColor={riskColor} stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Data polygon with animation */}
            <motion.polygon
              points={radarPoints.map(p => `${p.x},${p.y}`).join(" ")}
              fill="url(#riskGradient)"
              fillOpacity={0.25}
              stroke={riskColor}
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Data points with staggered animation */}
            {radarPoints.map((point, i) => (
              <motion.circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="10"
                fill={riskColor}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
              />
            ))}

            {/* Labels */}
            {labelPositions.map((label, i) => (
              <text
                key={i}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[44px] font-medium fill-white/85"
                style={{ willChange: "transform" }}
              >
                {label.text}
              </text>
            ))}
          </svg>

          {/* Risk Score Overlay */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div
              className="text-lg font-bold"
              style={{ color: riskColor }}
            >
              Risk Score: {riskScore.toFixed(2)} ({riskLevel})
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-6 flex items-center justify-center gap-6 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-[0.01em] text-white/55">VaR(95%)</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">−2.1%</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-[0.01em] text-white/55">IL Sensitivity</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">Low</span>
          </div>
        </div>
      </div>
    </>
  );
});

RiskRadar.displayName = "RiskRadar";