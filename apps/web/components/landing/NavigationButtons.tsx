"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MagneticButton } from "./MagneticButton";
import { useStellarWallet } from "@/components/providers/StellarWalletProvider";

function truncateAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WalletNavigation() {
  const [mounted, setMounted] = useState(false);
  const { address, connect, disconnect } = useStellarWallet();
  const [collapseNav, setCollapseNav] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const shouldCollapse = window.scrollY > 120;
      setCollapseNav(shouldCollapse);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleConnect = () => {
    if (address) {
      // Optional: Disconnect on click if already connected, or show profile
      // For now, let's just disconnect to allow switching
      disconnect();
    } else {
      connect();
    }
  };

  if (!mounted) return null;

  return (
    <header
      className="fixed z-[9999] top-[calc(env(safe-area-inset-top,0px)+14px)] right-[calc(env(safe-area-inset-right,0px)+24px)] left-auto"
      style={{
        pointerEvents: "none",
        opacity: collapseNav ? 0 : 1,
        transform: collapseNav ? "translateY(-40px)" : "translateY(0)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      <nav
        className="pointer-events-auto"
        aria-label="Primary"
        style={{
          position: "relative",
          zIndex: 1,
          pointerEvents: collapseNav ? "none" : "auto",
        }}
      >
        <ul className="flex items-center list-none m-0 p-0 gap-4 space-x-4 [&>li+li]:ml-4">
          <li
            style={{
              opacity: collapseNav ? 0 : 1,
              transform: collapseNav ? "translateY(-10px)" : "translateY(0)",
              pointerEvents: collapseNav ? "none" : "auto",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            <MagneticButton
              onClick={handleConnect}
              className="relative flex items-center gap-2 overflow-hidden rounded-full bg-[#1A1A1A] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#252525]"
            >
              <span className="relative z-10">
                {address ? truncateAddress(address) : "Connect Wallet"}
              </span>
              {/* Scattered Gold Glow Effect */}
              <div className="absolute inset-0 -z-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
                <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(214,167,92,0.4)_0%,transparent_70%)] blur-md" />
              </div>
            </MagneticButton>
          </li>
          <li
            style={{
              marginLeft: 16,
              opacity: collapseNav ? 0 : 1,
              transform: collapseNav ? "translateY(-10px)" : "translateY(0)",
              pointerEvents: collapseNav ? "none" : "auto",
              transition: "opacity 0.3s ease 0.05s, transform 0.3s ease 0.05s",
            }}
          >
            <Link href="/portfolio" legacyBehavior>
              <a className="nav-link inline-flex items-center">Portfolio</a>
            </Link>
          </li>
          <li
            style={{
              marginLeft: 16,
              opacity: collapseNav ? 0 : 1,
              transform: collapseNav ? "translateY(-10px)" : "translateY(0)",
              pointerEvents: collapseNav ? "none" : "auto",
              transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s",
            }}
          >
            <Link href="/opportunities" legacyBehavior>
              <a className="nav-link inline-flex items-center">Opportunities</a>
            </Link>
          </li>
        </ul>
      </nav>

      <style jsx>{`
        .nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          font-family: Inter, system-ui, -apple-system, sans-serif;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-size: 14px;
          color: #fff;
          padding-bottom: 10px;
          cursor: pointer;
          text-decoration: none !important;
          border: none !important;
          outline: none !important;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          transform: scaleX(0);
          transform-origin: bottom right;
          background: var(--gold-300);
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nav-link:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
      `}</style>
    </header>
  );
}

export default function NavigationButtons() {
  return <WalletNavigation />;
}
