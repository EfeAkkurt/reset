"use client";

import { useEffect, useState, useRef } from 'react';

interface UseSectionProgressOptions {
  threshold?: number;
  disabled?: boolean;
}

export function useSectionProgress(options: UseSectionProgressOptions = {}) {
  const { threshold = 0.95, disabled = false } = options;
  const [progress, setProgress] = useState(0);
  const [isPinned, setIsPinned] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (disabled) {
      setProgress(1);
      setIsPinned(false);
      return;
    }

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const containerHeight = rect.height;
        const viewportHeight = window.innerHeight;

        // Calculate scroll progress within the section
        // When top of container is at viewport top: progress = 0
        // When bottom of container is at viewport top: progress = 1
        const scrolled = -rect.top;
        const maxScroll = containerHeight - viewportHeight;

        const newProgress = Math.max(0, Math.min(1, scrolled / maxScroll));
        setProgress(newProgress);

        // Release pin when threshold is reached
        if (newProgress >= threshold) {
          setIsPinned(false);
        } else {
          setIsPinned(true);
        }
      });
    };

    // Initial check
    handleScroll();

    // Add scroll listener with throttling
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [threshold, disabled]);

  return { progress, isPinned, containerRef };
}