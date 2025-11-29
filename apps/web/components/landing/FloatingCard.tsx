"use client";

import React from "react";
import { motion } from "framer-motion";

interface FloatingCardProps {
  title: string;
  subtitle: string;
  className?: string;
  delay?: number;
}

export function FloatingCard({ title, subtitle, className = "", delay = 0 }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={`absolute p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl ${className}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-2 w-2 rounded-full bg-[var(--gold-300)] shadow-[0_0_10px_var(--gold-300)]" />
        <h3 className="text-sm font-medium tracking-widest uppercase text-white/60">{title}</h3>
      </div>
      <p className="text-xl font-semibold text-white leading-tight">
        {subtitle.split(" ").map((word, i) => (
          <span key={i} className={word === "Opportunities" ? "text-[var(--gold-300)] mix-blend-overlay" : ""}>
            {word}{" "}
          </span>
        ))}
      </p>
    </motion.div>
  );
}
