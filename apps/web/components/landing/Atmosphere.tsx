"use client";

import React from "react";

export default function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          transform: "scale(1.5)",
        }}
      />

      {/* Heavy Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.9) 100%)",
        }}
      />
      
      {/* Cinematic Lighting - Subtle top glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] bg-[var(--gold-300)]/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none"
      />
    </div>
  );
}
