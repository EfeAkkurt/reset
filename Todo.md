# ROLE

You are:

- a world-class product designer,
- a 0.1% level UI/UX architect,
- a senior front-end art director,
- and a prompt engineer specialized in fintech dashboards.

You design **institutional-grade, premium, gold-accented, engineered** interfaces
that look like:
BlackRock, Stripe Treasury, Coinbase Institutional, Quant, LayerZero Labs.

---

# GOAL

Redesign the **RESET / Portfolio Page** with:

- ultra-high clarity,
- premium institutional fintech identity,
- consistent visual hierarchy,
- perfectly aligned grids,
- extremely polished micro-interactions,
- and **mock portfolio data integrated everywhere**.

The final redesign must feel like a **wealth-management dashboard**, not a DeFi toy.

---

# THEME (STRICT)

Use Reset brand tokens:

- **Gold**
  - `--gold-500: #E0912C`
  - `--gold-400: #F3A233`
  - `--gold-600: #C77E25`
  - `--alpha-gold-16: rgba(255,182,72,0.16)`

- **Background**
  - `--bg: #0A0A0A`
  - `--bg-soft: #121214`
  - `--neutral-900: #121214`
  - `--neutral-800: #1A1B1E`
  - `--neutral-600: #2B2C30`

- **Typography**
  - `--text: #FFFFFF`
  - `--text-2: #D8D9DE`
  - Display: Clash Display Black / Eurostile Next Pro Heavy (900)
  - Body: Clash / Inter Medium (500–650)
  - RESET signatures must use:
    - uppercase,
    - geometric condensed heavy,
    - gold underline,
    - subtle internal matte shadow.

Every surface uses:

- matte industrial engineering feel
- soft inner shadows
- thin gold borders (opacity 0.16)
- zero saturation, zero neon
- controlled glow only on gold highlights

---

# PAGE STRUCTURE (MANDATORY)

## 1. **AccountSummary (Top Right Sticky Box)**

A compact, premium info box with:

- Total Principal (USD)
- Weighted Avg APR (%)
- Estimated Total Return (30D)

Style:

- dark neutral-800 box
- 1px translucent gold border
- numbers in 26–32px
- labels in 12px caps
- small gold underline on hover

Mock data example:

- Total Principal: `$7,640.00`
- Weighted APR: `12.60%`
- 30D Est. Return: `$58.46`

---

## 2. **PortfolioOverview (Main Chart Card)**

A wide **institutional chart card** with:

- matte dark-neutral background
- soft gold border
- subtle inner glow at top

### Chart Visual Requirements

- **Total Portfolio Value** = purple/magenta gradient area
- **Net PnL** = blue line
- **24H Change** = green micro-bars
- **X-Axis** = Date (past 30 days)
- **Y-Axis** = USD scale with soft grid lines

### Chart Header

Three metric badges:

- Total Portfolio
- Net PnL
- 30D Change

### Time Selector

Buttons:

- **24H**
- **7D**
- **30D** (selected by default)

Styled with:

- pill buttons,
- gold glow on hover,
- selected state = gold ring, black text, soft gold inner-light.

Mock data:

- Total: `$79,199`
- Net PnL: `-$190`
- 30D %: `-1.27%`

---

## 3. **PositionsList (Grid of Position Cards)**

Each card must include:

### TOP SECTION

- Protocol logo (mock “Z” bubble)
- Token/pair (STX, AEUSDC)
- Risk Badge:
  - Low = green
  - Medium = golden yellow
  - High = red
- Micro TVL label

### MIDDLE SECTION

- Deposited amount (USD)
- Current value (USD)
- APR/APY
- TVL ($M)
- Reward token (ZEST est.)

### CHART SECTION

14-day mini performance chart:

- faint gradient area
- soft line stroke
- no grid lines
- light gold bottom border

### BOTTOM SECTION

Buttons:

- **Details**
- **Deposit**
- **Withdraw**

Style:

- industrial
- minimal
- clean
- not rounded too much

Mock positions:

1. STX / ZEST – Low risk
2. AEUSDC – Medium risk
3. STX second slot – Medium
4. AEUSDC second slot – Low

Examples:

- Deposited: `$4100`
- Current: `$4186`
- APR/APY: `13.4% / 21.0%`
- TVL: `$4.78M`

---

## 4. **Actions Panel (Right Side)**

Buttons:

- Export CSV
- Clear Data

Style:

- sharp
- 1px gold border
- hover = gold glow (2%)
- text = uppercase, tracking +2

---

## 5. **Empty State (If No Positions)**

- minimal gold-lined illustration
- message:
  “Your portfolio is empty.”
- CTA:
  “Explore Opportunities”
  with gold pill button

---

# LAYOUT RULES

- Everything sits on a **12-column grid**.
- Main chart spans 9 columns (left).
- AccountSummary + Actions spans 3 columns (right).
- PositionsList uses responsive 3-col → 2-col → 1-col layout.
- Spacing is strict:
  - 32px vertical rhythm
  - 24px internal card padding

- Background uses:
  - faint gold dust particles
  - ultra-subtle vignettes
  - barely-visible grid overlay (2–3% opacity)

---

# OUTPUT FORMAT

Deliver:

- Full redesign description
- Updated component structure
- Suggested React/Next naming
- Figma-ready spec of spacing, layout, colors, typography, and visual hierarchy
- Example mock JSON data
- Interaction guidelines (hover, active, transitions)
- Optional: CSS tokens & Tailwind config extension

No filler. No explanation of what a dashboard is.  
Just the full professional UI/UX redesign as if for an institutional client.
