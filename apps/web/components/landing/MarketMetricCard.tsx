"use client";
import React from "react";

type MarketMetricCardProps = {
  primaryText: string;
  secondaryText: string;
  className?: string;
};

export function MarketMetricCard({
  primaryText,
  secondaryText,
  className = "",
}: MarketMetricCardProps) {
  return (
    <div className={`relative group ${className}`}>
      {/* Container with gradient background */}
      <div className="relative h-full rounded-2xl overflow-hidden bg-[radial-gradient(ellipse_400px_300px_at_30%_20%,rgba(255,182,72,0.15),rgba(240,146,44,0.08),transparent),linear-gradient(145deg,#1A1611,#0F0C09)] ring-1 ring-amber-900/20 transition-all duration-500 hover:ring-amber-800/30 hover:-translate-y-1">

        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-orange-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Animated top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent"
          style={{ animation: 'slideRight 3s ease-in-out infinite' }} />

        {/* Corner accents */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_6px_rgba(249,115,22,0.5)]" />

        {/* Content */}
        <div className="relative p-6 h-full flex flex-col justify-center">
          <div className="text-white font-medium text-sm leading-relaxed mb-2">
            {primaryText}
          </div>
          {secondaryText && (
            <div className="text-amber-200/70 text-xs">
              {secondaryText}
            </div>
          )}
        </div>

        {/* Border animations */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }} />
      </div>

      <style jsx>{`
        @keyframes slideRight {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export default MarketMetricCard;
