"use client";

import React from "react";
import Head from "next/head";
import { ScrollOrchestrator } from "@/components/ScrollOrchestrator";
import Hero from "@/components/landing/Hero";
import NavigationButtons from "@/components/landing/NavigationButtons";
import WhyUsInset from "@/components/sections/WhyUsInset";
import { Market } from "@/components/landing/Market";
import { CharacterCards } from "@/components/landing/CharacterCards";
import US from "@/components/landing/US";
import HowItWorks from "@/components/HowItWorks";
import EndCapFooter from "@/components/EndCapFooter";
import BackgroundSystem from "@/components/landing/BackgroundSystem";
import Script from "next/script";


export default function Landing() {
  return (
    <>
      <Head>
        <title>Reset - Institutional Yield Aggregator</title>
        <meta
          name="description"
          content="Production-grade yield tooling across multiple chains. Built with security, transparency and user control at the forefront."
        />
        <meta
          property="og:title"
          content="Reset - Institutional Yield Aggregator"
        />
        <meta
          property="og:description"
          content="Production-grade yield tooling across multiple chains. Built with security, transparency and user control at the forefront."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Reset - Institutional Yield Aggregator"
        />
        <meta
          name="twitter:description"
          content="Production-grade yield tooling across multiple chains. Built with security, transparency and user control at the forefront."
        />

        {/* put this in the <head> */}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </Head>
      <div className="relative bg-[var(--bg-deep)]">
        {/* Background System - now provides all background effects */}
        <BackgroundSystem />

        {/* Navigation buttons overlay */}
        <NavigationButtons />
        <div className="relative z-10">
          <ScrollOrchestrator
            heightPerSceneVh={300}
            tailVh={0}
            scenes={[
              {
                id: "hero",
                start: 0.0,
                end: 0.10,
                theme: "dark",
                bg: "transparent",
                render: (progress) => (
                  <div className="relative h-full w-full">
                    {/* Beams animasyonu kaldırıldı */}
                    <div className="relative z-10">
                      <Hero progress={progress} />
                    </div>
                  </div>
                ),
              },
              {
                id: "howitworks",
                start: 0.10,
                end: 0.65,
                theme: "dark",
                bg: "transparent",
                render: (p) => <HowItWorks progress={p} />,
              },
              {
                id: "whyus",
                start: 0.65,
                end: 0.75,
                theme: "dark",
                bg: "transparent",
                render: () => (
                  <div className="mx-auto flex h-full items-center px-4 sm:px-6 lg:px-8">
                    <WhyUsInset />
                  </div>
                ),
              },
              {
                id: "market",
                start: 0.75,
                end: 0.90,
                theme: "dark",
                bg: "transparent",
                render: (p) => <Market progress={p} />,
              },
              {
                id: "cards",
                start: 0.90,
                end: 1,
                theme: "dark",
                bg: "transparent",
                render: (p) => <CharacterCards progress={p} />,
              },
            ]}
          />
          {/* Single minimalist end-cap footer */}
          <EndCapFooter />
        </div>
      </div>
    </>
  );
}