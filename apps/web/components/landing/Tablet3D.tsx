"use client";

import React from "react";
import { motion } from "framer-motion";

export function Tablet3D() {
  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-[2000px]">
      <motion.div
        className="relative w-[600px] h-[400px] bg-black rounded-[32px] border-[8px] border-[#1a1a1a] shadow-2xl overflow-hidden"
        style={{
          transformStyle: "preserve-3d",
          rotateX: 20,
          rotateY: -10,
          boxShadow: "0 50px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
        animate={{
          y: [-15, 15, -15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Screen Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--gold-300)]/5 to-transparent pointer-events-none z-20" />
        
        {/* Glass Reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-30 mix-blend-overlay" />

        {/* Scrolling Content */}
        <div className="absolute inset-0 overflow-hidden bg-[#050505]">
          <motion.div
            className="w-full"
            animate={{
              y: ["0%", "-50%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Double the content for seamless loop */}
            <div className="p-6 space-y-4">
              <DashboardContent />
            </div>
            <div className="p-6 space-y-4">
              <DashboardContent />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardContent() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-white/10 rounded-full" />
          <div className="h-8 w-8 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-32 bg-white/5 rounded-xl border border-white/5 p-4">
          <div className="h-4 w-20 bg-white/10 rounded mb-2" />
          <div className="h-8 w-24 bg-[var(--gold-300)]/20 rounded mb-4" />
          <div className="h-12 w-full bg-gradient-to-t from-[var(--gold-300)]/10 to-transparent rounded-b-lg" />
        </div>
        <div className="h-32 bg-white/5 rounded-xl border border-white/5 p-4">
          <div className="h-4 w-20 bg-white/10 rounded mb-2" />
          <div className="h-8 w-24 bg-green-500/20 rounded mb-4" />
          <div className="h-12 w-full bg-gradient-to-t from-green-500/10 to-transparent rounded-b-lg" />
        </div>
      </div>

      {/* List Items */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white/10 rounded-full" />
              <div>
                <div className="h-3 w-24 bg-white/10 rounded mb-1" />
                <div className="h-2 w-16 bg-white/5 rounded" />
              </div>
            </div>
            <div className="h-6 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}
