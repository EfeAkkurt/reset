"use client";

import React, { useCallback, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { StepCard } from "./StepCard";

type Side = "left" | "right";

interface StepData {
  side: Side;
  title: React.ReactNode;
  body: React.ReactNode;
  badge: string;
}

interface HowItWorksContainerProps {
  progress?: number;
}

// Optimized throttle using RAF
function useThrottledValue(value: number | undefined, delay: number = 16) {
  const throttledValue = useMotionValue(value ?? 0);
  const rafRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (value === undefined) return;

    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= delay) {
      throttledValue.set(value);
      lastUpdateRef.current = now;
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        throttledValue.set(value);
        lastUpdateRef.current = performance.now();
      });
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, delay, throttledValue]);

  return throttledValue;
}

const STEP_DATA: StepData[] = [
  {
    side: "left",
    badge: "Step 01",
    title: (
      <>
        Spot the{" "}
        <span style={{
          background: "var(--btn-grad)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}>
          signals
        </span>{" "}
        before the crowd
      </>
    ),
    body: "Track every pool and protocol with real-time APRs and TVL shifts across chains.",
  },
  {
    side: "right",
    badge: "Step 02",
    title: (
      <>
        Decode the{" "}
        <span style={{
          background: "var(--btn-grad)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}>
          risk
        </span>
        , not just the return
      </>
    ),
    body: "Turn risk factors into one visual truth — volatility, liquidity, and protocol health made measurable.",
  },
  {
    side: "left",
    badge: "Step 03",
    title: (
      <>
        Shield your{" "}
        <span style={{
          background: "var(--btn-grad)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}>
          yield
        </span>{" "}
        — on-chain insurance, automated
      </>
    ),
    body: "Shield your yield with on-chain insurance — no paperwork, no delays, just protection.",
  },
  {
    side: "right",
    badge: "Step 04",
    title: (
      <>
        Earn, withdraw, repeat — all in your{" "}
        <span style={{
          background: "var(--btn-grad)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}>
          wallet
        </span>
      </>
    ),
    body: "Your yield stays in your custody — withdraw anytime, no banks, no barriers.",
  },
];


export function HowItWorksContainer({ progress }: HowItWorksContainerProps) {
  const cardsOffset = 0.2;
  const rawProgress = useThrottledValue(progress);

  // Use a single spring for all animations
  const easedProgress = useSpring(rawProgress, {
    stiffness: 100,
    damping: 20,
    mass: 0.5,
  });

  // Optimized heading animations with fewer transforms
  const headingOpacity = useTransform(easedProgress, [0, 0.1, 0.18, cardsOffset], [0, 1, 1, 0]);
  const headingY = useTransform(easedProgress, [0, 0.1, 0.18, cardsOffset], [32, 0, 0, -12]);

  // Progress bar scale
  const progressScale = useTransform(easedProgress, [0, 1], [0.04, 1]);

  // Render individual step cards
  const renderStepCards = useCallback(() => {
    return STEP_DATA.map((step, index) => (
      <StepCard
        key={step.badge}
        id={`step-card-${index}`}
        index={index}
        step={step}
        total={STEP_DATA.length}
        progress={easedProgress}
        cardsOffset={cardsOffset}
      />
    ));
  }, [easedProgress, cardsOffset]);

  return (
    <section className="relative w-full h-full bg-[var(--bg)] text-[var(--text)] overflow-visible z-[1]">
      {/* Static background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(60% 60% at 60% 40%, rgba(255,182,72,0.04), transparent 70%),
            var(--bg)
          `,
        }}
      />

      {/* Progress indicator */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[60] h-1 w-[40vw] origin-left rounded-r-full bg-[var(--gold-300)]/80 md:w-[30vw]"
        style={{
          scaleX: progressScale,
          willChange: "transform",
        }}
      />

      <div className="relative mx-auto w-full h-full max-w-7xl px-8 md:px-10">
        {/* Heading section */}
        <div className="relative h-[40vh] flex flex-col items-start pt-20 md:pt-32 mb-12 md:mb-16 px-8 md:px-10">
          {/* Main heading */}
          <motion.div
            className="max-w-3xl"
            style={{
              opacity: headingOpacity,
              y: headingY,
              willChange: "transform, opacity",
            }}
          >
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-white/50">
              The OI Mechanism
            </p>
            <h2 className="text-4xl font-bold leading-[1.06] md:text-6xl">
              From signal to{" "}
              <span style={{
                background: "var(--btn-grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}>
                secured yield
              </span>
              — everything happens on-chain.
            </h2>
          </motion.div>

          {/* Secondary heading */}
          <motion.div
            className="ml-auto mt-12 max-w-3xl text-right"
            style={{
              opacity: headingOpacity,
              y: headingY,
              willChange: "transform, opacity",
            }}
          >
            <h2 className="text-4xl font-bold leading-[1.06] md:text-6xl text-white">
              Invest with{" "}
              <span style={{
                background: "var(--btn-grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}>
                clarity
              </span>
              , not complexity
            </h2>
          </motion.div>

          {/* Tertiary heading */}
          <motion.div
            className="max-w-3xl mt-12"
            style={{
              opacity: headingOpacity,
              y: headingY,
              willChange: "transform, opacity",
            }}
          >
            <h3 className="text-4xl font-semibold text-white/90 leading-[1.3] md:text-6xl">
              Your personal gateway to{" "}
              <span style={{
                background: "var(--btn-grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}>
                institutional-grade
              </span>
              {" "}yield
            </h3>
          </motion.div>
        </div>

        {/* Cards section */}
        <div className="relative h-[55vh] flex items-center overflow-visible -mt-8">
          <div className="relative w-full h-[600px] md:h-[700px]">
            {renderStepCards()}
          </div>
        </div>
      </div>
    </section>
  );
}