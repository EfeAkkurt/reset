"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  title: string;
  subtitle?: string;
  size?: "compact" | "standard" | "large";
  ctaText?: string;
  onCta?: () => void;
  className?: string;
  children?: React.ReactNode;
  pills?: React.ReactNode;
  kpis?: React.ReactNode;
};

const sizeToMinH: Record<NonNullable<Props["size"]>, string> = {
  compact: "min-h-[10vh]",
  standard: "min-h-[16vh]",
  large: "min-h-[20vh]",
};

export function HeroHeader({
  title,
  subtitle,
  size = "standard",
  ctaText,
  onCta,
  className,
  children,
  pills,
  kpis,
}: Props) {
  const reduceMotion = useReducedMotion();

  const containerClasses = [
    "relative isolate overflow-hidden bg-[#0A0A0A]",
    sizeToMinH[size],
    "flex items-center",
    "text-center",
    "py-10 sm:py-12",
    className ?? "",
  ].join(" ");
  const gridBackground = {
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
    backgroundSize: "28px 28px",
  };

  const titleAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35 },
      };

  const subtitleAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, delay: 0.05 },
      };

  const ctaAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, delay: 0.1 },
      };

  return (
    <section className={containerClasses}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
      >
        <div
          className="absolute inset-0"
          style={gridBackground}
        />
        <div
          className="absolute left-1/2 top-[35%] h-[680px] w-[680px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{
            background:
              "radial-gradient(circle, rgba(240,145,44,0.06) 0%, rgba(240,145,44,0) 65%)",
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
      </div>
      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          <motion.h1
            className="font-display text-3xl mb-16 tracking-tight text-white sm:text-4xl md:text-5xl"
            {...titleAnim}
          >
            {title}
          </motion.h1>
          {subtitle ? (
            <motion.p
              className="mt-3 text-base text-neutral-200 sm:text-lg"
              {...subtitleAnim}
            >
              {subtitle}
            </motion.p>
          ) : null}
          {ctaText ? (
            <motion.div className="mt-2" {...ctaAnim}>
              <button
                type="button"
                onClick={onCta}
                className={[
                  "inline-flex items-center justify-center",
                  "rounded-full px-5 py-2.5",
                  "bg-white/10 text-white backdrop-blur",
                  "ring-1 ring-white/30 hover:bg-white/15",
                  "transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900",
                ].join(" ")}
                aria-label={ctaText}
              >
                {ctaText}
              </button>
            </motion.div>
          ) : null}
        </div>

        {/* Chain filter pills */}
        {(pills || children) && (
          <motion.div
            className="relative z-10 w-full mt-1"
            initial={reduceMotion ? {} : { opacity: 0, y: 4 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? {}
                : { duration: 0.3, ease: "easeOut", delay: 0.15 }
            }
          >
            {pills || children}
          </motion.div>
        )}

        {/* KPI Bar */}
        {kpis && (
          <motion.div
            className="relative z-10 w-full mt-8"
            initial={reduceMotion ? {} : { opacity: 0, y: 6 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={
              reduceMotion ? {} : { duration: 0.3, ease: "easeOut", delay: 0.2 }
            }
          >
            {kpis}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default HeroHeader;
