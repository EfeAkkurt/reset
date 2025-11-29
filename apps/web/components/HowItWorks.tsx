"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import the 3D scene to avoid SSR issues with R3F
const KineticScene = dynamic(() => import("./howitworks/KineticScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
});



export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section 
      id="how-it-works-section" 
      ref={containerRef} 
      className="relative w-full bg-black"
      style={{ height: "400vh" }} // 4 stages * 100vh
    >
      {/* Fixed 3D Background */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <KineticScene />
      </div>

      {/* Scrollable Text Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Stage 1: Scanner */}
        <div className="h-screen w-full flex items-center justify-start px-8 md:px-24">
          <div className="max-w-xl">
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tighter" style={{ fontFamily: "var(--font-syne)" }}>
              SPOT THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--gold-300)] to-white">SIGNALS</span>
            </h2>
            <p className="text-xl text-white/60 leading-relaxed backdrop-blur-md bg-black/30 p-6 rounded-2xl border border-white/10">
              Our parabolic scanners ingest millions of data points across 12 chains in real-time. We don't just read the market; we visualize the velocity of money.
            </p>
          </div>
        </div>

        {/* Stage 2: Radar */}
        <div className="h-screen w-full flex items-center justify-end px-8 md:px-24">
          <div className="max-w-xl text-right">
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tighter" style={{ fontFamily: "var(--font-syne)" }}>
              DECODE THE <br />
              <span className="text-red-500">RISK</span>
            </h2>
            <p className="text-xl text-white/60 leading-relaxed backdrop-blur-md bg-black/30 p-6 rounded-2xl border border-white/10">
              The Analytical Core filters noise from signal. High-risk pools are flagged red. Safe yields turn green. Only the mathematically proven survive the filter.
            </p>
          </div>
        </div>

        {/* Stage 3: Vault */}
        <div className="h-screen w-full flex items-center justify-start px-8 md:px-24">
          <div className="max-w-xl">
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tighter" style={{ fontFamily: "var(--font-syne)" }}>
              SHIELD YOUR <br />
              <span className="text-white">YIELD</span>
            </h2>
            <p className="text-xl text-white/60 leading-relaxed backdrop-blur-md bg-black/30 p-6 rounded-2xl border border-white/10">
              Verified positions are encased in our Armored Vault smart contracts. Automated insurance policies attach instantly, creating an impenetrable barrier against volatility.
            </p>
          </div>
        </div>

        {/* Stage 4: Wallet */}
        <div className="h-screen w-full flex items-center justify-center px-8 md:px-24">
          <div className="max-w-2xl text-center">
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tighter" style={{ fontFamily: "var(--font-syne)" }}>
              EARN. WITHDRAW. <br />
              <span className="text-[var(--gold-300)]">REPEAT.</span>
            </h2>
            <p className="text-xl text-white/60 leading-relaxed backdrop-blur-md bg-black/30 p-6 rounded-2xl border border-white/10 mb-8">
              The vault unlocks directly into your liquid wallet. No lockups. No hidden fees. Just pure, protected yield delivered to your dashboard.
            </p>
            <button className="pointer-events-auto px-8 py-4 bg-[var(--gold-300)] text-black font-bold text-lg rounded-full hover:scale-105 transition-transform">
              Start Earning Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
