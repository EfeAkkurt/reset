# Reset Agents Playbook

## Mission & Product Snapshot
- Reset is a production-grade, institutional yield and insurance platform focused on transparent multi-chain yield aggregation plus Stellar/Soroban-based policy contracts (see claudedocs/ARCHITECTURAL_ANALYSIS.md and docs/SMART_CONTRACTS_IMPLEMENTATION_PLAN.md).
- The monorepo holds everything: the marketing + dashboard Next.js client (`apps/web`), protocol adapters (`packages/adapters`), reusable math/types/utilities (`packages/shared`), Soroban contracts + TypeScript SDK (`packages/contracts`, `packages/sdk`), and automation/scripts.
- Product priorities today: keep the landing + portfolio UX polished, ensure adapters stream accurate opportunity data with risk ratings, and finish the Soroban contract toolchain (CURRENT_STATUS.md notes local deploy blockers; PRODUCTION_READY_GUIDE.md + QUICK_START.md track the SDK + deployed contract health).

## Architecture & Workspace Map
- **apps/web**: Next.js 15 App + Pages router blend; key folders include `components/` (landing scenes, charts, navigation overlays, wallet widgets), `hooks/` (React Query-powered wallet/data hooks), `stores/` (Zustand stores), and `pages/` (marketing + opportunities dashboards). Tailwind + Three.js drive visuals.
- **packages/adapters** (`@adapters/core`): Clean architecture adapter manager with browser/server entry points, cache + analytics layers, and per-chain protocol clients under `protocols/`. Risk analysis engines live in `risk/` and depend on shared math.
- **packages/shared** (`@shared/core`): DTOs, enums, common math helpers, HTTP utilities, and tracing/logging primitives. Any cross-package type or util belongs here first.
- **packages/contracts**: Soroban smart contracts (`simple_insurance`, `yield_aggregator`, `treasury`) plus tests; builds target `target/wasm32-unknown-unknown/release/contracts.wasm`.
- **packages/sdk**: TypeScript client for the contracts; exposes helpers the web app or automation scripts consume.
- Reference docs: see docs/SMART_CONTRACTS_IMPLEMENTATION_PLAN.md for the phased delivery plan, CONTRACTS_SUMMARY.md for contract features, QUICK_START.md for commands, CURRENT_STATUS.md for local Soroban issues, PRODUCTION_READY_GUIDE.md for deployed assets, and claudedocs/* for protocol + risk research.

## Day-to-Day Commands
- `pnpm install` bootstraps every workspace; use `pnpm reset` if node_modules drift.
- `pnpm dev` (or `pnpm --filter reset dev`) runs the Next.js client with hot reload.
- `pnpm build` compiles packages first (`tsc` into `dist/`), then Next.js, mirroring CI expectations.
- `pnpm test` fans out Jest across workspaces; `pnpm test:adapters` scopes to protocol adapters; `cargo test` under `packages/contracts` covers Rust logic.
- Quality gates: `pnpm lint`/`lint:fix`, `pnpm format`/`format:check`, `pnpm typecheck`, and `pnpm clean` for full rebuilds. Run `soroban` commands from CURRENT_STATUS.md when touching contracts.

## Coding & Review Standards
- TypeScript-first with strict configs; React components use PascalCase, hooks/utilities camelCase, Zustand stores in `stores/useXStore.ts`.
- Styling: Tailwind + CSS modules; avoid inline magic numbers—centralize tokens in styles or design constants.
- Prettier enforces semicolons, double quotes, trailing commas, 2-space indentation; never hand-format.
- ESLint inherits from `eslint.config.mjs` and `eslint-config-next`; expect import-order, accessibility, unused-variable, and react-refresh rules.
- Commits follow Conventional Commits with scopes (`feat(web):`, `chore(adapters):`, `refactor(shared):`). PRs must outline context, solution, verification steps, linked docs/tasks, and attach screenshots for UI.

## Testing Expectations
- Jest drives frontend + adapter tests; co-locate specs as `*.test.ts(x)` or `__tests__/`.
- Adapters/shared packages must earn ≥80% statement coverage, especially around multi-chain calculations, risk scoring, and caching guards; add regression tests before touching pricing or risk math.
- Soroban contracts ship with nine passing unit tests (see QUICK_START.md). Keep `cargo test --lib` green and add cases whenever a public interface changes.
- When integrating the SDK, add smoke tests that cover `createPolicy`, `getPolicy`, `getUserPolicies`, and treasury/yield operations against the mocked or deployed contract ID from PRODUCTION_READY_GUIDE.md.

## Smart-Contract + SDK Track
- Current status: compilation/tests are ✅, but `soroban contract install/deploy` hits an `xdr processing error` tied to CLI version 21.3.0 (see CURRENT_STATUS.md). Options include Soroban Laboratory deployments, CLI upgrades, or testnet deployment flows.
- Production assets: Contract `CCZHH3REOS3222YNXMO3SHEAHFWMPEPB6VH3K7TME6P4CCJQ3H7BNXWP` lives on Stellar testnet, and the TypeScript SDK in `packages/sdk/src/index.js` is verified (PRODUCTION_READY_GUIDE.md).
- Implementation blueprint: docs/SMART_CONTRACTS_IMPLEMENTATION_PLAN.md covers phased delivery for insurance, yield aggregator, and treasury modules plus SDK + deployment automation. CONTRACTS_SUMMARY.md and DEVELOPMENT_GUIDE.md include API + struct references.

## Research & Strategy Resources
- claudedocs/ARCHITECTURAL_ANALYSIS.md rates the overall system (A-) and explains the clean architecture, adapter pattern, caching layers, and scalability considerations—use it when reasoning about trade-offs or communicating the platform story.
- claudedocs/stellar-* and defillama-* files capture market research, adapter refactor strategies, and wallet integration wins; consult them before duplicating work or proposing new connectors.
- docs/stellar-wallets-kit.md documents wallet UX with @creit-tech/stellar-wallets-kit integration feeding `apps/web`.

## Delivery Workflow Checklist
1. Align on scope and success metrics with PM/product docs above.
2. Touch only the relevant workspace; run `pnpm --filter <workspace>` commands to limit blast radius.
3. Keep adapters deterministic—never call live APIs in tests; use fixtures + caches under `packages/adapters/src/cache`.
4. Update documentation (`docs/`, `claudedocs/`, or inline README) whenever you add features; AGENTS.md reflects the canonical workflow.
5. Before a PR: run format, lint, typecheck, tests (plus `cargo test` if contracts touched) and capture verification steps/screenshots in the PR template.

Use this playbook as the single source of truth for how agents should navigate the Reset repo. When in doubt, read the linked docs, sync with product on risk/UX implications, and prefer incremental, well-tested changes.
