"use client";
import React, { useRef, useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import InsetBackgroundFx from "../sections/_fx/InsetBackgroundFx";
import { LiveMarketData } from "./LiveMarketData";

export function Market({ progress = 0 }: { progress?: number }) {
  const prefersReducedMotion = useReducedMotion();

  // Subtle parallax for background fog; disabled on PRM
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setParallax({ x: e.clientX - cx, y: e.clientY - cy });
    },
    [prefersReducedMotion],
  );
  const onMouseLeave = useCallback(() => {
    if (prefersReducedMotion) return;
    setParallax({ x: 0, y: 0 });
  }, [prefersReducedMotion]);

  // ScrollOrchestrator renders scenes in a fixed stack, so IntersectionObserver never fires.
  // Instead, derive the reveal animation directly from the orchestrator's progress to avoid extra observers.
  const reveal = useMemo(() => {
    if (prefersReducedMotion) return 1;
    // use local progress directly to avoid animation stalls if observers fail
    return Math.min(1, Math.max(0, progress));
  }, [prefersReducedMotion, progress]);
  const revealY = prefersReducedMotion ? 0 : (1 - reveal) * 18;

  return (
    <section className="h-full relative">
      <div className="relative z-10 mx-auto flex h-full max-w-8xl items-center px-6">
        <div
          className="w-full"
          style={{
            transform: `translateY(${(1 - progress) * 20}px)`,
            transition: "transform 120ms linear",
          }}
        >
          <motion.div
            ref={(node: HTMLDivElement | null) => {
              wrapRef.current = node;
            }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className={[
              "relative overflow-hidden",
              "rounded-[36px] md:rounded-[44px] ring-1 ring-white/10",
              "bg-[radial-gradient(1800px_1000px_at_25%_75%,rgba(255,182,72,0.03),transparent),linear-gradient(180deg,#000000,#000000,#000000)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_40px_80px_rgba(0,0,0,.35)]",
              "will-change-transform",
            ].join(" ")}
            initial={false}
            animate={
              prefersReducedMotion ? undefined : { opacity: reveal, y: revealY }
            }
            style={prefersReducedMotion ? { opacity: 1 } : undefined}
            transition={{
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
          >
            <InsetBackgroundFx
              parallax={parallax}
              reduceMotion={!!prefersReducedMotion}
              className={!prefersReducedMotion ? "inset-sweep" : undefined}
            />

            {/* Grid container inside the rounded card */}
            <div className="relative h-[600px] w-full overflow-hidden">
              <div className="relative z-10 h-full w-full">
                <div className="absolute left-0 top-0 z-20 p-8 md:p-10 lg:p-12">
                  <h2 className="font-black tracking-[0.01em] leading-[0.95] text-white"
                      style={{ fontSize: 'clamp(3rem,9vw,6rem)' }}>
                    NUMBERS<br/>DON'T LIE
                  </h2>
                  <p className="mt-6 max-w-[400px] text-base text-white/65 md:text-lg">
                    With Reset, yield isn't guesswork. We surface real signals, quantify risk, and protect
                    principal — so performance becomes repeatable.
                  </p>
                </div>
                
                {/* Live Data Visualization */}
                <div className="absolute inset-0 z-10">
                   <LiveMarketData />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
