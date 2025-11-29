"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { MorphingEngine } from "./MorphingEngine";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";

export default function KineticScene() {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 35 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Atmosphere */}
          <color attach="background" args={["#050505"]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <fog attach="fog" args={["#050505", 5, 20]} />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#D6A75C" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4c1d95" />

          {/* The Core Engine */}
          <MorphingEngine />

          {/* Post Processing */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
