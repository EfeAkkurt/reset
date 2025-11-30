"use client";

import React, { memo, useMemo, useId } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Shield } from "lucide-react";

type Side = "left" | "right";

interface StepData {
  side: Side;
  title: React.ReactNode;
  body: React.ReactNode;
  badge: string;
}

interface RiskStepProps {
  id: string;
  index: number;
  step: StepData;
  total: number;
  progress: MotionValue<number>;
  cardsOffset: number;
}

const microBullets = ["Volatility bands", "Liquidity depth", "On-chain telemetry"];

export const RiskStep = memo<RiskStepProps>(({
  id,
  index,
  step,
  total,
  progress,
  cardsOffset,
}) => {
  const radarData = useMemo(() => [
    { metric: "Volatility", value: 0.32 },
    { metric: "Liquidity", value: 0.18 },
    { metric: "Centralization", value: 0.46 },
    { metric: "Code Maturity", value: 0.24 },
    { metric: "Oracle Risk", value: 0.41 },
    { metric: "Protocol Health", value: 0.2 },
  ], []);

  const gradientId = useId().replace(/:/g, "");

  const animationRanges = useMemo(() => {
    const usableSpan = 1 - cardsOffset;
    const segment = usableSpan / total;
    const start = cardsOffset + index * segment;
    const enterEnd = start + segment * 0.5;
    const exitStart = start + segment * 0.92;
    const end = start + segment;

    return {
      base: [start, enterEnd, exitStart, end] as [number, number, number, number],
    };
  }, [index, total, cardsOffset]);

  const opacity = useTransform(progress, animationRanges.base, [0, 1, 1, 0]);
  const translateX = useTransform(progress, animationRanges.base, [-88, 0, 0, 44]);
  const scale = useTransform(progress, animationRanges.base, [0.96, 1, 1, 1]);
  const pointerEvents = useTransform(progress, animationRanges.base, ["none", "auto", "auto", "none"] as const);

  return (
    <>
      <style jsx>{`
        @keyframes riskRadarBreathe {
          0% {
            transform: translate(-50%, -50%) scale(0.96);
          }
          100% {
            transform: translate(-50%, -50%) scale(1.02);
          }
        }
      `}</style>
      <motion.article
        id={id}
        className="absolute inset-0 -translate-y-1/2 px-4 sm:px-6 xl:px-8 flex items-center justify-center z-10"
        style={{
          opacity,
          x: translateX,
          scale,
          pointerEvents,
          backfaceVisibility: "hidden" as const,
          transformStyle: "preserve-3d" as const,
          willChange: "transform, opacity",
        }}
      >
        <section className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="order-2 lg:order-1 flex items-center justify-center"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            >
              <motion.div
                className="relative w-full max-w-[420px] h-[520px] lg:h-[560px] bg-[color:var(--neutral-900)]/95 border border-[color:var(--alpha-gold-16)] rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.9)] px-6 py-6 lg:px-7 lg:py-7 overflow-hidden flex flex-col hover:border-[color:var(--gold-500)]/60 hover:shadow-[0_0_60px_rgba(224,145,44,0.28)]"
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.55 }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 24px 80px rgba(0,0,0,0.95)",
                }}
                transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-70 mix-blend-screen"
                  style={{
                    background: "radial-gradient(circle at 50% 10%, rgba(224,145,44,0.22), transparent 55%)",
                    animation: "riskRadarBreathe 8s ease-in-out infinite alternate",
                  }}
                />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border border-[color:var(--alpha-gold-16)]/60 bg-[color:var(--alpha-gold-16)]/20 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-[color:var(--gold-500)]" strokeWidth={1.6} />
                    </div>
                    <span className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--text-2)]/80">
                      Risk Radar
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#4ADE80] text-[11px] uppercase tracking-[0.16em]">
                    <span className="relative flex h-[10px] w-[10px] items-center justify-center">
                      <span className="absolute inline-flex h-[6px] w-[6px] rounded-full bg-[#4ADE80] opacity-70 animate-ping" />
                      <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#4ADE80]" />
                    </span>
                    live
                  </div>
                </div>

                <div className="relative flex-1 flex items-center justify-center min-h-[340px] lg:min-h-[380px] mt-4 z-10">
                  <motion.div
                    className="w-full h-full"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="60%">
                        <PolarGrid
                          stroke="rgba(255,255,255,0.08)"
                          radialLines={false}
                          gridType="polygon"
                        />
                        <PolarAngleAxis
                          dataKey="metric"
                          tickLine={false}
                          tick={{ fill: "rgba(216,217,222,0.75)", fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                          axisLine={false}
                          tick={false}
                          tickCount={4}
                          angle={90}
                          domain={[0, 0.6]}
                        />
                        <defs>
                          <radialGradient id={`riskRadarFill-${gradientId}`} cx="50%" cy="50%" r="65%">
                            <stop offset="0%" stopColor="rgba(224,145,44,0.65)" />
                            <stop offset="100%" stopColor="rgba(224,145,44,0.05)" />
                          </radialGradient>
                        </defs>
                        <Radar
                          name="Risk"
                          dataKey="value"
                          stroke="rgba(243,162,51,0.96)"
                          strokeWidth={2}
                          fill={`url(#riskRadarFill-${gradientId})`}
                          fillOpacity={1}
                          dot={{ r: 3, fill: "#F3A233", strokeWidth: 0 }}
                          isAnimationActive
                          animationDuration={900}
                          animationEasing="ease-out"
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>

                <p className="relative z-10 mt-4 text-[11px] text-[color:var(--text-2)]/60">
                  Aggregated risk across volatility, liquidity & protocol health.
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              className="order-1 lg:order-2 space-y-5 lg:space-y-6 max-w-xl"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--neutral-900)]/80 border border-[color:var(--alpha-gold-16)] px-3 py-[6px] text-[11px] tracking-[0.16em] uppercase text-[color:var(--text-2)]">
                <span className="inline-flex h-[6px] w-[6px] rounded-full bg-[color:var(--gold-500)]" />
                {step.badge}
              </div>
              <h3 className="text-[30px] sm:text-[34px] lg:text-[38px] font-semibold leading-[1.15] text-white max-w-lg">
                Decode the{" "}
                <span className="relative inline-flex text-[color:var(--gold-500)]">
                  <span className="relative z-10">risk</span>
                  <span className="absolute left-0 right-0 -bottom-1 h-px bg-[color:var(--gold-500)]/70" />
                </span>{" "}
                , not just the return
              </h3>
              <p className="text-[14px] leading-relaxed text-[color:var(--text-2)] max-w-md">
                {step.body}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[color:var(--text-2)]/70">
                {microBullets.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="inline-flex h-[6px] w-[6px] rounded-full bg-[color:var(--gold-500)]" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </motion.article>
    </>
  );
});

RiskStep.displayName = "RiskStep";
