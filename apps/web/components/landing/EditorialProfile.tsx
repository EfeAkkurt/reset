"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export function EditorialProfile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className="relative w-full max-w-6xl mx-auto min-h-[600px] flex flex-col md:flex-row items-center gap-12 md:gap-24">
      {/* Parallax Image Container */}
      <div className="relative w-full md:w-1/2 aspect-[3/4] overflow-hidden rounded-sm">
        <motion.div style={{ y }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
          <Image
            src="/efe.png"
            alt="Efe Akkurt"
            fill
            className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
          />
        </motion.div>
        
        {/* Overlay Texture */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 border-[12px] border-white/5 pointer-events-none" />
      </div>

      {/* Editorial Content */}
      <div className="w-full md:w-1/2 flex flex-col items-start">
        <motion.div style={{ opacity }} className="space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-6xl md:text-8xl font-bold tracking-tighter text-white leading-[0.8]">
              THE<br />ARCHITECT
            </h2>
            <div className="h-1 w-24 bg-[var(--gold-300)]" />
          </div>

          <p className="text-xl md:text-2xl font-light leading-relaxed text-white/80 max-w-md">
            "We are not just building a protocol. We are building the <span className="text-[var(--gold-300)] italic">standard</span> for on-chain reliability."
          </p>

          <div className="space-y-4 pt-8">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white/40">Connect</h3>
            <div className="flex gap-6">
              <SocialLink href="https://x.com/EfeAkkurtOFF" label="Twitter / X" />
              <SocialLink href="https://www.instagram.com/efeakkurtofficial" label="Instagram" />
              <SocialLink href="https://discord.com/users/404332976868950026" label="Discord" />
            </div>
          </div>

          {/* Animated Signature */}
          <div className="pt-12">
            <svg width="200" height="60" viewBox="0 0 200 60" className="opacity-80">
              <motion.path
                d="M10,50 Q30,5 50,30 T90,30 T130,20 T180,40"
                fill="none"
                stroke="white"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              <text x="10" y="55" fontFamily="serif" fontSize="14" fill="white" opacity="0.5">Efe Akkurt</text>
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative text-sm text-white/60 hover:text-white transition-colors"
    >
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-px bg-[var(--gold-300)] transition-all duration-300 group-hover:w-full" />
    </a>
  );
}
