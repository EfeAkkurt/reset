"use client";

import React, {
  memo,
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { motion, MotionValue, useTransform, useSpring } from "framer-motion";
import { ShieldCheck } from "lucide-react";

type Side = "left" | "right";

interface StepData {
  side: Side;
  title: React.ReactNode;
  body: React.ReactNode;
  badge: string;
}

interface InsuranceStepProps {
  id: string;
  index: number;
  step: StepData;
  total: number;
  progress: MotionValue<number>;
  cardsOffset: number;
}

const microBenefits = [
  "Parametric payouts",
  "Transparent premiums",
  "Pool-backed coverage",
];

const coveredRiskItems = [
  { label: "Protocol Exploit", tag: "smart-contract", status: "covered" },
  { label: "Governance Attack", tag: "governance", status: "covered" },
  { label: "Liquidity Shock", tag: "liquidity", status: "soon" },
];

export const InsuranceStep = memo<InsuranceStepProps>(({
  id,
  index,
  step,
  total,
  progress,
  cardsOffset,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [coverage, setCoverage] = useState(60);
  const coverageSpring = useSpring(coverage, {
    stiffness: 140,
    damping: 24,
    mass: 0.6,
  });
  const [animatedCoverage, setAnimatedCoverage] = useState(coverage);

  useEffect(() => {
    const unsubscribe = coverageSpring.on("change", (value) => {
      setAnimatedCoverage(value);
    });

    return () => {
      unsubscribe();
    };
  }, [coverageSpring]);

  useEffect(() => {
    coverageSpring.set(coverage);
  }, [coverage, coverageSpring]);

  const policyAddress = "GAS7…E7AO";
  const summaryMetrics = useMemo(() => ([
    { label: "Coverage", value: `${Math.round(coverage)}%` },
    { label: "Premium", value: `${(coverage * 0.02).toFixed(1)}%/mo` },
    { label: "Claim Window", value: "48h" },
  ]), [coverage]);

  const updateCoverage = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const relative = (clientX - rect.left) / rect.width;
    const next = Math.max(0, Math.min(100, Math.round(relative * 100)));
    setCoverage(next);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateCoverage(event.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      updateCoverage(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [updateCoverage]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        setCoverage((prev) => Math.max(0, prev - delta));
        break;
      case "ArrowRight":
        event.preventDefault();
        setCoverage((prev) => Math.min(100, prev + delta));
        break;
      case "Home":
        setCoverage(0);
        break;
      case "End":
        setCoverage(100);
        break;
      default:
        break;
    }
  }, []);

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

  const animatedCoveragePct = Math.round(animatedCoverage);
  const animatedPremium = (animatedCoverage * 0.02).toFixed(1);
  const premiumGlowStrength = 0.18 + (animatedCoveragePct / 100) * 0.22;

  return (
    <>
      <style jsx>{`
        @keyframes coverageGlow {
          0% {
            transform: scale(0.96);
            opacity: 0.85;
          }
          100% {
            transform: scale(1.02);
            opacity: 1;
          }
        }
        .insurance-card:hover .premium-pill {
          animation: coverageGlow 2s ease-in-out infinite alternate;
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
              className="order-2 lg:order-1 space-y-5 lg:space-y-6"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--neutral-900)]/80 border border-[color:var(--alpha-gold-16)] px-3 py-[6px] text-[11px] tracking-[0.16em] uppercase text-[color:var(--text-2)]">
                <span className="inline-flex h-[6px] w-[6px] rounded-full bg-[color:var(--gold-500)]" />
                {step.badge}
              </div>
              <h3 className="text-[30px] sm:text-[34px] lg:text-[38px] font-semibold leading-[1.15] text-white max-w-xl">
                Shield your <span className="text-[color:var(--gold-500)]">yield</span> — on-chain insurance, automated
              </h3>
              <p className="text-[14px] leading-relaxed text-[color:var(--text-2)] max-w-md">
                {step.body}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[color:var(--text-2)]/70">
                {microBenefits.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="inline-flex h-[6px] w-[6px] rounded-full bg-[color:var(--gold-500)]" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="order-1 lg:order-2 flex justify-center"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            >
              <motion.div
                className="insurance-card relative w-full max-w-[420px] min-h-[420px] lg:min-h-[460px] bg-[color:var(--neutral-900)]/95 border border-[color:var(--alpha-gold-16)] rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.9)] px-6 py-6 lg:px-7 lg:py-7 overflow-hidden group"
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
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{
                    background: "radial-gradient(circle at 20% 0%, rgba(224,145,44,0.25), transparent 55%)",
                    opacity: 0.8,
                    mixBlendMode: "screen",
                  }}
                />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--alpha-gold-16)] bg-[color:var(--neutral-900)]/80">
                        <ShieldCheck className="h-4 w-4 text-[color:var(--gold-500)]" strokeWidth={1.6} />
                      </span>
                      <span className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--text-2)]/80">
                        Coverage Config
                      </span>
                    </div>
                    <button className="text-[11px] tracking-[0.14em] uppercase text-[color:var(--text-2)]/60 transition-colors hover:text-[color:var(--gold-400)]">
                      configurable
                    </button>
                  </div>

                  <div className="space-y-5 flex-1">
                    <div>
                      <div className="flex items-center justify-between text-[12px] uppercase text-[color:var(--text-2)]/80">
                        <span>Coverage Amount</span>
                        <span className="text-[13px] font-medium text-white drop-shadow-[0_0_12px_rgba(224,145,44,0.35)]">
                          {animatedCoveragePct}%
                        </span>
                      </div>
                      <div
                        ref={sliderRef}
                        className="mt-3 relative h-[6px] rounded-full bg-[color:var(--neutral-800)] cursor-pointer group"
                        onPointerDown={handlePointerDown}
                        onKeyDown={handleKeyDown}
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={coverage}
                        aria-label="Coverage amount"
                        tabIndex={0}
                        style={{ touchAction: "none" }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${coverage}%`,
                            background: "linear-gradient(90deg, var(--gold-400), var(--gold-600))",
                          }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[color:var(--gold-500)] shadow-[0_0_0_6px_rgba(224,145,44,0.22)] border border-white/30"
                          style={{ left: `${coverage}%`, transform: "translate(-50%, -50%)" }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-[color:var(--text-2)]/55">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div
                      className="premium-pill mt-4 inline-flex flex-col items-center justify-center rounded-full border border-[color:var(--alpha-gold-16)] bg-[color:var(--neutral-900)]/90 px-5 py-2.5 text-center transition-shadow"
                      style={{
                        boxShadow: `0 0 32px rgba(224,145,44,${premiumGlowStrength})`,
                      }}
                    >
                      <span className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--text-2)]/75">
                        Monthly Premium
                      </span>
                      <span className="text-[16px] font-semibold text-white">
                        {animatedPremium}%/mo
                      </span>
                    </div>

                    <div>
                      <div className="text-[12px] text-[color:var(--text-2)]/80 uppercase mb-2">
                        Covered risks
                      </div>
                      <div className="space-y-2.5">
                        {coveredRiskItems.map((risk) => (
                          <div
                            key={risk.label}
                            className={`flex items-center gap-3 text-[13px] ${
                              risk.status === "soon"
                                ? "text-[color:var(--text-2)]/45"
                                : "text-[color:var(--text-2)]"
                            }`}
                          >
                            <span
                              className={`flex h-[14px] w-[14px] items-center justify-center rounded-full ${
                                risk.status === "soon"
                                  ? "border border-dashed border-[color:var(--neutral-600)]/80 bg-transparent"
                                  : "border border-[#22C55E]/60 bg-[rgba(34,197,94,0.16)]"
                              }`}
                            >
                              <span
                                className={`h-[6px] w-[6px] rounded-full ${
                                  risk.status === "soon" ? "bg-[color:var(--neutral-600)]" : "bg-[#22C55E]"
                                }`}
                              />
                            </span>
                            <span className="flex-1">{risk.label}</span>
                            <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border border-[color:var(--neutral-700)]/70 text-[color:var(--text-2)]/70">
                              {risk.tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--neutral-900)] px-3 py-1 border border-[color:var(--neutral-600)] text-[11px] font-mono text-[color:var(--text-2)]/80">
                      <span className="uppercase">Policy</span>
                      {policyAddress}
                    </span>
                    <motion.button
                      className="rounded-full px-4 py-1.5 text-[13px] font-medium text-[#0A0A0A]"
                      style={{
                        background: "linear-gradient(135deg, var(--gold-400), var(--gold-600))",
                        boxShadow: "0 10px 30px rgba(224,145,44,0.35)",
                      }}
                      whileHover={{ y: -1, filter: "brightness(1.08)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Activate
                    </motion.button>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[color:var(--neutral-800)]/80 flex flex-wrap gap-2">
                    {summaryMetrics.map((metric) => (
                      <span
                        key={metric.label}
                        className="inline-flex items-center gap-1 rounded-full bg-[color:var(--neutral-900)]/90 border border-[color:var(--alpha-gold-16)] px-3 py-[6px] text-[11px] tracking-[0.12em] uppercase text-[color:var(--text-2)]/80"
                      >
                        {metric.label} {metric.value}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </motion.article>
    </>
  );
});

InsuranceStep.displayName = "InsuranceStep";
