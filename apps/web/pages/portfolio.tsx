"use client";
import React, { useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
// import { UserPosition } from "../../../../packages/shared/src/types"; // TODO: Use when wallet integration ready
import { Logger } from "@/lib/adapters/real";
import { toast } from "sonner";
import { AccountSummary } from "@/components/portfolio/AccountSummary";
import { PositionsList } from "@/components/portfolio/PositionsList";
import PortfolioOverviewChart from "@/components/PortfolioOverviewChart";
import { toCSV, downloadCSV } from "@/lib/csv";
import { AlertCircle } from "lucide-react";

// Removed unused calc function - was used for MiniSummary that was removed

// Type for compatibility with existing components
type RedirectEntry = {
  id: string;
  protocol: string;
  pair: string;
  apr: number;
  amount: number;
  days: number;
  ts: number;
  chain: string;
  txid?: string;
  action?: "Deposit" | "Withdraw";
};

export default function PortfolioPage() {
  // const [positions, setPositions] = React.useState<UserPosition[]>([]); // TODO: Use when wallet integration ready
  const [rows, setRows] = React.useState<RedirectEntry[]>([]);
  const [period, setPeriod] = React.useState<"24H" | "7D" | "30D" | "90D">("30D");
  const [loading, setLoading] = React.useState(true);
  const [error] = React.useState<string | null>(null);

  // Overview chart row type for explicit shape
  type OverviewRow = { t: string; total: number; pnl: number; chg24h: number };
  const [overviewByPeriod, setOverviewByPeriod] = React.useState<
    Record<"24H" | "7D" | "30D" | "90D", OverviewRow[]>
  >({
    "24H": [],
    "7D": [],
    "30D": [],
    "90D": [],
  });
  // Rewards chart data
  type RewardPoint = {
    date: string;
    ALEX: number;
    DIKO: number;
    OTHER?: number;
  };
  // const [scenario, setScenario] = React.useState<"A" | "B">("A");

  // Deterministic pseudo-random for stable, scenario-specific mock data
  const seeded = (seed: number) => {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 0xffffffff;
      return s / 0xffffffff;
    };
  };

  const genOverview = useCallback((
    points: number,
    seed: number,
    baseTotal: number,
  ): OverviewRow[] => {
    const rnd = seeded(seed);
    const out: OverviewRow[] = [];
    let total = baseTotal;
    let pnl = 0;
    // Use fixed base date (day precision) to avoid hydration mismatches
    const baseDate = new Date(Math.floor(Date.now() / 86400000) * 86400000);
    for (let i = points - 1; i >= 0; i--) {
      const drift = (rnd() - 0.48) * 0.02; // ~±2%
      const change = total * drift;
      total = Math.max(1500, total + change);
      pnl += change * 0.5;
      const dt = new Date(baseDate.getTime() - i * 24 * 3600 * 1000);
      out.push({
        t: dt.toISOString().slice(0, 10),
        total: Math.round(total),
        pnl: Math.round(pnl),
        chg24h: Math.round(change),
      });
    }
    return out;
  }, []);

  const genRewards = useCallback((days: number, seed: number): RewardPoint[] => {
    const rnd = seeded(seed);
    const out: RewardPoint[] = [];
    // Start levels vary per scenario; small random walk per day
    let a = 35 + rnd() * 20; // ALEX
    let d = 15 + rnd() * 10; // DIKO
    let o = 6 + rnd() * 8; // OTHER
    const baseDate = new Date(Math.floor(Date.now() / 86400000) * 86400000);
    for (let i = days - 1; i >= 0; i--) {
      a = Math.max(0, a + (rnd() - 0.48) * 6);
      d = Math.max(0, d + (rnd() - 0.5) * 3);
      o = Math.max(0, o + (rnd() - 0.52) * 4);
      const dt = new Date(baseDate.getTime() - i * 24 * 3600 * 1000);
      out.push({
        date: dt.toISOString().slice(0, 10),
        ALEX: +a.toFixed(2),
        DIKO: +d.toFixed(2),
        OTHER: +o.toFixed(2),
      });
    }
    return out;
  }, []);

  const buildRowsScenario = (variant: "A" | "B"): RedirectEntry[] => {
    const now = Date.now();
    const base = variant === "A" ? 1 : 2; // simple branch for deterministic diffs
    const mk = (
      id: string,
      protocol: string,
      pair: string,
      apr: number,
      amount: number,
      days: number,
      offsetDays: number,
      action: "Deposit" | "Withdraw" = "Deposit",
      txid?: string,
    ): RedirectEntry => ({
      id,
      protocol,
      pair,
      apr,
      amount: Math.round(amount * 100) / 100,
      days,
      ts: now - offsetDays * 24 * 3600 * 1000 + base * 7777, // stable shift between scenarios
      chain: "stacks",
      action,
      txid,
    });

    // Compose a realistic activity feed across multiple pools
    const rows: RedirectEntry[] = [
      // ZEST STX
      mk(
        "zest-stx",
        "ZEST",
        "STX",
        variant === "A" ? 13.4 : 16.1,
        2400 + 300 * base,
        30,
        2,
        "Deposit",
      ),
      mk(
        "zest-stx",
        "ZEST",
        "STX",
        variant === "A" ? 13.4 : 16.1,
        900 + 120 * base,
        14,
        1,
        "Deposit",
      ),


      // ZEST AEUSDC (stable-ish)
      mk(
        "zest-aeusdc",
        "ZEST",
        "AEUSDC",
        variant === "A" ? 6.8 : 9.1,
        2600,
        16,
        6,
        "Deposit",
      ),
      mk(
        "zest-aeusdc",
        "ZEST",
        "AEUSDC",
        variant === "A" ? 6.8 : 9.1,
        900,
        6,
        1,
        "Deposit",
      ),
    ];

    // Sort by time desc for highlighting in ActivityFeed
    return rows.sort((a, b) => b.ts - a.ts);
  };

  React.useEffect(() => {
    // Alternate between two scenarios on every reload
    try {
      const last = localStorage.getItem("portfolio_mock_scenario");
      const next: "A" | "B" = last === "A" ? "B" : "A";
      localStorage.setItem("portfolio_mock_scenario", next);
      // setScenario(next); // Commented out as scenario is unused

      // Prepare scenario-specific datasets
      const isA = next === "A";
      const seed = isA ? 1337 : 4242;
      const baseTotal = isA ? 112_000 : 86_500;
      const overview24 = genOverview(
        24,
        seed + 1,
        Math.round(baseTotal * 0.98),
      );
      const overview7 = genOverview(7, seed + 2, baseTotal);
      const overview30 = genOverview(
        30,
        seed + 3,
        Math.round(baseTotal * 0.92),
      );
      const overview90 = genOverview(
        90,
        seed + 4,
        Math.round(baseTotal * 0.85),
      );
      setOverviewByPeriod({
        "24H": overview24,
        "7D": overview7,
        "30D": overview30,
        "90D": overview90,
      });

      setRows(buildRowsScenario(next));
      setLoading(false);
    } catch {
      // Fallback: still set something
      Logger.warn("Mock scenario init failed, falling back to A");
      // setScenario("A"); // Commented out as scenario is unused
      setOverviewByPeriod({
        "24H": genOverview(24, 1, 100_000),
        "7D": genOverview(7, 2, 100_000),
        "30D": genOverview(30, 3, 95_000),
        "90D": genOverview(90, 4, 90_000),
      });
      setRows(buildRowsScenario("A"));
      setLoading(false);
    }
  }, [genOverview, genRewards]);

  // Removed unused variables - MiniSummary was removed per user request

  const clear = () => {
    Logger.info("🧽 Clearing portfolio data...");
    localStorage.removeItem("stacks_portfolio_mock");
    setRows([]);
    toast("Cleared", { description: "Portfolio history cleared." });
  };

  const exportCSV = () => {
    Logger.info("📄 Exporting portfolio to CSV...");
    const withEst = rows.map((r) => ({
      When: new Date(r.ts).toISOString(),
      Protocol: r.protocol,
      Pair: r.pair,
      Amount: r.amount,
      APR: r.apr,
      Days: r.days,
      EstReturn: (r.amount * (r.apr / 100) * (r.days / 365)).toFixed(2),
    }));
    const csv = toCSV(withEst, [
      "When",
      "Protocol",
      "Pair",
      "Amount",
      "APR",
      "Days",
      "EstReturn",
    ]);
    downloadCSV("portfolio.csv", csv);
    Logger.info(`✅ Exported ${rows.length} portfolio entries to CSV`);
  };

  
  const emptyIllustration =
    "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?auto=format&fit=crop&q=80&w=1200";

  return (
    <>
      <Head>
        <title>Portfolio | Reset</title>
        <meta
          name="description"
          content="Track your yield portfolio, view positions, and monitor your returns on Reset."
        />
        <meta property="og:title" content="Portfolio | Reset" />
        <meta
          property="og:description"
          content="Track your yield portfolio, view positions, and monitor your returns on Reset."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Portfolio | Reset" />
        <meta
          name="twitter:description"
          content="Track your yield portfolio, view positions, and monitor your returns on Reset."
        />
      </Head>
      <div className="relative min-h-screen bg-[#050505] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(243,162,51,0.14),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.02),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16">
          <header className="mb-10 space-y-4 text-center md:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#D8D9DE]/70">
              Reset / Portfolio
            </p>
            <h1 className="text-4xl font-black md:text-5xl">
              Explore Yield Opportunities
            </h1>
            <p className="max-w-3xl text-sm text-[#D8D9DE]/80">
              Ultra-clear portfolio telemetry with gold-accented precision. View
              principal exposure, performance, and live opportunity tiles in a
              single institutional console.
            </p>
          </header>

          {error && (
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertCircle className="mt-1 h-5 w-5 text-red-200" />
              <div>
                <p className="font-semibold uppercase tracking-[0.01em]">
                  Portfolio loading failed
                </p>
                <p className="text-red-100/80">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="mt-20 flex flex-col items-center gap-4 text-[#D8D9DE]/70">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#F3A233]/30 border-t-[#F3A233]" />
              <p className="text-xs uppercase tracking-[0.01em]">
                Syncing ledger...
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#131315] to-[#050505] p-10 shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
              <div className="relative grid gap-8 md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.01em] text-[#D8D9DE]/70">
                    No active holdings
                  </p>
                  <h3 className="mt-4 text-3xl font-black">
                    Deploy idle capital
                  </h3>
                  <p className="mt-3 text-sm text-[#D8D9DE]/80">
                    Browse Reset opportunities and pin protocols into your
                    institutional ledger. All data shown is mocked for UX
                    parity—start a deposit to simulate flows.
                  </p>
                  <Link
                    href="/opportunities"
                    className="mt-6 inline-flex rounded-full border border-[#F3A233] px-6 py-3 text-xs font-semibold uppercase tracking-[0.01em] text-[#F3A233] hover:bg-[#F3A233]/10"
                  >
                    Browse opportunities
                  </Link>
                </div>
                <div className="relative h-64 w-full overflow-hidden rounded-2xl">
                  <Image
                    src={emptyIllustration}
                    alt="Portfolio preview"
                    fill
                    className="object-cover opacity-80"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10 lg:flex-row">
              <div className="flex-1 space-y-8">
                <PortfolioOverviewChart
                  period={period}
                  data={overviewByPeriod[period]}
                  onPeriodChange={setPeriod}
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <PositionsList rows={rows as any} />
              </div>
              <aside className="lg:w-[360px] lg:shrink-0 lg:pl-6 flex flex-col gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <AccountSummary rows={rows as any} />
                <div className="rounded-[24px] border border-white/10 bg-[#121214] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.55)] lg:sticky lg:top-[calc(24px+360px)]">
                  <p className="text-[12px] uppercase tracking-[0.01em] text-[#D8D9DE]/70">
                    Actions
                  </p>
                  <p className="mt-2 text-sm text-[#D8D9DE]/70">
                    Export ledger lines or refresh the mock environment for a
                    new scenario.
                  </p>
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={exportCSV}
                      className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-xs font-semibold uppercase tracking-[0.01em] text-[#D8D9DE] transition hover:border-[#F3A233]/50 hover:text-white"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={clear}
                      className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.01em] text-red-200 transition hover:border-red-400 hover:bg-red-500/20"
                    >
                      Clear Data
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
