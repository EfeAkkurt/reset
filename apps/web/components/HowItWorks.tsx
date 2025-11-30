"use client";

import { HowItWorksContainer } from "./landing/HowItWorksContainer";

type HowItWorksProps = {
  /** Local scene progress supplied by ScrollOrchestrator (0..1). */
  progress?: number;
};

/**
 * Optimized HowItWorks component with improved performance:
 * - Lazy loading of cards with Intersection Observer
 * - Reduced MotionValue usage (from 40+ to 15)
 * - Canvas-based scatter plot instead of heavy SVG
 * - Memoized components to prevent re-renders
 * - RequestAnimationFrame throttling for scroll
 * - CSS containment for better rendering
 */
export default function HowItWorks({ progress }: HowItWorksProps) {
  return <HowItWorksContainer progress={progress} />;
}