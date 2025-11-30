You are a senior product designer + front-end engineer improving the **opportunity detail hero** for the RESET DeFi app (Stellar yield & insurance). You will ONLY touch the hero container at the top of the page; all sections below (Multi-layer analytics, chart, deposit simulator, risk & insurance) stay exactly as they are.

## Context

- Stack: Next.js + React + Tailwind + Framer Motion.
- Theme colors (already defined as CSS variables / Tailwind tokens):
  - `--gold-500 #E0912C` (primary highlight)
  - `--gold-400 #F3A233`, `--gold-600 #C77E25` (lighter/darker accents)
  - Backgrounds: `--bg #0A0A0A`, `--bg-soft #121214`, `--neutral-900 #121214`
  - Text: `--text #FFFFFF`, `--text-2 #D8D9DE`
  - Surfaces: `--neutral-800 #1A1B1E`, `--neutral-600 #2B2C30`
  - Translucent gold: `--alpha-gold-16 rgba(255,182,72,0.16)`

- Current hero shows (too large / bulky):
  - BIG title: `HORIZON POOLS — XLM / EURC`
  - Under it: chain pill, risk-level pill, “updated X min ago” pill, and one-line description.
  - On the right: three KPI cards (APR, APY, TVL) stacked vertically (keep these, just visually tighten).
- Visual inspiration: compact institutional DeFi hero stripes with typography blocks + KPI cards (Stellar.org stats strip, Galaxy DeFi dashboard hero, award-level ETHGlobal dashboards).

Your task: **turn this hero into a tight, cinematic, 2-column band** that feels premium and NOT oversized, with beautiful micro-typography and subtle motion.

---

## Layout & Composition

1. **Overall band**
   - Constrain hero height: ~320–360px on desktop (no more full-screen hero).
   - Wrap everything in a single rounded card sitting on the dark background:
     - `bg-[color:var(--neutral-900)]`
     - `rounded-[32px]`
     - `border border-[color:var(--alpha-gold-16)]`
     - `shadow-[0_0_80px_rgba(0,0,0,0.75)]`
     - Inner padding: `px-12 py-10` on desktop, down to `px-6 py-8` on tablet.

   - Apply a very subtle diagonal gold vignette:
     - Background overlay: `radial-gradient(circle at 0% 0%, rgba(224,145,44,0.14), transparent 55%), radial-gradient(circle at 100% 100%, rgba(224,145,44,0.08), transparent 50%)`.

   - Layout: 2 columns in a 12-column grid.
     - Left: 7–8 columns (title + descriptor stack).
     - Right: 4–5 columns (KPI cards).
     - On ≤ md breakpoint, stack vertically (left on top, KPIs below with full width).

2. **Left column (title block)**
   - Title:
     - Replace the current huge H1 with a more controlled display style:
       - Font: same family as main app (e.g. `Inter`/`Satoshi`), but use `font-semibold`.
       - Size: `text-[40px] md:text-[46px] leading-[1.05]`.
       - Transform: **Title Case**, not all caps: `"Horizon Pools — XLM / EURC"`.
       - Add a hairline underline aligned with the first character, not the full width:
         - 72px width, `h-[2px]`, `bg-[color:var(--gold-500)]`, `mt-3`.

   - Meta pills row:
     - One row under the title, with three micro-pills:
       - `STELLAR`, `MEDIUM RISK`, `UPDATED 4M`.
       - Style:
         - `inline-flex items-center gap-2 rounded-full bg-[color:var(--neutral-800)]/80 border border-[color:var(--alpha-gold-16)] px-3 py-[6px] text-[11px] tracking-[0.16em] uppercase text-[color:var(--text-2)]`.
         - Risk pill color accent via a small dot:
           - For medium risk: left dot `w-[6px] h-[6px] rounded-full bg-[color:var(--gold-500)]`.

       - Space pills with `gap-2` and let them wrap if needed.

   - Description:
     - One concise line, max 2 lines on desktop:

       > “Fiat-onchain pool optimized for European corridors with streaming fees.”

     - Style: `mt-4 text-[14px] leading-relaxed text-[color:var(--text-2)] max-w-xl`.

3. **Left column – micro “insight row” under description**
   - Add a subtle three-item micro row to anchor the analytics below, but keep minimal:
     - Items: `Chain • Stellar`, `Risk band • Medium`, `Telemetry • Live`.
     - Style:
       - `mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.16em] text-[color:var(--text-2)]/70`.
       - Each item starts with a 6px gold dot: `before:content-[''] before:w-[6px] before:h-[6px] before:rounded-full before:bg-[color:var(--gold-500)] before:mr-2 inline-flex items-center`.

---

## Right column (KPI stack)

4. **Card grid**
   - Keep APR, APY, TVL but compress their cards:
     - Use a 3-row vertical stack inside one rounded container:
       - Parent container: `bg-gradient-to-b from-[color:var(--neutral-800)]/96 to-[color:var(--neutral-900)]/96 rounded-[24px] border border-[color:var(--alpha-gold-16)] p-5 flex flex-col gap-3 w-full max-w-[260px] ml-auto`.
       - Each KPI row: `flex justify-between items-baseline`.

   - Typography:
     - Label (APR / APY / TVL):
       - `text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-2)]/80`.

     - Value:
       - `text-[22px] leading-none font-semibold text-white`.
       - Add a small monospaced feel: e.g. `font-[family-monospace]` for the digits only (wrap digits in `<span className="font-mono">`).

     - Delta chips (already present, keep them):
       - Turn them into small right-aligned pills:
         - `inline-flex items-center rounded-full bg-[rgba(12,181,120,0.12)] text-[11px] text-[#4ADE80] px-2 py-[3px]` for positive.
         - Keep orange variant for TVL change.

5. **Micro label at bottom of KPI stack**
   - Under the KPI container, add a micro-caption to hint at live data:
     - Text: `Real-time telemetry from DeFiLlama & Stellar pools.` (mock for now).
     - Style: `mt-3 text-[11px] text-[color:var(--text-2)]/60 text-right`.

---

## Motion & Interaction (Framer Motion)

6. **Hero card entrance**
   - Wrap the entire hero band in a `motion.section`:
     - Initial: `{ opacity: 0, y: 24, scale: 0.98 }`.
     - While in view: `{ opacity: 1, y: 0, scale: 1 }` with:
       - `transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}` (easeOutExpo-like).

7. **Hover parallax**
   - On desktop, the hero card should respond subtly to cursor:
     - Use `whileHover` on the parent:
       - `whileHover={{ y: -4, boxShadow: "0 24px 80px rgba(0,0,0,0.85)" }}`.
       - Inside, the KPI container has a small parallax shift: `whileHover={{ y: -2 }}` with a slight gold glow: increase border alpha and add `shadow-[0_0_40px_rgba(224,145,44,0.28)]`.

8. **Metric “breathe” animation**
   - On first render, animate KPI values with a subtle scale-up + fade:
     - Use `motion.div` for each KPI row:
       - Initial: `{ opacity: 0, y: 8 }`.
       - Animate sequentially with `transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}`.

   - Do **not** animate them continuously; just on mount to avoid distraction.

---

## Implementation Notes

- **Do not** change:
  - Navbar, top ticker, the big “Multi-layer analytics” section, chart logic, deposit simulator, risk/insurance section.
  - Existing data bindings (APR/APY/TVL numbers, risk level, timestamps, etc.).

- **Do** expose the hero as a clean React component:
  - `OpportunityHero` taking props:
    - `protocolName`, `pairLabel`, `chain`, `riskLevel`, `updatedAgo`, `description`, `apr`, `apy`, `tvl`, `deltas`.

  - Use Tailwind utility classes reflecting the specs above.
  - Respect responsiveness: at `md` and below, hero becomes a vertical stack:
    - Title + meta + description first.
    - KPI stack full-width under it, centered but aligned to the same grid padding.

- Ensure the final result feels:
  - **Institutional** (like Stellar.org stats and Galaxy DeFi case study),
  - **Compact** (no more oversized billboard),
  - Clearly connected to the analytics section below (colors and typography match).

Render the updated hero and adjust spacing until the top of the chart feels visually “locked” to the hero card, with ~40–48px vertical gap.
