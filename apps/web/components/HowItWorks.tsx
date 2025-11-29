"use client";

import {
  MotionValue,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { useEffect, useMemo } from "react";

// Simple throttle utility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
// eslint-disable-next-line @typescript-eslint/no-unused-vars
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// ... (skipping unchanged parts)



type Side = "left" | "right";

const stepData: Array<{
  side: Side;
  title: React.ReactNode;
  body: React.ReactNode;
  badge: string;
}> = [
  {
    side: "left",
    badge: "Step 01",
    title: (
      <>
        Spot the{" "}
        <span
          style={{
            background: "var(--btn-grad)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
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
        <span
          style={{
            background: "var(--btn-grad)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
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
        <span
          style={{
            background: "var(--btn-grad)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
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
        <span
          style={{
            background: "var(--btn-grad)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          wallet
        </span>
      </>
    ),
    body: "Your yield stays in your custody — withdraw anytime, no banks, no barriers.",
  },
];

type HowItWorksProps = {
  /** Local scene progress supplied by ScrollOrchestrator (0..1). */
  progress?: number;
};

export default function HowItWorks({ progress }: HowItWorksProps) {
  const prefersReducedMotion = useReducedMotion();
  // Remove scroll tracking since ScrollOrchestrator handles it
  const rawProgress = useMotionValue(progress ?? 0);
  const cardsOffset = 0.20; // heading'den hemen sonra ilk kart

  // Throttle progress updates to 60fps (16ms)
  const throttledUpdateProgress = useMemo(
    () => throttle((value: number) => {
      rawProgress.set(value);
    }, 16),
    [rawProgress]
  );

  useEffect(() => {
    if (progress !== undefined) {
      throttledUpdateProgress(progress);
    }
  }, [progress, throttledUpdateProgress]);

  const drive = rawProgress;

  const easedProgress = useSpring(drive, {
    stiffness: 90,
    damping: 18,
    mass: 0.35,
  });

  // No moving background - keep it static

  const progressScale = useTransform(easedProgress, [0, 1], [0.04, 1]);

  const headingOpacity = useTransform(easedProgress, [0, 0.10, 0.18, cardsOffset], [0, 1, 1, 0]);
  const headingY = useTransform(easedProgress, [0, 0.10, 0.18, cardsOffset], [32, 0, 0, -12]);
  const headingBlurStrength = useTransform(easedProgress, [0, 0.10, 0.18, cardsOffset], [10, 0, 0, 6]);
  const headingBlur = useMotionTemplate`blur(${headingBlurStrength}px)`;
  const headingPointer = useTransform(easedProgress, [0, cardsOffset - 0.02, cardsOffset], ["auto", "auto", "none"]);

  return (
    <section className="relative w-full h-full bg-[var(--bg)] text-[var(--text)] overflow-visible z-[1]">
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

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[60] h-1 w-[40vw] origin-left rounded-r-full bg-[var(--gold-300)]/80 md:w-[30vw]"
        style={{
          scaleX: progressScale,
        }}
      />

      <div className="relative mx-auto w-full h-full max-w-7xl px-8 md:px-10">
        {/* Heading section with proper spacing */}
        <div className="relative h-[40vh] flex flex-col items-start pt-20 md:pt-32 mb-12 md:mb-16 px-8 md:px-10">
          {/* Left aligned text - top */}
          <motion.div
            className="max-w-3xl"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: headingOpacity,
                    y: headingY,
                    filter: headingBlur,
                    pointerEvents: headingPointer,
                  }
            }
          >
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-white/50">
              The OI Mechanism
            </p>
            <h2 className="text-4xl font-bold leading-[1.06] md:text-6xl">
              From signal to{" "}
              <span
                style={{
                  background: "var(--btn-grad)",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                secured yield
              </span>
              — everything happens on-chain.
            </h2>
          </motion.div>

          {/* Right aligned text - middle */}
          <motion.div
            className="ml-auto mt-12 max-w-3xl text-right"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: headingOpacity,
                    y: headingY,
                    filter: headingBlur,
                  }
            }
          >
            <h2 className="text-4xl font-bold leading-[1.06] md:text-6xl text-white">
              Invest with{" "}
              <span
                style={{
                  background: "var(--btn-grad)",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                clarity
              </span>
              , not complexity
            </h2>
          </motion.div>

          {/* Left aligned text - bottom */}
          <motion.div
            className="max-w-3xl mt-12"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: headingOpacity,
                    y: headingY,
                    filter: headingBlur,
                  }
            }
          >
            <h3 className="text-4xl font-semibold text-white/90 leading-[1.3] md:text-6xl">
              Your personal gateway to{" "}
              <span
                style={{
                  background: "var(--btn-grad)",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                institutional-grade
              </span>
              {" "}yield
            </h3>
          </motion.div>
        </div>

        {/* Cards section - takes remaining space */}
        <div className="relative h-[55vh] flex items-center overflow-visible -mt-8">
          {prefersReducedMotion ? (
            <div className="space-y-16 md:space-y-20 w-full">
              {stepData.map((step, idx) => (
                <StaticStepCard key={step.badge} step={step} index={idx} />
              ))}
            </div>
          ) : (
            <div className="relative w-full h-[600px] md:h-[700px]">
              {stepData.map((step, idx) => (
                <AnimatedStepCard
                  key={step.badge}
                  index={idx}
                  step={step}
                  total={stepData.length}
                  progress={easedProgress}
                  cardsOffset={cardsOffset}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AnimatedStepCard({
  index,
  step,
  total,
  progress,
  cardsOffset,
}: {
  index: number;
  step: {
    side: Side;
    title: React.ReactNode;
    body: React.ReactNode;
    badge: string;
  };
  total: number;
  progress: MotionValue<number>;
  cardsOffset: number;
}) {
  const usableSpan = 1 - cardsOffset;
  const segment = usableSpan / total;
  const start = cardsOffset + index * segment;
  const enterEnd = start + segment * 0.5;
  const exitStart = start + segment * 0.92;
  const end = start + segment;

  const baseRange = [start, enterEnd, exitStart, end];

  const opacity = useTransform(progress, baseRange, [0, 1, 1, 0.12]);
  const translateX = useTransform(progress, baseRange, [
    step.side === "left" ? -88 : 88,
    0,
    0,
    step.side === "left" ? 44 : -44,
  ]);
  const translateY = useTransform(progress, baseRange, [-100, -100, -100, -100]);
  const scale = useTransform(progress, baseRange, [0.96, 1.02, 1.02, 1.0]);
  const blurStrength = useTransform(progress, baseRange, [6, 0, 0, 2]);
  const blur = useMotionTemplate`blur(${blurStrength}px)`;
  const pointerEvents = useTransform(progress, baseRange, [
    "none",
    "auto",
    "auto",
    "none",
  ]);

  const textOpacity = useTransform(progress, baseRange, [0, 1, 1, 0]);
  const textX = useTransform(progress, baseRange, [
    step.side === "left" ? -78 : 78,
    0,
    0,
    step.side === "left" ? 46 : -46,
  ]);

  const visualRange = [
    start + segment * 0.15, // +120ms stagger for depth
    start + segment * 0.65,
    exitStart,
    end,
  ];

  const visualOpacity = useTransform(progress, visualRange, [0, 1, 1, 0]);

  const visualX = useTransform(progress, visualRange, [
    step.side === "left" ? -58 : 58,
    0,
    0,
    step.side === "left" ? 44 : -44,
  ]);

  const visualScale = useTransform(progress, visualRange, [0.96, 1.02, 1.02, 1.0]);

  return (
    <motion.article
      className={`absolute inset-0 grid items-start justify-items-stretch -translate-y-1/2 gap-8 lg:gap-12 px-6 z-10 ${
        step.side === "left"
          ? "xl:grid-cols-[1.76fr_1fr] lg:grid-cols-[1.65fr_1fr] md:grid-cols-[1.54fr_1fr]"
          : "xl:grid-cols-[1fr_1.76fr] lg:grid-cols-[1fr_1.65fr] md:grid-cols-[1fr_1.54fr]"
      }`}
      style={{
        opacity,
        x: translateX,
        y: translateY,
        scale,
        filter: blur,
        pointerEvents,
        backfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
      }}
      transition={{ type: "spring", stiffness: 180, damping: 20, mass: 1 }}
    >
      <motion.div
        className={`${step.side === "left" ? "" : "lg:order-2"} lg:self-center max-w-[704px]`}
        style={{
          opacity: textOpacity,
          x: textX,
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

      <motion.div
        className={`relative rounded-3xl border border-white/12 bg-white/[0.035] shadow-[var(--shadow-black-lg)] backdrop-blur-xl max-w-[924px] w-full md:min-h-[420px] lg:min-h-[520px] 2xl:max-h-[70vh] overflow-hidden hover:shadow-sm ${
          step.side === "left" ? "" : "lg:order-1 lg:self-start lg:-mt-6 xl:-mt-10 2xl:-mt-12"
        }`}
        style={{
          opacity: visualOpacity,
          x: visualX,
          scale: visualScale,
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 180, damping: 20, mass: 1 }}
      >
        <VisualCard index={index} />
      </motion.div>
    </motion.article>
  );
}

function StaticStepCard({ step, index }: { step: (typeof stepData)[number]; index: number }) {
  return (
    <article
      className={`grid items-center justify-items-stretch gap-8 lg:gap-12 ${
        step.side === "left"
          ? "xl:grid-cols-[1.76fr_1fr] lg:grid-cols-[1.65fr_1fr] md:grid-cols-[1.54fr_1fr]"
          : "xl:grid-cols-[1fr_1.76fr] lg:grid-cols-[1fr_1.65fr] md:grid-cols-[1fr_1.54fr]"
      }`}
    >
      <div className={`${step.side === "left" ? "" : "lg:order-2"} max-w-[704px]`}>
        <Badge>{step.badge}</Badge>
        <h3 className="text-[32px] font-semibold leading-[1.07] md:text-[40px] lg:text-[44px] lg:leading-[1.04] text-white">
          {step.title}
        </h3>
        <p className="mt-3 text-[17px] leading-[1.55] text-white/70 md:text-[18px] line-clamp-2">
          {step.body}
        </p>
      </div>
      <div
        className={`relative rounded-3xl border border-white/12 bg-white/[0.035] shadow-[var(--shadow-black-lg)] backdrop-blur-xl max-w-[924px] lg:max-w-[880px] md:max-w-[836px] hover:shadow-sm ${
          step.side === "left" ? "" : "lg:order-1"
        }`}
      >
        <VisualCard index={index} />
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs tracking-wide uppercase text-white/80">
      <span className="inline-block h-2 w-2 rounded-full bg-[var(--gold-300)]" />
      {children}
    </div>
  );
}


function VisualCard({ index }: { index: number }) {
  // Card 0: APY-TVL Scatter/Heatmap for opportunity discovery
  if (index === 0) {
    return <OpportunityScatterCard />;
  }

  // Card 1: Risk Radar for risk analysis
  if (index === 1) {
    return <RiskRadarCard />;
  }

  // Card 2: Coverage Config Panel for insurance
  if (index === 2) {
    return <InsuranceCoverageCard />;
  }

  // Card 3: Withdraw Widget for self-custody
  if (index === 3) {
    return <WithdrawWidgetCard />;
  }

  // Default fallback
  return <DefaultVisualCard />;
}

function OpportunityScatterCard() {
  const topPools = [
    { name: "USDC–ETH 0.05%", chain: "Arbitrum", apy: "14.9%", tvlChange: "+$8.7M" },
    { name: "stETH–ETH 0.01%", chain: "Ethereum", apy: "7.1%", tvlChange: "+$2.2M" },
    { name: "USDT–USDC", chain: "Base", apy: "4.7%", tvlChange: "+$1.8M" },
  ];

  const pools = [
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
  ];

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 60% 40%, rgba(255,182,72,0.14) 0%, rgba(255,182,72,0.04) 35%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[var(--gold-300)]/10 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10 p-8 md:p-10 lg:p-12 h-full flex flex-col">
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
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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

        {/* Scatter Plot Container */}
        <div className="relative flex-1 min-h-[245px] overflow-hidden rounded-xl bg-gradient-to-b from-white/5 to-white/0 mb-4">
          {/* Grid lines */}
          <svg className="absolute inset-0 h-full w-full opacity-20">
            <defs>
              <pattern id="grid" width="38" height="28" patternUnits="userSpaceOnUse">
                <path d="M 38 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Scatter points */}
          <motion.svg
            className="absolute inset-0 h-full w-full"
            animate={{
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <defs>
              <radialGradient id="goldGradient">
                <stop offset="0%" stopColor="#FFB648" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#E0912C" stopOpacity="0.4" />
              </radialGradient>
            </defs>
            {pools.map((pool, i) => (
              <g key={i}>
                <circle
                  cx={`${pool.x}%`}
                  cy={`${100 - pool.y}%`}
                  r={pool.size}
                  fill="url(#goldGradient)"
                  opacity={pool.intensity}
                />
                {i % 2 === 0 && (
                  <circle
                    cx={`${pool.x}%`}
                    cy={`${100 - pool.y}%`}
                    r={pool.size + 2}
                    fill="none"
                    stroke="#FFB648"
                    strokeWidth="1"
                    opacity={pool.intensity * 0.2}
                  />
                )}
              </g>
            ))}
          </motion.svg>

          {/* Axis labels */}
          <div className="absolute bottom-2 left-2 text-[10px] text-white/40">TVL →</div>
          <div className="absolute top-2 left-2 text-[10px] text-white/40">← APY</div>
        </div>

        {/* Metrics - Single row */}
        <div className="flex items-center justify-center gap-1.5 text-center py-2">
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wide text-white/55">Trend</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">↑ Strong</span>
          </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wide text-white/55">Consistency</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">Low σ</span>
          </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wide text-white/55">Depth</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">$78M</span>
          </div>
        </div>
      </div>
    </>
  );
}

function RiskRadarCard() {
  const riskData = [
    { axis: "Volatility", value: 0.22, maxValue: 1 },
    { axis: "Liquidity", value: 0.68, maxValue: 1 },
    { axis: "Protocol Health", value: 0.18, maxValue: 1 },
    { axis: "Oracle Risk", value: 0.30, maxValue: 1 },
    { axis: "Code Maturity", value: 0.26, maxValue: 1 },
    { axis: "Centralization", value: 0.35, maxValue: 1 },
  ];

  const riskScore = 0.22; // Normalized risk score (lower is better)
  const riskLevel = riskScore < 0.3 ? "Low" : riskScore < 0.6 ? "Medium" : "High";
  const riskColor = riskScore < 0.3 ? "#FFB648" : riskScore < 0.6 ? "#FFA726" : "#FF6B6B";

  // Calculate positions for radar chart - 70% of card width
  const angleStep = (2 * Math.PI) / riskData.length;
  const containerWidth = 748; // 10% larger card inner width
  const centerX = containerWidth * 0.5;
  const centerY = 200;
  const maxRadius = containerWidth * 0.35; // 70% width / 2

  return (
    <>
      <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 60% 40%, rgba(255,182,72,0.14) 0%, rgba(255,182,72,0.04) 35%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[var(--gold-300)]/10 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10 p-8 md:p-10 lg:p-12 h-full flex flex-col">
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

        {/* Radar Chart Container - 90% width */}
        <div className="relative flex-1 min-h-[450px] overflow-hidden rounded-xl bg-gradient-to-b from-white/5 to-white/0">
          <svg
            viewBox={`0 0 ${containerWidth} 550`}
            className="absolute inset-0 h-full w-full"
            style={{ maxWidth: '95%', margin: '0 auto' }} // Much larger
          >
            {/* Grid circles */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => (
              <circle
                key={level}
                cx={centerX}
                cy={centerY}
                r={maxRadius * level}
                fill="none"
                stroke="rgba(255,255,255,0.20)"
                strokeWidth="2"
              />
            ))}

            {/* Axis lines */}
            {riskData.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x = centerX + Math.cos(angle) * maxRadius;
              const y = centerY + Math.sin(angle) * maxRadius;
              return (
                <line
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Data polygon */}
            <motion.polygon
              points={riskData
                .map((point, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const distance = (point.value / point.maxValue) * maxRadius;
                  const x = centerX + Math.cos(angle) * distance;
                  const y = centerY + Math.sin(angle) * distance;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="url(#riskGradient)"
              fillOpacity={0.3}
              stroke={riskColor}
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.55, ease: "easeInOut", delay: 0.15 }}
            />

            {/* Data points */}
            {riskData.map((point, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const distance = (point.value / point.maxValue) * maxRadius;
              const x = centerX + Math.cos(angle) * distance;
              const y = centerY + Math.sin(angle) * distance;
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="6"
                  fill={riskColor}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.55 }}
                />
              );
            })}

            {/* Labels */}
            {riskData.map((point, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const labelDistance = maxRadius + 60;
              const x = centerX + Math.cos(angle) * labelDistance;
              const y = centerY + Math.sin(angle) * labelDistance;
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[24px] font-medium fill-white/90"
                >
                  {point.axis}
                </text>
              );
            })}

            {/* Gradient definition */}
            <defs>
              <radialGradient id="riskGradient">
                <stop offset="0%" stopColor={riskColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor={riskColor} stopOpacity="0.1" />
              </radialGradient>
            </defs>
          </svg>

          {/* Risk Score Overlay - Single line at bottom */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div
              className="text-lg font-bold"
              style={{ color: riskColor }}
            >
              Risk Score: {riskScore.toFixed(2)} ({riskLevel})
            </div>
          </div>
        </div>

        {/* Metrics - Single row */}
        <div className="mt-6 flex items-center justify-center gap-6 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wide text-white/55">VaR(95%)</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">−2.1%</span>
          </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 flex items-center gap-1 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wide text-white/55">IL Sensitivity</span>
            <span className="text-sm font-semibold text-[var(--gold-300)]">Low</span>
          </div>
        </div>
      </div>
    </>
  );
}

function InsuranceCoverageCard() {
  const [coverage, setCoverage] = React.useState(60);
  const sliderRef = React.useRef<HTMLDivElement | null>(null);
  const isDraggingRef = React.useRef(false);
  const tickingRef = React.useRef(false);
  const latestXRef = React.useRef(0);

  // Helper: clamp a number into 0..100
  const clamp = (v: number) => Math.max(0, Math.min(100, v));



  const sliderRectRef = React.useRef<DOMRect | null>(null);

  const updateFromClientX = React.useCallback(
    (clientX: number) => {
      if (!sliderRectRef.current) return;
      const rect = sliderRectRef.current;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      const next = Math.round(clamp(pct));
      setCoverage(next);
    },
    []
  );

  // Drag lifecycle on window to allow smooth dragging outside the rail
  React.useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      latestXRef.current = e.clientX;
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        updateFromClientX(latestXRef.current);
        tickingRef.current = false;
      });
    };
    const handleUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // nothing on mount
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [updateFromClientX]);

  const onPointerDownRail = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    sliderRectRef.current = el.getBoundingClientRect();
    el.setPointerCapture?.(e.pointerId);
    isDraggingRef.current = true;
    updateFromClientX(e.clientX);

    const handleMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      latestXRef.current = ev.clientX;
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        updateFromClientX(latestXRef.current);
        tickingRef.current = false;
      });
    };
    const handleUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCoverage((c) => clamp(c - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setCoverage((c) => clamp(c + step));
    } else if (e.key === "Home") {
      setCoverage(0);
    } else if (e.key === "End") {
      setCoverage(100);
    }
  };
  const premium = (coverage * 0.02).toFixed(1); // 2% base premium rate

  const policyHash = "0x7f9a8b3c";
  const coveredRisks = [
    "Protocol Exploit",
    "Oracle Failure",
    "Governance Attack"
  ];

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 60% 40%, rgba(255,182,72,0.14) 0%, rgba(255,182,72,0.04) 35%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[var(--gold-300)]/10 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10 p-8 md:p-10 lg:p-12 h-full flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--gold-300)]/20 flex items-center justify-center">
              <span className="text-xs text-[var(--gold-300)]">✓</span>
            </div>
            <span className="text-sm text-white/60">Coverage Config</span>
          </div>
          <span className="rounded-full bg-[var(--gold-300)]/15 px-3 py-1 text-xs text-[var(--gold-300)]">
            configurable
          </span>
        </div>

        {/* Coverage Config Panel */}
        <div className="relative flex-1 rounded-xl bg-gradient-to-b from-white/5 to-white/0 p-6 mb-6">
          {/* Coverage Slider - Simple and Clean */}
          <div className="mb-7">
            <div className="flex justify-between text-sm text-white/80 mb-4">
              <span className="font-medium">Coverage Amount</span>
              <span className="text-[var(--gold-300)] font-bold text-lg">{coverage}%</span>
            </div>
            <div
              ref={sliderRef}
              className="relative h-2 bg-white/10 rounded-full mb-5 cursor-pointer select-none"
              onPointerDown={onPointerDownRail}
              onKeyDown={onKeyDown}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={coverage}
              tabIndex={0}
            >
              <div
                className="h-full bg-[var(--gold-300)]/80 rounded-full transition-none"
                style={{ width: `${coverage}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[var(--gold-300)] shadow-lg transition-none touch-none"
                style={{ left: `${coverage}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
          </div>

          {/* Premium Calculation */}
          <div className="flex justify-between items-center mb-6 p-3 rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-white/80">Monthly Premium</span>
            <span className="text-lg font-bold text-[var(--gold-300)]">{premium}%/mo</span>
          </div>

          {/* Covered Risks */}
          <div className="mb-6">
            <div className="text-xs text-white/60 mb-3">Covered risks:</div>
            <div className="space-y-2">
              {coveredRisks.map((risk, i) => (
                <motion.div
                  key={risk}
                  className="flex items-center gap-3 text-sm text-white/80"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  </span>
                  <span>{risk}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Policy Hash & Activate Button */}
          <div className="absolute bottom-2 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Policy:</span>
              <span className="text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded">
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

        {/* Metrics - Single row */}
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1.15 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[10.25px] uppercase tracking-wide text-white/55">Coverage</span>
            <span className="text-[13.5px] font-semibold text-[var(--gold-300)]">{coverage}%</span>
          </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1.15 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[10.25px] uppercase tracking-wide text-white/55">Premium</span>
                <span className="text-[13.5px] font-semibold text-[var(--gold-300)]">{premium}%/mo</span>
          </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1.15 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[10.25px] uppercase tracking-wide text-white/55">Claim Window</span>
            <span className="text-[13.5px] font-semibold text-[var(--gold-300)]">48h</span>
          </div>
        </div>
      </div>
    </>
  );
}

function WithdrawWidgetCard() {
  const [amount, setAmount] = React.useState("0.00");
  const [isHoveringWithdraw, setIsHoveringWithdraw] = React.useState(false);

  const handleMax = () => {
    setAmount("1,250.00");
  };

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 60% 40%, rgba(255,182,72,0.14) 0%, rgba(255,182,72,0.04) 35%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[var(--gold-300)]/10 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10 p-8 md:p-10 lg:p-12 h-full flex flex-col">
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
          {/* Amount Input - Ghost style */}
          <div className="mb-6">
            <div className="text-xs text-white/60 mb-2">Amount</div>
            <div className="relative bg-white/5/30 border border-white/10 rounded-lg p-3.5 hover:bg-white/5/50 transition-colors">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-white text-lg font-semibold outline-none placeholder-white/20 pr-16"
              />
              <motion.button
                onClick={handleMax}
                className="absolute right-3.5 top-1/4 px-3 py-1.5 text-xs font-medium text-[var(--gold-300)] bg-[var(--gold-300)]/10 rounded-md border border-[var(--gold-300)]/30 hover:bg-[var(--gold-300)]/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                MAX
              </motion.button>
            </div>
            <div className="text-xs text-white/60 mt-1">USDC Available</div>
          </div>

          {/* Route Visualization */}
          <div className="mb-6 p-3.5 rounded-lg bg-white/5/30 border border-white/10">
            {/* ETA/Fee */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <motion.div
                className="flex items-center gap-1.5 text-sm text-white/80"
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span>⏱</span>
                <span>~12s</span>
              </motion.div>
              <div className="w-px h-4 bg-white/20" />
              <motion.div
                className="flex items-center gap-1.5 text-sm text-white/80"
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <span>⚡</span>
                <span>$0.03</span>
              </motion.div>
            </div>

            {/* Route Flow */}
            <div className="flex items-center justify-center gap-2 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white/30 rounded-full" />
                <span>Wallet</span>
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-lg"
              >
                →
              </motion.div>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[var(--gold-300)]/50 rounded-full" />
                <span>Vault</span>
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.75
                }}
                className="text-lg"
              >
                →
              </motion.div>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white/30 rounded-full" />
                <span>Wallet</span>
              </span>
            </div>
          </div>

          {/* Withdraw Button - Prominent */}
          <motion.button
            className="w-full py-3 bg-gradient-to-r from-[var(--gold-300)]/80 to-[var(--gold-300)]/60 text-black font-bold text-sm rounded-lg hover:from-[var(--gold-300)] hover:to-[var(--gold-300)]/80 transition-all shadow-lg"
            style={{
              transform: isHoveringWithdraw ? "perspective(1000px) rotateX(5deg) rotateY(-5deg)" : "perspective(1000px) rotateX(0deg) rotateY(0deg)",
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
            onHoverStart={() => setIsHoveringWithdraw(true)}
            onHoverEnd={() => setIsHoveringWithdraw(false)}
            whileTap={{ scale: 0.98 }}
          >
            Withdraw
          </motion.button>
        </div>

        {/* Metrics - Single row */}
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
    </>
  );
}

function DefaultVisualCard() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 60% 40%, rgba(255,182,72,0.14) 0%, rgba(255,182,72,0.04) 35%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[var(--gold-300)]/10 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10 p-10 md:p-12">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-white/60">Live metrics</span>
          <span className="rounded-full bg-[var(--gold-300)]/15 px-3 py-1 text-xs text-[var(--gold-300)]">
            realtime
          </span>
        </div>
        <div className="relative h-40 overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-white/0">
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10" />
          <svg
            viewBox="0 0 300 120"
            className="absolute inset-0 h-full w-full opacity-80"
          >
            <defs>
              <linearGradient id="howit-graph" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFB648" />
                <stop offset="100%" stopColor="#E0912C" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="url(#howit-graph)"
              strokeWidth="3"
              points="0,90 30,85 60,70 90,80 120,55 150,65 180,40 210,50 240,30 270,42 300,28"
            />
          </svg>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-6 text-center md:grid-cols-3 sm:grid-cols-2 xs:grid-cols-1">
          {[
            { k: "APR", v: "12.4%" },
            { k: "Risk", v: "Low" },
            { k: "TVL", v: "$78M" },
          ].map((metric) => (
            <div
              key={metric.k}
              className="rounded-lg border border-white/10 bg-white/5 py-3"
            >
              <div className="text-[10px] uppercase tracking-wider text-white/50">
                {metric.k}
              </div>
              <div className="text-[16px] font-semibold text-white">{metric.v}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
