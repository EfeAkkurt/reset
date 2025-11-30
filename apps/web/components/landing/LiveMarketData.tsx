"use client";

import React from "react";
import NumberBadge from "../NumberBadge";



export function LiveMarketData({ progress = 0 }: { progress?: number }) {

  return (
    <div className="relative h-full w-full">
      {/* Background Grid - Technical Look */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Live Metrics Grid (Bottom) */}
      <div className="absolute bottom-12 left-0 right-0 px-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <NumberBadge value={25} suffix="M" progress={progress} />
            <p className="mt-2 text-xs uppercase tracking-[0.01em]r text-white/40">Principal Protected</p>
          </div>
          <div>
            <NumberBadge value={300} suffix="+" delay={120} progress={progress} />
            <p className="mt-2 text-xs uppercase tracking-[0.01em]r text-white/40">Daily Scans</p>
          </div>
          <div>
            <NumberBadge value={99.9} suffix="%" decimals={1} delay={220} progress={progress} />
            <p className="mt-2 text-xs uppercase tracking-[0.01em]r text-white/40">Uptime</p>
          </div>
          <div>
            <NumberBadge value={12} delay={320} progress={progress} />
            <p className="mt-2 text-xs uppercase tracking-[0.01em]r text-white/40">Chains</p>
          </div>
        </div>
      </div>
    </div>
  );
}
