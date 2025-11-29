"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface TabletShowcaseProps {
  progress: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const triBlend = (p: number, start: number, middle: number, end: number) => {
  if (p <= 0) return start;
  if (p >= 1) return end;
  if (p < 0.5) {
    const local = p / 0.5;
    return lerp(start, middle, local);
  }
  const local = (p - 0.5) / 0.5;
  return lerp(middle, end, local);
};

export function TabletShowcase({ progress }: TabletShowcaseProps) {
  const normalized = clamp01((progress - 0.04) / 0.9);
  const translateY = triBlend(normalized, -10, -562.1995, 0);
  const scale = triBlend(normalized, 0.8, 0.922251, 1);
  const rotateX = triBlend(normalized, 30, 11.6624, 0);
  const opacity = triBlend(normalized, 0.6, 0.85, 1);

  return (
    <div className="relative flex w-full justify-center">
      <motion.div
        style={{
          y: translateY,
          scale,
          rotateX,
          opacity,
          perspective: 1200,
        }}
        transition={{ ease: [0.25, 0.1, 0.25, 1], duration: 0.8 }}
        className="relative w-full max-w-[1200px] will-change-transform"
      >
        <div className="relative aspect-[1.38696] w-full overflow-hidden rounded-[32px] border border-white/20 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <Image
            src="/backgrounds/tablet.svg"
            alt="Reset Opportunities Tablet"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="pointer-events-none absolute inset-x-12 -bottom-10 h-8 rounded-full bg-black/60 blur-[40px]" />
      </motion.div>
    </div>
  );
}
