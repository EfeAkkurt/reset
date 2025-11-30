"use client";

import React, { memo, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

interface PoolData {
  x: number;
  y: number;
  size: number;
  intensity: number;
  name: string;
  chain: string;
  apy: string;
}

interface TopPool {
  name: string;
  chain: string;
  apy: string;
  tvlChange: string;
}

// Canvas-based scatter plot for better performance
const ScatterPlot = memo<{ pools: PoolData[] }>(({ pools }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let opacity = 0.85;
    let opacityDirection = 1;

    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Update opacity for breathing effect
      opacity += 0.01 * opacityDirection;
      if (opacity >= 1 || opacity <= 0.85) {
        opacityDirection *= -1;
      }

      // Draw pools
      pools.forEach((pool, i) => {
        const x = (pool.x / 100) * rect.width;
        const y = rect.height - (pool.y / 100) * rect.height;

        // Create gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, pool.size);
        gradient.addColorStop(0, `rgba(255, 182, 72, ${pool.intensity * opacity})`);
        gradient.addColorStop(1, `rgba(224, 145, 44, ${pool.intensity * 0.4 * opacity})`);

        ctx.beginPath();
        ctx.arc(x, y, pool.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw ring for every other pool
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.arc(x, y, pool.size + 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 182, 72, ${pool.intensity * 0.2 * opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pools]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
});

ScatterPlot.displayName = "ScatterPlot";

export const OpportunityScatter = memo(() => {
  const topPools: TopPool[] = useMemo(() => [
    { name: "USDC–ETH 0.05%", chain: "Arbitrum", apy: "14.9%", tvlChange: "+$8.7M" },
    { name: "stETH–ETH 0.01%", chain: "Ethereum", apy: "7.1%", tvlChange: "+$2.2M" },
    { name: "USDT–USDC", chain: "Base", apy: "4.7%", tvlChange: "+$1.8M" },
  ], []);

  const pools: PoolData[] = useMemo(() => [
    { x: 18, y: 75, size: 8.8, intensity: 0.9, name: "USDC-ETH 0.05%", chain: "Arbitrum", apy: "14.2%" },
    { x: 31, y: 82, size: 13.2, intensity: 0.7, name: "stETH-ETH 0.01%", chain: "Ethereum", apy: "6.8%" },
    { x: 55, y: 65, size: 6.6, intensity: 0.95, name: "USDT-USDC", chain: "Base", apy: "4.5%" },
    { x: 40, y: 70, size: 11, intensity: 0.8, name: "WBTC-ETH", chain: "Optimism", apy: "12.4%" },
    { x: 68, y: 55, size: 15.4, intensity: 0.6, name: "FRAX-USDC", chain: "Fantom", apy: "15.7%" },
    { x: 77, y: 45, size: 9.9, intensity: 0.85, name: "LUSD-DAI", chain: "Ethereum", apy: "11.2%" },
    { x: 22, y: 88, size: 12.1, intensity: 0.75, name: "DAI-USDC", chain: "Polygon", apy: "5.8%" },
    { x: 49, y: 78, size: 7.7, intensity: 0.92, name: "ETH-stETH", chain: "Arbitrum", apy: "7.3%" },
    { x: 63, y: 60, size: 14.3, intensity: 0.65, name: "MIM-DAI", chain: "Avalanche", apy: "14.1%" },
    { x: 36, y: 85, size: 8.8, intensity: 0.88, name: "USDC-USDT", chain: "BSC", apy: "5.1%" },
  ], []);

  return (
    <>
      {/* Background gradient overlay */}
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
      <div className="relative z-10 p-8 md:p-10 lg:p-12 h-full flex flex-col mb-8">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--gold-300)]/20 flex items-center justify-center">
              <span className="text-xs text-[var(--gold-300)]">📡</span>
            </div>
            <span className="text-sm text-white/60">Signals</span>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 border border-white/20">
            24h
          </span>
        </div>

        {/* Top Movers List */}
        <div className="mb-3.5 space-y-2.5">
          {topPools.map((pool, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-white">{pool.name}</div>
                <div className="text-[10px] text-white/60">{pool.chain}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[var(--gold-300)]">{pool.apy}</div>
                <div className="text-[11px] text-green-400">{pool.tvlChange}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Canvas-based Scatter Plot */}
        <div className="relative flex-1 min-h-[245px] overflow-hidden rounded-xl bg-gradient-to-b from-white/5 to-white/0 mb-4">
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, white 1px, transparent 1px),
                linear-gradient(to bottom, white 1px, transparent 1px)
              `,
              backgroundSize: "38px 28px",
            }}
          />
          <ScatterPlot pools={pools} />

          {/* Axis labels */}
          <div className="absolute bottom-2 left-2 text-[10px] text-white/40">TVL →</div>
          <div className="absolute top-2 left-2 text-[10px] text-white/40">← APY</div>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-center gap-1.5 text-center py-2">
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-[0.01em] text-white/55">Trend</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">↑ Strong</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-[0.01em] text-white/55">Consistency</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">Low σ</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-[0.01em] text-white/55">Depth</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">$78M</span>
          </div>
        </div>
      </div>
    </>
  );
});

OpportunityScatter.displayName = "OpportunityScatter";