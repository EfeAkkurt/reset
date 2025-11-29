"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

type RiskKey = "all" | "low" | "medium" | "high";
type SortKey =
  | "apr-desc"
  | "apr-asc"
  | "apy-desc"
  | "apy-asc"
  | "tvl-desc"
  | "tvl-asc"
  | "risk-desc"
  | "risk-asc";

type MenuItems =
  | { key: string; label: string }[]
  | { group: string; options: { key: string; label: string }[] }[];

const isGroupedItems = (
  items: MenuItems,
): items is { group: string; options: { key: string; label: string }[] }[] =>
  Array.isArray(items) &&
  items.length > 0 &&
  Object.prototype.hasOwnProperty.call(items[0], "group");

export default function AnimatedFilterBar({
  defaultRisk = "all",
  defaultSort = "apr-desc",
  onRiskChange,
  onSortChange,
  sticky = true,
}: {
  defaultRisk?: RiskKey;
  defaultSort?: SortKey;
  onRiskChange: (_: string) => void;
  onSortChange: (_: string) => void;
  sticky?: boolean;
}) {
  return (
    <div
      className={clsx(
        "w-full border-y border-alpha-gold-16 bg-[rgba(10,10,10,0.95)] backdrop-blur",
        sticky &&
          "sticky top-0 z-20 shadow-[0_20px_45px_rgba(0,0,0,0.45)] supports-[backdrop-filter]:backdrop-blur-xl",
      )}
      role="toolbar"
      aria-label="Filters and sorting"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 px-6 py-6">
        <Menu
          label="Risk"
          items={[
            { key: "all", label: "All Risks" },
            { key: "low", label: "Low" },
            { key: "medium", label: "Medium" },
            { key: "high", label: "High" },
          ]}
          onSelect={(k) => onRiskChange?.(k as RiskKey)}
          defaultKey={defaultRisk}
        />
        <Menu
          label="Sort"
          items={[
            {
              group: "APR",
              options: [
                { key: "apr-desc", label: "High → Low" },
                { key: "apr-asc", label: "Low → High" },
              ],
            },
            {
              group: "APY",
              options: [
                { key: "apy-desc", label: "High → Low" },
                { key: "apy-asc", label: "Low → High" },
              ],
            },
            {
              group: "TVL",
              options: [
                { key: "tvl-desc", label: "High → Low" },
                { key: "tvl-asc", label: "Low → High" },
              ],
            },
            {
              group: "Risk",
              options: [
                { key: "risk-desc", label: "High → Low" },
                { key: "risk-asc", label: "Low → High" },
              ],
            },
          ]}
          onSelect={(k) => onSortChange?.(k as SortKey)}
          defaultKey={defaultSort}
          wide
        />
      </div>
    </div>
  );
}

function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
}

function Menu({
  label,
  items,
  onSelect,
  defaultKey,
  wide,
}: {
  label: string;
  items: MenuItems;
  onSelect: (key: string) => void;
  defaultKey?: string;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(defaultKey);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));

  const flattened = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    if (isGroupedItems(items)) {
      return items.flatMap((group) => group.options);
    }
    return items as { key: string; label: string }[];
  }, [items]);

  const activeLabel =
    flattened.find((opt) => opt.key === current)?.label ??
    flattened.find((opt) => opt.key === defaultKey)?.label ??
    label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={clsx(
          "inline-flex items-center gap-3 rounded-full border border-alpha-gold-16 bg-[var(--neutral-900)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:border-gold-400 hover:text-gold-200",
          open
            ? "bg-gold-500 text-[#1A1B1E] ring-2 ring-gold-500 ring-offset-2 ring-offset-transparent"
            : "",
          "focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-transparent",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex flex-col text-left leading-none">
          <span>{label}</span>
          <span className="text-xs font-normal opacity-70">
            {activeLabel}
          </span>
        </div>
        <Chevron open={open} />
      </button>

      <AnimatePresence>
        {open && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={clsx(
              "absolute left-0 mt-3 rounded-2xl border border-alpha-gold-16 bg-[var(--neutral-900)] text-white shadow-2xl shadow-black/40 ring-1 ring-gold-500 backdrop-blur z-50",
                wide ? "w-64" : "w-48",
              )}
            >
            {isGroupedItems(items) ? (
              <div className="max-h-[60vh] overflow-auto p-2">
                {items.map((g) => (
                  <div key={g.group} className="mb-1 last:mb-0">
                    <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-white/40">
                      {g.group}
                    </div>
                    {g.options.map((opt) => (
                      <MenuItem
                        key={opt.key}
                        active={current === opt.key}
                        label={opt.label}
                        onClick={() => {
                          setCurrent(opt.key);
                          onSelect(opt.key);
                          setOpen(false);
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2">
                {(items as { key: string; label: string }[]).map((opt) => (
                  <MenuItem
                    key={opt.key}
                    active={current === opt.key}
                    label={opt.label}
                    onClick={() => {
                      setCurrent(opt.key);
                      onSelect(opt.key);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitemradio"
      aria-checked={!!active}
      onClick={onClick}
      className={clsx(
        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm",
        active
          ? "bg-alpha-gold-16 text-white"
          : "text-white/70 hover:bg-white/5",
      )}
    >
      <span>{label}</span>
      {active && <span className="text-xs text-gold-200">✓</span>}
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      className="opacity-80"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.18 }}
    >
      <path
        d="M1 1l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
