"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/ui";

interface HeroStatsProps {
  className?: string;
}

const stats = [
  {
    label: "TVL on Stellar",
    value: "$172M",
    description: "Total value integrated and monitored by RESET on Stellar.",
    wobble: -1.05,
  },
  {
    label: "Stellar Yield TVL",
    value: "~$400M",
    description:
      "Aggregate TVL across yield sources available through RESET.*",
    wobble: 1.15,
  },
  {
    label: "Average Settlement Time (Stellar)",
    value: "5.3s",
    description: "Average time for transaction finality on Stellar.",
    wobble: -0.85,
  },
  {
    label: "Cost Per Transaction",
    value: "$0.0006",
    description: "Approximate average fee per on-chain Stellar transaction.",
    wobble: 1.05,
  },
];

const cardVariants: Variants = {
  rest: { scale: 1, rotateZ: 0, y: 0 },
  hover: (wobble: number) => ({
    scale: 1.03,
    rotateZ: wobble,
    y: -2,
    transition: { type: "spring", stiffness: 260, damping: 18 },
  }),
  tap: { scale: 0.98 },
};

const innerVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -4,
    transition: { type: "spring", stiffness: 320, damping: 16, delay: 0.03 },
  },
};

export function HeroStats({ className }: HeroStatsProps) {
  return (
    <div
      className={cn(
        "mt-8 w-full",
        "grid gap-6 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          className="group relative flex min-h-[136px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[rgba(255,182,72,0.16)] bg-[linear-gradient(180deg,#1A1B1E_0%,#121214_100%)] p-6 text-left shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          custom={stat.wobble}
        >
          <motion.div
            variants={innerVariants}
            className="relative z-10 flex flex-1 flex-col gap-4"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[rgba(216,217,222,0.8)]">
              {stat.label}
            </span>
            <div className="space-y-2">
              <span
                className="block font-black text-[clamp(32px,3.4vw,44px)] leading-none text-white"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.35)" }}
              >
                {stat.value}
              </span>
              <span className="inline-flex h-[3px] w-10 rounded-full bg-[#E0912C]" />
            </div>
            <p className="text-[13px] leading-relaxed text-[#D8D9DE]">
              {stat.description}
            </p>
          </motion.div>
          <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-white/0 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]" />
          <div className="pointer-events-none absolute inset-x-4 bottom-0 h-20 rounded-[16px] bg-gradient-to-b from-transparent via-transparent to-[rgba(224,145,44,0.08)] blur-[6px]" />
        </motion.div>
      ))}
    </div>
  );
}
