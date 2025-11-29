"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Tablet3D } from "./Tablet3D";
import { FloatingCard } from "./FloatingCard";



// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function KineticHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Massive Typography Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <h1 
          className="text-[18vw] font-bold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/10 to-transparent"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          reset
        </h1>
      </div>

      {/* Main Content Grid */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-[1600px] h-[80vh] grid grid-cols-12 grid-rows-6 gap-4 p-8"
      >
        {/* Tablet Centerpiece */}
        <div className="col-span-12 row-span-6 md:col-span-6 md:col-start-4 md:row-span-4 md:row-start-2 flex items-center justify-center">
          <Tablet3D />
        </div>

        {/* Floating Cards - Constellation Layout */}
        <div className="col-span-12 md:col-span-12 row-span-6 pointer-events-none">
          {/* Top Left */}
          <FloatingCard 
            title="Risk Analysis"
            subtitle="Decode volatility before it strikes."
            className="top-[10%] left-[5%] md:left-[15%] max-w-[280px]"
            delay={0.2}
          />

          {/* Middle Right */}
          <FloatingCard 
            title="Insure Positions"
            subtitle="On-chain protection, automated."
            className="top-[45%] right-[5%] md:right-[12%] max-w-[280px]"
            delay={0.4}
          />

          {/* Bottom Left */}
          <FloatingCard 
            title="Yield Aggregation"
            subtitle="Enjoy Opportunities across chains."
            className="bottom-[15%] left-[8%] md:left-[18%] max-w-[300px]"
            delay={0.6}
          />
        </div>
      </motion.div>
    </section>
  );
}
