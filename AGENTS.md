# Repository Guidelines

## Project Structure & Module Organization
PNPM manages the workspaces. `apps/web` is the Next.js front end: the App Router code lives under `app/`, shared UI and 3D assets live in `components/` and `public/`, and wallet/data hooks are in `hooks/`. Domain logic is split into `packages/adapters` for protocol fetching and `packages/shared` for reusable types, math, and DTO helpers; both compile to `dist/` via `tsc` and are imported through the `@adapters/core` and `@shared/core` aliases defined in `tsconfig.base.json`. Reference notes sit in `docs/`, whereas automation and one-off scripts go in `scripts/`.

## Build, Test, and Development Commands
`pnpm install` primes every workspace. `pnpm dev` (or `pnpm --filter reset dev`) runs the web client with hot reload. `pnpm build` first compiles the packages, then Next.js, mirroring CI. Run `pnpm test` for the Jest suite, and `pnpm test:adapters` when targeting only adapters. `pnpm lint`/`pnpm lint:fix` enforce ESLint rules, `pnpm format` applies Prettier, and `pnpm typecheck` surfaces TS issues before runtime. Use `pnpm clean` if you need to drop build outputs.

## Coding Style & Naming Conventions
Code is TypeScript-first with strict TS config. Components follow PascalCase (`components/HeroChart.tsx`), hooks/utilities use camelCase (`hooks/useWalletConnection.ts`), and Zustand stores go under `stores/` with the `useXStore` name. Prettier enforces semicolons, double quotes, trailing commas, and 2-space indentation; do not hand-format files. ESLint inherits from `eslint.config.mjs` and `eslint-config-next`, so expect import-order, accessibility, and unused-variable checks.

## Testing Guidelines
The project relies on Jest for React components and business logic. Co-locate new cases beside the source file as `*.test.ts(x)` or under `__tests__/`. Adapter and shared packages currently stub their test scripts; when you add functionality, bootstrap real suites and wire them into the workspace `test` command. There is no CI coverage gate yet, but aim for ≥80% statement coverage on new adapters, hooks, and pricing flows, and include regression tests whenever you touch multi-chain calculations.

## Commit & Pull Request Guidelines
Git history follows Conventional Commits (`feat:`, `refactor:`, `chore:`). Include a scope such as `feat(web):` or `refactor(adapters):` so reviewers immediately know the impact area. PR descriptions should state context, the solution, verification commands, and follow-up tickets. Link issues or hackathon tasks, attach screenshots for UI updates, and call out risky migrations (database, wallets, contracts). Rebase against `main` before requesting review and keep commits focused so revert strategies stay simple.
