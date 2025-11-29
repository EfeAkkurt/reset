"use client";

import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

interface LiquidCardProps {
  children: React.ReactNode;
  className?: string;
}

export function LiquidCard({ children, className = "" }: LiquidCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position relative to card center (normalized -1 to 1)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth physics for tilt
  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

  // Tilt transforms
  const rotateX = useMotionTemplate`${mouseY}deg`;
  const rotateY = useMotionTemplate`${mouseX}deg`;

  // Glow gradient position
  const glowX = useSpring(0, { stiffness: 200, damping: 30 });
  const glowY = useSpring(0, { stiffness: 200, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate normalized position (-1 to 1)
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    const xPct = clientX / width - 0.5;
    const yPct = clientY / height - 0.5;

    // Update tilt target (max 15 degrees)
    x.set(xPct * 20);
    y.set(yPct * -20);

    // Update glow position (pixels)
    glowX.set(clientX);
    glowY.set(clientY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
      }}
      className={`relative group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 ${className}`}
    >
      {/* Liquid Border Gradient */}
      <motion.div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${glowX}px ${glowY}px,
              rgba(214, 167, 92, 0.4),
              transparent 40%
            )
          `,
          zIndex: 0,
        }}
      />

      {/* Internal Glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              800px circle at ${glowX}px ${glowY}px,
              rgba(255, 255, 255, 0.05),
              transparent 40%
            )
          `,
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full w-full rounded-2xl bg-[#050505]/80 p-6 backdrop-blur-md">
        {children}
      </div>
    </motion.div>
  );
}
