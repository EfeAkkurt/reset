"use client";
import React from "react";
import { motion } from "framer-motion";
import { CinematicOpportunityChart } from "./CinematicOpportunityChart";

type Opportunity = {
  id: string;
  protocol: string;
  pair: string;
  chain: string;
  apr: number;
  apy: number;
  risk: "Low" | "Medium" | "High";
  tvlUsd: number;
  rewardToken: string;
  lastUpdated: string;
  originalUrl: string;
  summary: string;
};

interface OpportunityOverviewCardProps {
  data: Opportunity;
}

export function OpportunityOverviewCard({}: OpportunityOverviewCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="h-[500px] space-y-6 rounded-[32px] border border-[rgba(255,182,72,0.16)] bg-[#0C0D0F]/95 p-6 text-white shadow-[0_35px_90px_rgba(0,0,0,0.6)]"
    >
      <CinematicOpportunityChart />
    </motion.section>
  );
}
