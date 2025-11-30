"use client";

import React, { memo, useMemo } from "react";
import { motion, useTransform, MotionValue } from "framer-motion";
import { OpportunityScatter } from "./visuals/OpportunityScatter";
import { RiskRadar } from "./visuals/RiskRadar";
import { InsuranceCoverage } from "./visuals/InsuranceCoverage";
import { WithdrawWidget } from "./visuals/WithdrawWidget";

type Side = "left" | "right";

interface StepData {
  side: Side;
  title: React.ReactNode;
  body: React.ReactNode;
  badge: string;
}

interface StepCardProps {
  id: string;
  index: number;
  step: StepData;
  total: number;
  progress: MotionValue<number>;
  cardsOffset: number;
}

// Memoize the badge component to prevent unnecessary re-renders
const Badge = memo(({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs tracking-wide uppercase text-white/80">
    <span className="inline-block h-2 w-2 rounded-full bg-[var(--gold-300)]" />
    {children}
  </div>
));

Badge.displayName = "Badge";

// Memoize visual card factory
const VisualCard = memo(({ index }: { index: number }) => {
  switch (index) {
    case 0:
      return <OpportunityScatter />;
    case 1:
      return <RiskRadar />;
    case 2:
      return <InsuranceCoverage />;
    case 3:
      return <WithdrawWidget />;
    default:
      return <DefaultVisualCard />;
  }
});

VisualCard.displayName = "VisualCard";

const DefaultVisualCard = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-white/50">Loading...</div>
  </div>
);

// Main StepCard component with optimizations
export const StepCard = memo<StepCardProps>(({
  id,
  index,
  step,
  total,
  progress,
  cardsOffset
}) => {
  // Calculate animation ranges once using useMemo
  const animationRanges = useMemo(() => {
    const usableSpan = 1 - cardsOffset;
    const segment = usableSpan / total;
    const start = cardsOffset + index * segment;
    const enterEnd = start + segment * 0.5;
    const exitStart = start + segment * 0.92;
    const end = start + segment;

    // Stagger visual animations
    const visualStart = start + segment * 0.15;
    const visualEnd = end;

    return {
      base: [start, enterEnd, exitStart, end] as [number, number, number, number],
      visual: [visualStart, enterEnd, exitStart, visualEnd] as [number, number, number, number],
    };
  }, [index, total, cardsOffset]);

  // Card opacity and position
  const opacity = useTransform(progress, animationRanges.base, [0, 1, 1, 0]);
  const translateX = useTransform(progress, animationRanges.base, [
    step.side === "left" ? -88 : 88,
    0,
    0,
    step.side === "left" ? 44 : -44,
  ]);
  const scale = useTransform(progress, animationRanges.base, [0.96, 1, 1, 1]);

  // Text animations
  const textOpacity = useTransform(progress, animationRanges.base, [0, 1, 1, 0]);

  // Visual container animations
  const visualOpacity = useTransform(progress, animationRanges.visual, [0, 1, 1, 0]);
  const visualScale = useTransform(progress, animationRanges.visual, [0.96, 1, 1, 1]);

  // Pointer events - only enable when fully visible
  const pointerEvents = useTransform(progress, animationRanges.base, [
    "none", "auto", "auto", "none"
  ] as const);

  const transforms = useMemo(() => ({
    opacity,
    translateX,
    scale,
    textOpacity,
    visualOpacity,
    visualScale,
    pointerEvents,
  }), [opacity, translateX, scale, textOpacity, visualOpacity, visualScale, pointerEvents]);

  // CSS classes for grid layout based on side
  const gridClasses = useMemo(() =>
    step.side === "left"
      ? "xl:grid-cols-[1.76fr_1fr] lg:grid-cols-[1.65fr_1fr] md:grid-cols-[1.54fr_1fr]"
      : "xl:grid-cols-[1fr_1.76fr] lg:grid-cols-[1fr_1.65fr] md:grid-cols-[1fr_1.54fr]",
    [step.side]
  );

  // Order classes for right-side cards
  const orderClasses = useMemo(() =>
    step.side === "right" ? "lg:order-2" : "",
    [step.side]
  );

  const visualOrderClasses = useMemo(() =>
    step.side === "right" ? "lg:order-1 lg:self-start lg:-mt-6 xl:-mt-10 2xl:-mt-12" : "",
    [step.side]
  );

  return (
    <motion.article
      id={id}
      className={`absolute inset-0 grid items-start justify-items-stretch -translate-y-1/2 gap-8 lg:gap-12 px-6 z-10 ${gridClasses}`}
      style={{
        opacity: transforms.opacity,
        x: transforms.translateX,
        scale: transforms.scale,
        pointerEvents: transforms.pointerEvents,
        backfaceVisibility: "hidden" as const,
        transformStyle: "preserve-3d" as const,
        willChange: "transform, opacity",
      }}
      layout={false} // Disable Layout API for better performance
    >
      {/* Text Content */}
      <motion.div
        className={`${orderClasses} lg:self-center max-w-[704px]`}
        style={{
          opacity: transforms.textOpacity,
          willChange: "opacity",
        }}
      >
        <Badge>{step.badge}</Badge>
        <h3 className="text-[32px] font-semibold leading-[1.07] md:text-[40px] lg:text-[44px] lg:leading-[1.04] text-white">
          {step.title}
        </h3>
        <p className="mt-3 text-[17px] leading-[1.55] text-white/70 md:text-[18px] line-clamp-2">
          {step.body}
        </p>
      </motion.div>

      {/* Visual Card */}
      <motion.div
        className={`relative rounded-3xl border border-white/12 bg-white/[0.035] shadow-[var(--shadow-black-lg)] backdrop-blur-xl max-w-[924px] w-full md:min-h-[420px] lg:min-h-[520px] 2xl:max-h-[70vh] overflow-hidden hover:shadow-sm ${visualOrderClasses}`}
        style={{
          opacity: transforms.visualOpacity,
          scale: transforms.visualScale,
          willChange: "transform, opacity",
        }}
        whileHover={{ scale: 1.01 }} // Reduced hover effect for performance
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <VisualCard index={index} />
      </motion.div>
    </motion.article>
  );
});

StepCard.displayName = "StepCard";