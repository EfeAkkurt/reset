import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ParticleField } from "./ParticleField";

export default function BackgroundSystem() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number>();

  // Track scroll progress
  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      setScrollProgress(progress);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        rafRef.current = requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    updateScrollProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Reactive Lighting: Track cursor and update CSS variables
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      document.documentElement.style.setProperty("--cursor-x", `${x}px`);
      document.documentElement.style.setProperty("--cursor-y", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Base background layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--bg-deep)',
          zIndex: 1
        }}
      />

      {/* Deep Space Particle Field (R3F) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 z-[2] opacity-40">
          <Canvas camera={{ position: [0, 0, 20], fov: 75 }} gl={{ alpha: true, antialias: true }}>
            <ParticleField />
          </Canvas>
        </div>
      )}

      {/* Reactive Lighting Layer - Follows cursor via CSS vars */}
      <div 
        className="absolute inset-0 z-[3] opacity-30 mix-blend-screen transition-opacity duration-500"
        style={{
          background: `radial-gradient(
            600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), 
            rgba(214, 167, 92, 0.15), 
            transparent 40%
          )`
        }}
      />

      {/* Vignette layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--vignette-gradient)',
          zIndex: 4
        }}
      />

      {/* Amber glow layer with subtle motion */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute w-[1400px] h-[1400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--glow-amber-center) 0%, var(--glow-amber-edge) 50%, transparent 70%)',
            left: '60%',
            top: '30%',
            filter: 'blur(600px)',
            opacity: 0.04,
            zIndex: 5
          }}
          initial={{ transform: "translate(-50%, -50%)" }}
          animate={{
            translateX: ["-50%", "-48.5%", "-51%", "-50%"],
            translateY: ["-50%", "-51%", "-48.8%", "-50%"],
          }}
          transition={{
            duration: 50,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
      )}

      {/* Content spotlight - follows scroll */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out"
        style={{
          background: 'var(--spotlight-gradient)',
          zIndex: 6,
          opacity: Math.max(0.3, 1 - scrollProgress * 0.7)
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 grid-subtle"
        style={{
          zIndex: 7,
          opacity: Math.max(0.5, 1 - scrollProgress * 0.3)
        }}
      />
    </div>
  );
}