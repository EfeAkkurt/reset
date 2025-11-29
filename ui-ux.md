# Portfolio Experience Master Plan

This document lays out a comprehensive UI/UX vision for transforming the Portfolio page into a high-performing, emotionally resonant, and highly interactive experience. The goal is to delight Stellar-first investors, encourage deeper engagement, and provide crystal-clear insights that drive confident actions.

---

## 1. Product Vision & Principles

### 1.1 North Star Statement
Create a cinematic, data-rich Stellar portfolio hub that greets users with personality, surfaces actionable insights instantly, and keeps them in flow through responsive interactions, animations, and educational cues.

### 1.2 Success Metrics
- **Engagement**: ≥25% uplift in time-on-page and interactions with insights/watchlist.
- **Actionability**: ≥15% increase in compare/add-to-portfolio actions initiated from the page.
- **Confidence**: ≥80% of tested users report “I know my next move” (usability studies).
- **Delight**: ≥60 NPS for visual/motion experience.

### 1.3 Design Principles
1. **Narrative Structure** – move users from story (hero) → status (KPIs) → action (positions/insights).
2. **Progressive Clarity** – progressive disclosure of complex controls.
3. **Motion with Meaning** – animations inform status changes, not just decoration.
4. **Personalized Encouragement** – reflect achievements, watchlists, and contextual prompts.
5. **Trust Through Transparency** – persistent data-source indicators, tooltip explanations, and contextual education.

---

## 2. User Personas & Jobs

| Persona | Goals | Pain Points Today | Opportunities |
| --- | --- | --- | --- |
| **Yield Strategist** | Monitor returns, rebalance quickly, compare opportunities. | Flat data tables, no quick actions, unclear statuses. | Rich cards, compare shortcuts, advanced analytics. |
| **Explorer / Newcomer** | Understand portfolio health and learn strategies. | Overwhelmed by raw metrics, no onboarding. | Guided tooltips, demo mode messaging, “Why it matters” panels. |
| **Mobile-on-the-go** | Quick snapshot, respond to alerts. | Desktop-first layout, hidden actions. | Responsive filter drawer, floating CTA dock, haptics-ready transitions. |

---

## 3. Page Structure Overview

1. **Hero Dashboard**
   - Cinematic Stellar gradient background with particle animation tied to wallet status.
   - Personalized greeting (“GM, Orion”) + streak badge.
   - Key balance stats (Total Portfolio, 24h change, available cash) with animated counters.
   - Primary CTAs: `Connect Wallet`, `Add Alert`.

2. **Status & KPI Bar**
   - Glassmorphic cards showing Net Yield Velocity, Allocation Mix, Risk Exposure.
   - Quick toggles for timeframe (24h / 7d / 30d) with subtle sliding indicator.
   - On-hover descriptions referencing “Why this matters”.

3. **Portfolio Health Stack**
   - Three stacked cards with depth effect.
   - Each card has progressive disclosure:
     - Front: key metric (e.g., Yield Velocity).
     - Expand interaction: reveal supporting chart or narrative insight.
   - Micro animations (card tilt, parallax when scrolling).

4. **Positions Experience**
   - Hybrid layout:
     - **Summary carousel**: hero cards for top-performing positions, each with liquidity gauge, reward icons, quick actions.
     - **Detailed table**: slide-up sheet containing sortable columns, inline sparklines, risk badges.
   - Entire cards are clickable; quick actions include `Rebalance`, `Add to Compare`, `View History`.
   - Compare bar floats at the bottom after 1+ selections.

5. **Timeline & Activity**
   - Animated vertical timeline with curved path.
   - Entries grouped by day, color-coded for deposits/withdrawals/rewards/alerts.
   - Inline filters (chips) that persist as you scroll.
   - Each event expands to show analytics (“+2.3% APY from AQUA incentives”).

6. **Insight Lab**
   - Scenario cards with “What-if” toggles (e.g., “What happens if you move 10% to AQUA?”).
   - Chart types:
     - Radar chart for Risk Diversification.
     - Waterfall for Yield Contributions.
     - Range slider for IL simulations.
   - Tooltips with educational copy (plain language, comparisons).

7. **Engagement Layer**
   - Badges for achievements (Diversifier, Early Lumen, Trend Rider).
   - Watchlist module with inline onboarding (“Pick up to 5 pools to follow”).
   - Notifications panel showing alerts and suggested actions.

8. **Footer Action Dock**
   - Floating dock with glass effect.
   - Buttons: `Compare`, `Add Alert`, `Support`.
   - Subtle bounce animation when new alerts arrive; respects reduced-motion mode.

9. **System Status Pill**
   - Persistent pill (top-right) showing `Live Data` or `Demo Mode`, last sync time, and manual refresh.

---

## 4. Motion & Interaction Guidelines

### 4.1 Animation Language
- **Hero Background**: slow-moving Stellar particle field, color-shifting on wallet connection.
- **Counters & Stats**: number increment from previous values; easing `cubic-bezier(0.34, 1.56, 0.64, 1)` to feel snappy yet smooth.
- **Cards**: layered parallax when cursor moves, subtle rotation on hover.
- **Timeline**: entries slide in with slight overshoot; connectors draw in as you scroll.
- **Dock**: springs-in when first needed; icons pulse when actions are available.

### 4.2 Accessibility
- Respect `prefers-reduced-motion`; switch to fades.
- Maintain 4.5:1 contrast minimum; status colors paired with icons.
- Keyboard navigability: focus outlines, logical tab order, focus trap for modals.

---

## 5. Component-Level Specifications

### 5.1 Hero Panel
| Element | Details |
| --- | --- |
| Background | CSS grid gradients + Canvas particles responding to wallet connection (color shift). |
| Title | Dynamic greeting (`GM`, `GN`) + custom name; fallback to friendly message. |
| Stats | `Total Balance`, `24h Δ`, `Available Liquidity`; counters animate from previous value. |
| CTAs | Primary: `Connect Wallet` or `Deposit`. Secondary: `Add Alert`. Ghost: `Share Snapshot`. |
| Streak Badge | Badge with flame icon, short tooltip (“4-day green streak”). |

### 5.2 Health Stack Cards
| Card | Content | Interaction |
| --- | --- | --- |
| Yield Velocity | Gauge ring + sparkline; description (“+8.1% vs last week”). | Click to expand into modal detail (bar chart). |
| Allocation Mix | D3 donut; color-coded by strategy. | Hover reveals percentages; click to drill into each strategy. |
| Risk Mix | Tri-segment bar (Low/Medium/High). | Hover reveals IL risk notes; CTA `Optimize risk`. |

### 5.3 Positions Carousel
| Field | Description |
| --- | --- |
| Header | Token avatars + chain label. |
| Metrics | APR/APY, TVL, share of portfolio, trailing 7d sparkline. |
| Quick Actions | Buttons (icon + label) for `Rebalance`, `Compare`, `Details`. |
| Interaction | Drag carousel; snapping to center highlight with scaling animation. |

### 5.4 Detailed Table
| Column | Details |
| --- | --- |
| Asset | Protocol + pair + chain pill. |
| Allocation | Percentage + numeric USD. |
| Performance | APR/APY + change indicator (arrow). |
| PnL | Absolute + percentage. |
| Risk | Badge with tooltip that lists drivers (liquidity, IL). |
| Actions | Inline icons (Rebalance, Add Alert). |

### 5.5 Timeline
| Feature | Design |
| --- | --- |
| Layout | Center spine with cards alternating sides; connectors curved. |
| Entries | Icon + title + summary + micro chart when relevant. |
| Filters | Sticky chips (Deposits, Withdrawals, Rewards, Alerts). |
| Date Groups | Sticky header for each day; reminiscent of journal. |

### 5.6 Insight Lab
| Module | Detail |
| --- | --- |
| Scenario Cards | “Move 10% from Vault A to AQUA”; slider to adjust percentage, immediate projected return. |
| Charts | D3-based radar, waterfall, and stacked bars with transitions. |
| Action CTA | `Apply Strategy`; opens confirm modal or pre-fills deposit flow. |

### 5.7 Engagement Widgets
| Widget | Description |
| --- | --- |
| Watchlist | Drag-and-drop to reorder; show price/yield alerts. |
| Achievements | Card slider with confetti animation when unlocked. |
| Alerts | Notification stack with swipe-to-dismiss; persistent icon in dock. |

### 5.8 Footer Dock
| Button | Interaction |
| --- | --- |
| Compare | Expands compare drawer; badge shows count. |
| Alert | Opens modal with pre-filled asset info. |
| Support | Live chat / docs link. |

---

## 6. Engagement & Personalization

1. **Recently Viewed** – grid of last 3 opportunities interacted with; shortcuts to revisit.
2. **Saved Filters/Views** – drop-down to switch between personal setups (e.g., “Low Risk Income”).
3. **Progress Indicators** – highlight new events (“2 new Stellar pools since last visit”).
4. **Smart Nudges** – contextual toasts (“300 USD idle, deploy to Anchor Vault”).
5. **Achievements** – celebrate actions (e.g., “First Rebalance”, “Early Adopter”).
6. **Social Proof** – optional feed snippet (“Top investors increased AQUA exposure +5%”).

---

## 7. Data & Status Transparency

- Persistent status pill: `Live Data • Synced 3m ago` or `Demo Mode • Mock`.
- Manual refresh button near status pill; lifts hero animation on refresh.
- Empty/Loading states:
  - **Skeletons** mimic cards/tables.
  - **Empty**: illustration + guidance + CTA (“Add your first position”).
  - **Error**: friendly copy, “Retry” button, support link.
- Educational tooltips for key metrics (APR vs APY, IL risk, yield drivers).

---

## 8. Responsive & Accessibility Strategy

### 8.1 Responsive Layout
- ≤1024px: convert health cards into horizontally scrollable chips.
- ≤768px: hero stats stack; filter controls move into bottom drawer.
- Timeline collapses into stacked cards; footer dock becomes bottom nav.

### 8.2 Accessibility
- Keyboard accessible carousels (arrow keys) and modals (focus trap).
- Haptic-ready interactions for native wrappers.
- Alt text for illustrative media.
- Option to disable background animations.

---

## 9. Implementation Roadmap

| Phase | Scope | Deliverables |
| --- | --- | --- |
| **1. Discovery & Wireframes** | Audit current page, define flows, low-fi wireframes. | Wireframe deck, persona recap, success metrics. |
| **2. Motion-first Visual Design** | High-fidelity screens (desktop + mobile), motion specs. | Figma design system updates, ProtoPie/Lottie prototypes. |
| **3. Component Implementation** | Hero, status pill, health cards, positions modules. | Reusable React components, Storybook entries. |
| **4. Insights & Engagement** | Insight lab, timeline, achievements, watchlist. | D3/chart wrappers, state management plan. |
| **5. Testing & Iteration** | Usability tests, performance optimization. | Test reports, iteration backlog, final polish. |
| **6. Launch & Monitoring** | Release, track metrics, plan incremental improvements. | Launch checklist, instrumentation dashboards. |

---

## 10. Validation Plan

1. **Prototype Testing** – 6 participants (strategist + explorer mix) for flow comprehension.
2. **A/B Experiments** – hero CTA vs control, card quick actions vs button-only.
3. **Telemetry** – track compare additions, insight clicks, timeline filter usage.
4. **Feedback Channels** – in-product survey triggered after interactions.
5. **Iteration Cadence** – monthly design review, quarterly deep-dive retrospective.

---

## 11. Tooling & Handoff

- **Design**: Figma (Auto Layout, variants), ProtoPie for motion, Lottie for hero animations.
- **Implementation**: Tailwind + Framer Motion, D3/Recharts for data viz, Zustand/React Query for state.
- **Documentation**: Storybook with motion guidelines, Notion page for status updates.

---

## 12. Summary

This plan transforms the Portfolio page into an immersive, data-intelligent experience featuring:
- A cinematic hero tied to status and action.
- Progressive, delightful analytics that balance clarity with flair.
- Highly interactive positions management with compare/watchlist flows.
- Personalized engagement loops, achievements, and contextual education.
- Robust motion and accessibility standards, plus a pragmatic implementation roadmap.

Delivering this vision will elevate user satisfaction, encourage strategic activity, and cement the Portfolio page as the most captivating touchpoint in the Stellar yield journey.
