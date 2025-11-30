"use client";

import React, {
  memo,
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { motion, MotionValue, useTransform, useSpring } from "framer-motion";
import { Wallet, ArrowRight } from "lucide-react";

type Side = "left" | "right";

interface StepData {
  side: Side;
  title: React.ReactNode;
  body: React.ReactNode;
  badge: string;
}

interface WithdrawStepProps {
  id: string;
  index: number;
  step: StepData;
  total: number;
  progress: MotionValue<number>;
  cardsOffset: number;
}

const walletOptions = [
  { id: "freighter", label: "Freighter", detail: "Browser" },
  { id: "lobstr", label: "Lobstr", detail: "Mobile" },
  { id: "xbull", label: "xBull", detail: "Power users" },
  { id: "albedo", label: "Albedo", detail: "Web" },
];

const microBenefits = [
  "Withdraw to any Stellar wallet",
  "No custody, no lockups",
  "Soroban → wallet in seconds",
];

const flowNodes = [
  { title: "Reset Vault", detail: "Yield harvested" },
  { title: "Soroban Bridge", detail: "Policy ledger" },
  { title: "Your Wallet", detail: "" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const WithdrawStep = memo<WithdrawStepProps>(({
  id,
  index,
  step,
  total,
  progress,
  cardsOffset,
}) => {
  const animationRanges = useMemo(() => {
    const usableSpan = 1 - cardsOffset;
    const segment = usableSpan / total;
    const start = cardsOffset + index * segment;
    const enterEnd = start + segment * 0.5;
    const exitStart = start + segment * 0.92;
    const end = start + segment;

    return {
      base: [start, enterEnd, exitStart, end] as [number, number, number, number],
    };
  }, [index, total, cardsOffset]);

  const opacity = useTransform(progress, animationRanges.base, [0, 1, 1, 0]);
  const translateX = useTransform(progress, animationRanges.base, [88, 0, 0, -44]);
  const scale = useTransform(progress, animationRanges.base, [0.96, 1, 1, 1]);
  const pointerEvents = useTransform(progress, animationRanges.base, ["none", "auto", "auto", "none"] as const);

  return (
    <>
      <motion.article
        id={id}
        className="absolute inset-0 -translate-y-32 px-4 sm:px-6 xl:px-8 flex items-center justify-center z-10"
        style={{
          opacity,
          x: translateX,
          scale,
          pointerEvents,
          backfaceVisibility: "hidden" as const,
          transformStyle: "preserve-3d" as const,
          willChange: "transform, opacity",
        }}
      >
        <section className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="order-1 flex justify-center"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            >
              <WithdrawStepCard />
            </motion.div>

            <motion.div
              className="order-2 space-y-5 lg:space-y-6 max-w-xl"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--neutral-900)]/80 border border-[color:var(--alpha-gold-16)] px-3 py-[6px] text-[11px] tracking-[0.16em] uppercase text-[color:var(--text-2)]">
                <span className="inline-flex h-[6px] w-[6px] rounded-full bg-[color:var(--gold-500)]" />
                {step.badge}
              </div>
              <h3 className="text-[30px] sm:text-[34px] lg:text-[38px] font-semibold leading-[1.15] text-white max-w-xl">
                Earn, withdraw, repeat — all in your{" "}
                <span className="text-[color:var(--gold-500)]">wallet</span>
              </h3>
              <p className="text-[14px] leading-relaxed text-[color:var(--text-2)] max-w-md">
                {step.body}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[color:var(--text-2)]/70">
                {microBenefits.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="inline-flex h-[6px] w-[6px] rounded-full bg-[color:var(--gold-500)]" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </motion.article>
    </>
  );
});

WithdrawStep.displayName = "WithdrawStep";

const WithdrawStepCard = memo(() => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const availableBalance = 3125;
  const [percentage, setPercentage] = useState(45);
  const [selectedWallet, setSelectedWallet] = useState(walletOptions[0].id);

  const amountValue = useMemo(() => (availableBalance * percentage) / 100, [availableBalance, percentage]);

  const amountSpring = useSpring(amountValue, {
    stiffness: 140,
    damping: 24,
    mass: 0.6,
  });
  const [animatedAmount, setAnimatedAmount] = useState(amountValue);

  useEffect(() => {
    const unsubscribe = amountSpring.on("change", (value) => setAnimatedAmount(value));
    return () => unsubscribe();
  }, [amountSpring]);

  useEffect(() => {
    amountSpring.set(amountValue);
  }, [amountSpring, amountValue]);

  const updatePercentage = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const relative = (clientX - rect.left) / rect.width;
    const next = Math.max(0, Math.min(100, Math.round(relative * 100)));
    setPercentage(next);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    updatePercentage(event.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      updatePercentage(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [updatePercentage]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        setPercentage((prev) => Math.max(0, prev - delta));
        break;
      case "ArrowRight":
        event.preventDefault();
        setPercentage((prev) => Math.min(100, prev + delta));
        break;
      case "Home":
        setPercentage(0);
        break;
      case "End":
        setPercentage(100);
        break;
      default:
        break;
    }
  }, []);

  const selectedWalletData = walletOptions.find((wallet) => wallet.id === selectedWallet) ?? walletOptions[0];
  const formattedAmount = currencyFormatter.format(animatedAmount);
  const formattedAvailable = currencyFormatter.format(availableBalance);

  return (
    <motion.div
      className="relative w-full max-w-[420px] bg-[color:var(--neutral-900)]/95 border border-[color:var(--alpha-gold-16)] rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.9)] px-6 py-6 lg:px-7 lg:py-7 overflow-hidden flex flex-col gap-5"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.55 }}
      whileHover={{ y: -6, boxShadow: "0 24px 80px rgba(0,0,0,0.95)" }}
      transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 0% 0%, rgba(224,145,44,0.20), transparent 55%)",
          opacity: 0.8,
          mixBlendMode: "screen",
        }}
      />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--alpha-gold-16)] bg-[color:var(--neutral-900)]/80">
              <Wallet className="h-4 w-4 text-[color:var(--gold-500)]" strokeWidth={1.6} />
            </span>
            <span className="text-[12px] uppercase tracking-[0.05em] text-[color:var(--text-2)]/80">
              Withdraw Widget
            </span>
          </div>
          <span className="rounded-full border border-[color:var(--alpha-gold-16)]/60 bg-[color:var(--neutral-900)]/80 px-3 py-1 text-[11px] tracking-[0.14em] uppercase text-[color:var(--text-2)]/70">
            Non-custodial
          </span>
        </div>

        <div className="rounded-2xl border border-[color:var(--alpha-gold-16)]/40 bg-[color:var(--neutral-900)]/40 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-[12px] uppercase text-[color:var(--text-2)]/70">
            <span>Amount</span>
            <span>Available {formattedAvailable}</span>
          </div>
          <div className="flex items-end justify-between">
            <motion.span
              className="text-[34px] font-semibold text-white leading-none"
              style={{ y: 0 }}
              key={formattedAmount}
            >
              {formattedAmount}
            </motion.span>
            <button
              onClick={() => setPercentage(100)}
              className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--gold-400)]"
            >
              max
            </button>
          </div>
          <div
            ref={sliderRef}
            className="mt-3 relative h-[6px] rounded-full bg-[color:var(--neutral-800)] cursor-pointer"
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-label="Withdraw percentage"
            tabIndex={0}
            style={{ touchAction: "none" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${percentage}%`,
                background: "linear-gradient(90deg, var(--gold-400), var(--gold-600))",
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[color:var(--gold-500)] shadow-[0_0_0_6px_rgba(224,145,44,0.22)] border border-white/30"
              style={{ left: `${percentage}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[color:var(--text-2)]/55">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--alpha-gold-16)]/30 bg-[color:var(--neutral-900)]/30 px-5 py-4">
          <div className="text-[12px] uppercase tracking-[0.14em] text-[color:var(--text-2)]/80 mb-4">
            Flow path
          </div>
          <div className="space-y-3">
            {flowNodes.map((node, idx) => (
              <div key={node.title} className="relative pl-6">
                {idx < flowNodes.length - 1 && (
                  <div className="absolute left-[11px] top-4 bottom-0 w-px bg-gradient-to-b from-[color:var(--gold-500)]/50 to-transparent" />
                )}
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full border border-[color:var(--alpha-gold-16)]/60 bg-[color:var(--neutral-900)]/80 flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-[color:var(--gold-400)]" strokeWidth={1.8} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-white">
                      {idx === flowNodes.length - 1
                        ? `${node.title} (${selectedWalletData.label})`
                        : node.title}
                    </div>
                    <div className="text-[12px] text-[color:var(--text-2)]/75">
                      {idx === flowNodes.length - 1
                        ? "Direct ownership"
                        : node.detail}
                    </div>
                  </div>
                  {idx === 0 && (
                    <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-2)]/70">
                      source
                    </span>
                  )}
                  {idx === flowNodes.length - 1 && (
                    <span className="text-[11px] uppercase tracking-[0.14em] text-[#4ADE80]">
                      complete
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-[0.14em] text-[color:var(--text-2)]/80 mb-2">
            Wallet selection
          </div>
          <div className="flex flex-wrap gap-2">
            {walletOptions.map((option) => {
              const isActive = option.id === selectedWallet;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedWallet(option.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                    isActive
                      ? "border-[color:var(--gold-500)]/70 bg-[color:var(--gold-500)]/15 text-white"
                      : "border-[color:var(--alpha-gold-16)]/40 bg-[color:var(--neutral-900)]/70 text-[color:var(--text-2)]"
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-2)]/70">
                    {option.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.button
          className="rounded-full px-5 py-3 text-[14px] font-semibold text-[#0A0A0A] shadow-[0_10px_36px_rgba(224,145,44,0.4)]"
          style={{
            background: "linear-gradient(135deg, var(--gold-400), var(--gold-600))",
          }}
          whileHover={{ y: -1, filter: "brightness(1.08)" }}
          whileTap={{ scale: 0.98 }}
        >
          Send to {selectedWalletData.label}
        </motion.button>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[color:var(--neutral-800)]/80">
          {[
            { label: "ETA", value: "~12s" },
            { label: "Fee", value: "$0.03" },
            { label: "Lockup", value: "None" },
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full bg-[color:var(--neutral-900)]/90 border border-[color:var(--alpha-gold-16)] px-3 py-[6px] text-[11px] tracking-[0.12em] uppercase text-[color:var(--text-2)]/80"
            >
              {item.label} {item.value}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

WithdrawStepCard.displayName = "WithdrawStepCard";
