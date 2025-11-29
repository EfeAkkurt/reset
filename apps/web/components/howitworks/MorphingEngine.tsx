"use client";

import React, { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { Sphere, Torus, Icosahedron, Box, Sparkles } from "@react-three/drei";

gsap.registerPlugin(ScrollTrigger);

export function MorphingEngine() {
  const groupRef = useRef<THREE.Group>(null);
  const scannerRef = useRef<THREE.Group>(null);
  const radarRef = useRef<THREE.Group>(null);
  const vaultRef = useRef<THREE.Group>(null);
  const walletRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (!groupRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#how-it-works-section",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });

    // STAGE 1 -> 2: Scanner to Radar
    tl.to(scannerRef.current!.scale, { x: 0, y: 0, z: 0, duration: 1 }, 0);
    tl.fromTo(radarRef.current!.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1 }, 0.5);
    tl.to(groupRef.current!.rotation, { y: Math.PI * 2, duration: 2 }, 0);

    // STAGE 2 -> 3: Radar to Vault
    tl.to(radarRef.current!.scale, { x: 0, y: 0, z: 0, duration: 1 }, 2);
    tl.fromTo(vaultRef.current!.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1 }, 2.5);
    tl.to(groupRef.current!.rotation, { z: Math.PI, duration: 2 }, 2);

    // STAGE 3 -> 4: Vault to Wallet
    tl.to(vaultRef.current!.scale, { x: 0, y: 0, z: 0, duration: 1 }, 4);
    tl.fromTo(walletRef.current!.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1 }, 4.5);
    tl.to(groupRef.current!.rotation, { x: Math.PI, duration: 2 }, 4);

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
    // Pulse effects
    if (radarRef.current) {
        radarRef.current.rotation.z -= delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* STAGE 1: SCANNER */}
      <group ref={scannerRef}>
        <Sparkles count={2000} scale={12} size={2} speed={0.4} opacity={1} color="#D6A75C" />
        <Torus args={[3, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#D6A75C" transparent opacity={0.5} />
        </Torus>
        <Torus args={[2, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#D6A75C" emissive="#D6A75C" emissiveIntensity={2} />
        </Torus>
      </group>

      {/* STAGE 2: RADAR */}
      <group ref={radarRef} scale={0}>
        <Icosahedron args={[2, 1]}>
             <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.3} />
        </Icosahedron>
        <Sphere args={[0.2, 16, 16]} position={[1, 1, 1]}>
             <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={5} />
        </Sphere>
        <Sphere args={[0.2, 16, 16]} position={[-1, -0.5, 0.5]}>
             <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={5} />
        </Sphere>
      </group>

      {/* STAGE 3: VAULT */}
      <group ref={vaultRef} scale={0}>
        <Icosahedron args={[2.5, 2]}>
          <meshPhysicalMaterial 
            roughness={0} 
            metalness={1} 
            transmission={0.6} 
            thickness={2}
            color="#D6A75C"
            emissive="#D6A75C"
            emissiveIntensity={0.2}
          />
        </Icosahedron>
        <Torus args={[3, 0.1, 16, 100]}>
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </Torus>
      </group>

      {/* STAGE 4: WALLET */}
      <group ref={walletRef} scale={0}>
        <Box args={[1.5, 2.5, 0.5]}>
            <meshStandardMaterial color="#000000" metalness={0.8} roughness={0.2} />
        </Box>
        <Box args={[1.4, 2.4, 0.55]}>
             <meshStandardMaterial color="#D6A75C" wireframe />
        </Box>
        <group position={[0, 0, 0.5]}>
            <Box args={[0.5, 0.2, 0.1]} position={[0, 0.5, 0]}>
                <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
            </Box>
        </group>
      </group>
    </group>
  );
}
