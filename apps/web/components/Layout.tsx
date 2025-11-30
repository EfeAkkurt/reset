"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import resetLogo from "@/public/logos/resetLogo.png";
import { useSlowScroll } from "@/hooks/useSlowScroll";

import NavigationButtons from "@/components/landing/NavigationButtons";
import { YieldBanner } from "@/components/YieldBanner";


// Wallet integration removed - ChainGuardBanner disabled
// export const ChainGuardBanner = () => {
//   const { networkMismatch, network, expected } = useWallet();
//   if (!networkMismatch) return null;
//   return (
//     <div
//       className={`relative z-30 w-full border-b border-[${
//         colors.amber[300]
//       }] bg-[${colors.purple[50] || colors.purple[100]}]/80 backdrop-blur-xl`}
//     >
//       <div
//         className={`mx-auto max-w-7xl px-6 py-2 text-sm text-[${colors.purple[700]}]`}
//       >
//         Network mismatch: Wallet on <strong>{network}</strong> but app expects{" "}
//         <strong>{expected}</strong>. Open Leather &gt; Settings &gt; Network and
//         switch. Refresh after switching.
//       </div>
//     </div>
//   );
// };

// const ConnectButton = () => {
//   const { installed, connecting, stxAddress, connect, disconnect } =
//     useWallet();
//   const short = (a?: string | null) =>
//     a ? `${a.slice(0, 5)}…${a.slice(-4)}` : "";

//   if (!installed) {
//     return (
//       <button
//         onClick={() => window.open("https://leather.io", "_blank")}
//         className="group relative h-9 w-34 overflow-hidden rounded-md bg-white/20 backdrop-blur-[40px] px-3 text-left text-sm font-bold text-white duration-500 hover:bg-white/30"
//         aria-label="Install Leather"
//       >
//         Install Leather
//       </button>
//     );
//   }

//   if (stxAddress) {
//     return (
//       <div className="flex items-center gap-2">
//         <Badge className="bg-white/20 text-white backdrop-blur">
//           {short(stxAddress)}
//         </Badge>
//         <Button
//           variant="secondary"
//           onClick={disconnect}
//           className="gap-2 bg-white/20 text-white hover:bg-white/30 backdrop-blur"
//         >
//           Logout
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <Button
//       onClick={() => void connect()}
//       disabled={connecting}
//       className="gap-2 bg-white/20 text-white hover:bg-white/30 backdrop-blur"
//     >
//       {connecting ? "Connecting…" : "Connect Leather"}
//     </Button>
//   );
// };

export const Header = () => {
  const router = useRouter();
  const [isClickAnimating, setIsClickAnimating] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const animationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleLogoClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }
      if (isClickAnimating) return;
      event.preventDefault();

      setIsClickAnimating(true);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = setTimeout(() => {
        setIsClickAnimating(false);
        void router.push("/");
      }, 1500);
    },
    [isClickAnimating, router],
  );

  React.useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Check if scrolled past threshold for background effect
      setIsScrolled(currentScrollY > 50);

      // Hide/show logic for logo and brand name
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scroll down and past threshold - hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        // Scroll up or at top - show
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // useWallet(); // Wallet integration removed

  return (
    <header
      className={`site-header sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled ? 'header-scrolled' : ''
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          onClick={handleLogoClick}
          aria-label="Reset home"
          className={`group flex items-center gap-3 transition-all duration-300 ${
            isVisible ? 'header-logo-visible' : 'header-logo-hidden'
          }`}
        >
          <Image
            src={resetLogo}
            alt="Reset"
            width={160}
            height={58}
            priority
            className={`h-10 w-auto origin-center ${isClickAnimating ? "animate-logo-click" : "group-hover:animate-logo-hover"}`}
          />
          <div className={`wordmark transition-all duration-300 ${isVisible ? 'header-logo-visible' : 'header-logo-hidden'}`}>
            <span className="wordmark-text text-[20px]">RESET</span>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white">
          {/* Navigation links removed */}
        </nav>
      </div>
      {/* <ChainGuardBanner /> */} {/* Wallet integration removed */}
    </header>
  );
};

// Footer removed per minimalist end-cap requirement.

export const Layout = ({ children }: React.PropsWithChildren) => {
  // Disable slow scroll to fix browser native scrolling issues
  useSlowScroll({ factor: 0.5, enabled: false });
  return (
    <div className="min-h-full flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <YieldBanner />
      {/* Fixed overlay navigation buttons (old project behavior) */}
      <NavigationButtons />
      <main className="flex-1">{children}</main>
    </div>
  );
};
