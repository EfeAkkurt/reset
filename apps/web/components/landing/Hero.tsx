"use client";

import React from "react";
import { motion } from "framer-motion";
import { TabletShowcase } from "./TabletShowcase";
import ResetTitle from "./ResetTitle";
import { HeroStats } from "./HeroStats";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

interface HeroProps {
  progress?: number;
}

export default function Hero({ progress = 0 }: HeroProps) {
  // Parallax / Scroll effects
  // We can use the passed 'progress' or internal scroll hooks if needed.
  // Since the parent orchestrates scroll, we'll use 'progress' for the 3D tilt and other scroll-linked effects.

  // Scroll-driven fade effects for hero elements
  const easedVisibility = clamp01((progress - 0.22) / 0.78);
  const textOpacity = 1 - easedVisibility * 0.05;
  const yOffset = easedVisibility * 5;

  const heroLines = [
    { pre: "Do the ", highlight: "Risk Analysis", post: "" },
    { pre: "Insure your positions", highlight: "", post: "" },
    { pre: "Enjoy the ", highlight: "Opportunities", post: "" },
  ];
  const heroSecondaryLines = [
    { pre: "", highlight: "Reset", post: " your mind" },
    { pre: "", highlight: "Reset", post: " risks" },
    { pre: "", highlight: "Reset", post: " lost money" },
  ];
  const lineAnimationDuration = 1.25;
  const lineInterval = 2;
  const lineRepeatDelay = heroLines.length * lineInterval - lineAnimationDuration;
  return (
    <section className="relative h-screen w-full overflow-hidden text-white">
      {/* Hero section now uses the BackgroundSystem for all background effects */}

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-24 md:px-10">
        <motion.div
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0f0f15]/90 via-[#050505]/92 to-[#000000]/95 p-8 shadow-[0_40px_140px_rgba(0,0,0,0.85)] backdrop-blur-3xl md:p-14"
          style={{ opacity: textOpacity, y: yOffset }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#d6a75c]/12 blur-[160px]" />
            <div className="absolute right-16 top-10 h-72 w-72 rounded-full bg-[#f1c477]/10 blur-[160px]" />
          </div>
          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-7.5 text-center">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <ResetTitle glow />
            </motion.div>
            <div className="relative w-full">
              <div className="gap-12 md:grid md:grid-cols-2 md:items-start">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.2,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.3,
                  }}
                  className="relative overflow-hidden rounded-2xl bg-transparent pl-8 pr-6 pt-8"
                >
                  <div className="w-full space-y-1 text-left">
                    {heroLines.map((line, index) => (
                      <div key={index} className="overflow-hidden">
                        <div className="flex items-center gap-3">
                          <motion.span
                            className="hero-line-marker"
                            animate={{
                              scaleX: [0, 1, 1, 0],
                              boxShadow: [
                                "0 0 0 rgba(224,145,44,0.0)",
                                "0 0 10px rgba(224,145,44,0.45)",
                                "0 0 10px rgba(224,145,44,0.45)",
                                "0 0 0 rgba(224,145,44,0.0)",
                              ],
                            }}
                            transition={{
                              duration: lineAnimationDuration,
                              delay: index * lineInterval,
                              repeat: Infinity,
                              repeatDelay: lineRepeatDelay,
                              ease: [0.45, 0, 0.55, 1],
                            }}
                          />
                          <motion.p
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                              delay: 0.35 + index * 0.2,
                              duration: 0.8,
                              ease: "easeOut",
                            }}
                            className="hero-line"
                          >
                            <span>{line.pre}</span>
                            {line.highlight ? (
                              <motion.span
                                className="gold hero-highlight"
                                animate={{
                                  textShadow: [
                                    "0 0 0 rgba(224,145,44,0)",
                                    "0 0 12px rgba(224,145,44,0.45)",
                                    "0 0 12px rgba(224,145,44,0.45)",
                                    "0 0 0 rgba(224,145,44,0)",
                                  ],
                                  color: [
                                    "var(--gold-500)",
                                    "#FFD28A",
                                    "#FFD28A",
                                    "var(--gold-500)",
                                  ],
                                }}
                                transition={{
                                  duration: lineAnimationDuration,
                                  delay: index * lineInterval,
                                  repeat: Infinity,
                                  repeatDelay: lineRepeatDelay,
                                  ease: [0.45, 0, 0.55, 1],
                                }}
                              >
                                {line.highlight}
                              </motion.span>
                            ) : null}
                            <span>{line.post}</span>
                          </motion.p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 1.2,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.45,
                  }}
                  className="relative mt-8 overflow-hidden rounded-2xl bg-transparent pl-8 pr-6 pt-8 md:mt-0"
                >
                  <div className="w-full space-y-1 text-left">
                    {heroSecondaryLines.map((line, index) => (
                      <div key={line.post} className="overflow-hidden">
                        <div className="flex items-center gap-3">
                          <motion.span
                            className="hero-line-marker"
                            animate={{
                              scaleX: [0, 1, 1, 0],
                              boxShadow: [
                                "0 0 0 rgba(224,145,44,0.0)",
                                "0 0 10px rgba(224,145,44,0.45)",
                                "0 0 10px rgba(224,145,44,0.45)",
                                "0 0 0 rgba(224,145,44,0.0)",
                              ],
                            }}
                            transition={{
                              duration: lineAnimationDuration,
                              delay: index * lineInterval,
                              repeat: Infinity,
                              repeatDelay: lineRepeatDelay,
                              ease: [0.45, 0, 0.55, 1],
                            }}
                          />
                          <motion.p
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                              delay: 0.55 + index * 0.18,
                              duration: 0.8,
                              ease: "easeOut",
                            }}
                            className="hero-line"
                          >
                            <span>{line.pre}</span>
                            {line.highlight ? (
                              <motion.span
                                className="gold hero-highlight"
                                animate={{
                                  textShadow: [
                                    "0 0 0 rgba(224,145,44,0)",
                                    "0 0 12px rgba(224,145,44,0.45)",
                                    "0 0 12px rgba(224,145,44,0.45)",
                                    "0 0 0 rgba(224,145,44,0)",
                                  ],
                                  color: [
                                    "var(--gold-500)",
                                    "#FFD28A",
                                    "#FFD28A",
                                    "var(--gold-500)",
                                  ],
                                }}
                                transition={{
                                  duration: lineAnimationDuration,
                                  delay: index * lineInterval,
                                  repeat: Infinity,
                                  repeatDelay: lineRepeatDelay,
                                  ease: [0.45, 0, 0.55, 1],
                                }}
                              >
                                {line.highlight}
                              </motion.span>
                            ) : null}
                            <span>{line.post}</span>
                          </motion.p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
              <HeroStats />
            </div>
          </div>
          <div className="relative mt-20">
            <TabletShowcase progress={progress} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
