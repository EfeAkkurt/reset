## 1. External Data & Tooling – What You’ll Actually Use

### 1.1. Core yield + TVL data: DeFiLlama

**Why:** You get real Stellar pools (Blend etc.), TVL, APY, chain, and per-pool history without touching raw chain data yourself.

**Relevant pieces:**

* **Global API docs** – available endpoints for protocols, chains, TVL, yields, etc.([DefiLlama API Docs][1])
* **LLM integration guide** – shows base URLs, free vs pro endpoints, and path structure (TVL, prices, yields, etc.).([DefiLlama API Docs][2])
* **Yields API** – `https://yields.llama.fi/pools` (open, no key).

  * Response includes fields like `project`, `chain`, `tvlUsd`, `apy`, etc. You fetch all and **filter in backend** for `chain === "Stellar"` and `project` in `{ "Blend", "Blend Pools", "Blend Pools V2" }`.([GitHub][3])
* **Stellar chain + Blend pages** – confirm Blend is on Stellar, pull protocol slugs, etc.([DeFi Llama][4])
* **Yields metrics overview** – confirms that yields data has APY, TVL, etc., and is updated hourly.([DeFi Llama][5])

**What you must check in docs during hackathon:**

* Exact JSON schema for `https://yields.llama.fi/pools`:

  * Confirm field names: `tvlUsd`, `apy`, maybe `apyBase`, `apyReward`, etc.
  * Confirm presence of `pool`, `symbol`, `chain`, `project`, possible `apyPct30d` etc.
* How to **get per-pool history**:

  * Use per-pool page (e.g. a Blend pool) and inspect its `.csv` link that has daily **TVL + APY** time series for 30/90d.([DeFi Llama][6])
  * Decide one format and stick to it (CSV vs JSON).
* Verify that yields endpoints you use are **free**, not `pro-api.llama.fi` only.

> **Reality check:** DeFiLlama **does not provide `participants` (wallet count)** out-of-the-box. We’ll treat `Participants` as:
>
> * either a **mock/derived field** for demo, or
> * `null` with a clear label “N/A (not available in public APIs)”.

### 1.2. Stellar chain / Blend metadata (context + slugs)

* **Stellar chain metrics on DeFiLlama** – lists top Stellar DeFi protocols, including Blend. Good for discovering protocol slugs and showing “we’re actually on Stellar DeFi, not random EVM stuff.”([DeFi Llama][7])
* **Blend protocol pages** – confirm protocol slug, and see per-pool yields/TVL which match what you get from the API.([DeFi Llama][4])
* **Blend docs & site** – background reading, to correctly tag Blend pools as “lending”.([stellar.org][8])

You only need these for: naming, descriptions, and mapping Llama `project` → your internal `protocolType` (e.g. “lending”).

### 1.3. Horizon liquidity pools (optional / stretch)

If you want a **native Stellar AMM pool** as an extra real yield option:

* **Horizon liquidity pools API** – `/liquidity_pools` and `/liquidity_pools/{id}` give reserves, fee, etc.([developers.stellar.org][9])

For MVP you can skip volume/APY derivation from Horizon, but if you have time:

* Use pool reserves + fee + trade history to approximate APY,
* Or just flag these pools as **“non-APY demo pools”** and only show TVL.

### 1.4. SDKs you’ll probably touch from backend

Even though we’re not writing contract logic here, backend should be ready to:

* Use **`@stellar/stellar-sdk`**: main JS SDK for Horizon + Soroban RPC.([stellar.github.io][10])
* Optionally, use **TypeScript bindings generated from contract WASM** via `soroban-spec-typescript` later, to get typed calls.([Docs.rs][11])

Backend stack (your choice, but I’d standardize):

* **Runtime:** Bun
* **HTTP framework:** Hono
* **DB:** SQLite via Drizzle or Prisma (Drizzle is lighter)
* **HTTP client:** native `fetch` is enough

---

## 2. 48-Hour Backend Plan (One Dev, Hackathon Mode)

I’ll break it into 6 blocks. You can slide the hours a bit, but **don’t steal time from Phase 2 & 3** — that’s your core.

### Phase 0 (Hour 0–3) – Project Skeleton & Infra

**Goals:** Have a running Bun + Hono API with SQLite wired and a clear module structure.

Tasks:

* Create monorepo or backend folder:

  * `apps/backend` or `packages/backend`.
* Init Bun + TS, add deps:

  * `hono`, `zod`, `drizzle-orm` (or Prisma), `better-sqlite3` or equivalent, `dotenv`.
* Setup Hono server:

  * `/health` endpoint,
  * central error handler, logging middleware.
* Setup SQLite:

  * Connection module,
  * Basic migration infra (`drizzle-kit` or your own).
* Decide folder structure:

  * `src/modules/defillama/`
  * `src/modules/risk/`
  * `src/modules/insurance/`
  * `src/routes/`

Deliverable: `bun run dev` gives you a working server with `/health`.

---

### Phase 1 (Hour 3–8) – API Research Spike + Data Model

**Goals:** Understand DeFiLlama data shape for Stellar, and lock DB schema.

Tasks:

1. **DeFiLlama yields spike**

   * Write a tiny script:

     * `fetch('https://yields.llama.fi/pools')`,
     * log a few entries with `chain === "Stellar"`.([GitHub][3])
   * Confirm:

     * fields for APY/APR (**use `apy` as APY_now**),
     * TVL USD field (`tvlUsd` → **TVL_now**),
     * any historical / meta fields you can reuse.

2. **Find a couple of Blend pools**

   * Filter the array by `project === "Blend"` or `"Blend Pools V2"`.([DeFi Llama][4])
   * Pick 1–3 pools to mark as **“primary real sources”**.

3. **Historical data route**

   * Open one Blend pool page on DeFiLlama yields UI and inspect the **“.csv” link** for “Supply APY” and “TVL”. You’ll see daily `date`, `tvl`, `apy` style rows.([DeFi Llama][6])
   * Note the URL pattern, you’ll parse this CSV later for 30/90d history.

4. **DB schema v1**

   * `pools` table:

     * `id` (uuid)
     * `external_id` (llama pool id / key)
     * `project`, `chain`, `symbol`, `name`
     * `tvl_now`, `apr_now`, `apy_now`, `vol_24h` (nullable, DeFiLlama may not give volume)
     * `is_mock`, `protocol_type` ("lending", "amm")
   * `pool_metrics_daily`:

     * `id`, `pool_id`, `date`
     * `tvl_usd`, `apr`, `apy`, `volume_usd`
   * Optional `risk_snapshot` table if you want to persist risk scores, otherwise compute on the fly.

Deliverable: migrations created + DB structure committed.

---

### Phase 2 (Hour 8–16) – Data Ingestion Layer

**Goals:** Have scripts + service to populate SQLite with real Stellar yield pools + minimal history.

Tasks:

1. **DeFiLlama client module**

   * `DefillamaClient` with:

     * `fetchPools()` → returns array from `https://yields.llama.fi/pools`.
     * Helper `getStellarPools()` → filter by `chain === "Stellar"`.
   * Add simple runtime validation with `zod` to avoid crashing on weird rows.

2. **Pool import job**

   * Script `scripts/import-pools.ts`:

     * Fetch Stellar pools,
     * Filter for desired protocols: `Blend`, `Blend Pools`, `Blend Pools V2` first.([DeFi Llama][4])
     * Map into `pools` table rows.
     * For now, set `VOL_24h` to `null` if not available; same for `Participants`.
   * Mark one special row as `is_mock = true` for your **mock yield option**.

3. **Historical import v1**

   * For each selected pool:

     * Hit the DeFiLlama per-pool `.csv` for Supply APY / TVL.

       * Parse last **90 days** into `pool_metrics_daily`.
     * If DeFiLlama doesn’t expose volume in history:

       * Use `null` and maybe approximate constant volume later, or mark as missing.
   * Build a small helper:

     * `getPoolHistory(poolId, days: 7|30|90)` → aggregated view from DB.

4. **(Optional) chain-level TVL sanity check**

   * Call DeFiLlama’s chain TVL for Stellar and compare with sum of pools for Blend to see if numbers make sense.([GitHub][12])

Deliverable: `bun run import:pools` fills DB with real Blend pools and 90d history.

---

### Phase 3 (Hour 16–26) – Risk Engine + Insurance Pricing

**Goals:** Implement your existing risk + insurance formulas in TS, tested with fixtures.

Tasks:

1. **Risk model module**

   * `src/modules/risk/riskEngine.ts`:

     * `computeRiskScore(pool, history)` – uses:

       * `APR_now`, `APY_now`
       * volatility over 30/90d (stddev on APY or TVL)
       * maybe protocol type (lending vs AMM)
     * `bucketRisk(score)` → `LOW | MEDIUM | HIGH`.
   * Load a couple of fixture pools and **hard-code expected scores** from your doc, add unit tests.

2. **Insurance pricing**

   * `src/modules/insurance/pricing.ts`:

     * Inputs:

       * pool risk score / bucket
       * `depositAmount`
       * optional `lockPeriodDays`
     * Outputs:

       * `premiumAmount`
       * `coverageAmount`
       * `suggestedLockPeriod`
   * Again, port logic from doc and test with fixtures.

3. **Integration with DB**

   * Service function:

     * `getPoolWithRisk(poolId)`:

       * fetch `pool` + `history` from DB,
       * attach `riskScore`, `riskBucket`, `defaultInsuranceQuote` (for a reference deposit amount, e.g. $1k).
   * Don’t over-optimize, compute on request; DB is small.

Deliverable: You can run a simple script `bun run risk:demo` and see nice JSON with risk + insurance for a Blend pool.

---

### Phase 4 (Hour 26–36) – Public REST API

**Goals:** Expose everything via a clean REST surface for the frontend + demo.

Endpoints to implement:

1. `GET /pools`

   * Returns **list of pools**, each with:

     * core metrics: `APR_now`, `APY_now`, `TVL_now`, `VOL_24h` (or null),
     * `riskBucket`,
     * a **default insurance quote** for a standard notional (e.g. $1k).
   * Query params:

     * `?protocolType=lending`
     * `?chain=Stellar` (hardcoded for now)
     * `?riskBucket=LOW|MEDIUM|HIGH`.

2. `GET /pools/:id`

   * Returns:

     * pool detail,
     * current metrics,
     * aggregated history for `7d`, `30d`, `90d` (computed server-side from `pool_metrics_daily`),
     * risk details (score, bucket, subcomponents if you want).

3. `GET /pools/:id/history?window=30d`

   * Time-series data for charts:

     * daily `date`, `tvl_usd`, `apy` (and volume if available).

4. `POST /quote`

   * Body: `{ poolId, depositAmount, lockPeriodDays? }`
   * Response:

     * `riskBucket`
     * `premium`
     * `coverage`
     * `lockPeriodDays`
   * This is exactly what you’ll pipe into the Soroban insurance call later.

5. (Optional) `GET /dev/mock-pools`

   * Return your mock yield option with synthetic history, fully controlled by you.

Implementation details:

* Use `zod` schemas for **request/response validation**.
* Centralize DTO mapping: don’t expose raw DB rows directly.

Deliverable: You can demo risk + insurance pricing purely via Postman/curl.

---

### Phase 5 (Hour 36–44) – Contract Integration Hooks & Demo Scripts

Even though smart contracts are “another task”, backend should not be ignorant of them.

**Goals:** Prepare lightweight hooks so frontend can later call backend to get **Soroban call parameters**.

Tasks:

1. **Add Soroban client scaffolding**

   * Install `@stellar/stellar-sdk`.([stellar.github.io][10])
   * Create `src/modules/stellar/client.ts`:

     * Holds RPC URLs for **local sandbox** and **testnet**.
     * Helper `getNetworkConfig(env)`.

2. **Define call parameter builders**

   * `buildDepositTxParams({ wallet, poolId, amount })`
   * `buildBuyInsuranceTxParams({ wallet, poolId, depositAmount, premium, coverage, lockPeriod })`
   * For now, just return **structured JS objects** with:

     * target contract IDs (to be filled later),
     * method names,
     * argument lists (aligned with your planned contracts).
   * No signing, no submission. FE/wallet will handle that.

3. **Add demo endpoints**

   * `POST /tx/deposit-and-insure/preview`:

     * Accepts same payload as `/quote`, returns:

       * insurance quote,
       * recommended Soroban call structure for deposit + insurance.
   * This gives the jury a clear picture: backend computes brainy stuff, contract executes it.

4. **Simple demo scripts**

   * Prepare a couple of `.http` or `.sh` scripts:

     * `script 1`: list pools → pick Blend → get quote for $1k.
     * `script 2`: call `/tx/deposit-and-insure/preview` to show tx params.

Deliverable: FE dev (or you later) can plug these into wallet integration without redesigning backend.

---

### Phase 6 (Hour 44–48) – Hardening, Edge Cases, and Docs

**Goals:** Make it demo-safe and easy to explain in 2–5 minutes.

Tasks:

* **Error handling & fallbacks**

  * If DeFiLlama is down:

    * serve last known data from SQLite and flag `stale: true` in responses.

* **Participants field**

  * Decide clearly:

    * Either omit it from API for now, or expose `participants: null` with `participantsSource: "not_available_from_public_apis"`.
  * Don’t silently fake real-looking numbers; call it out in code comments.

* **Config**

  * `.env` / config module for:

    * DeFiLlama base URLs (if you switch to pro-api later),
    * network (sandbox vs testnet),
    * mock mode toggles.

* **README**

  * Short but crisp:

    * How to run backend.
    * How to run `import:pools`.
    * Example curl for `/pools`, `/pools/:id`, `/quote`.
    * One paragraph explaining **“risk off-chain, execution on Soroban”**.

[1]: https://api-docs.defillama.com/?utm_source=chatgpt.com "API Docs - DefiLlama"
[2]: https://api-docs.defillama.com/llms.txt?utm_source=chatgpt.com "llms.txt"
[3]: https://github.com/DefiLlama/dimension-adapters/blob/master/fees/tarot.ts?utm_source=chatgpt.com "dimension-adapters/fees/tarot.ts at master"
[4]: https://defillama.com/protocol/blend?utm_source=chatgpt.com "Blend"
[5]: https://defillama.com/metrics?utm_source=chatgpt.com "Metrics"
[6]: https://defillama.com/yields/pool/ae5ed3d0-a752-4b4b-b9ac-fa9384f36e0e?utm_source=chatgpt.com "Supply APY"
[7]: https://defillama.com/chain/stellar?utm_source=chatgpt.com "Stellar"
[8]: https://stellar.org/case-studies/meru-wallet-uses-blend-defi-protocol-for-yield-v2?utm_source=chatgpt.com "Blend & Meru Case Study"
[9]: https://developers.stellar.org/docs/data/apis/horizon/api-reference/resources/liquiditypools?utm_source=chatgpt.com "Liquidity Pools"
[10]: https://stellar.github.io/js-stellar-sdk/?utm_source=chatgpt.com "@stellar/stellar-sdk Documentation Home - GitHub Pages"
[11]: https://docs.rs/soroban-spec-typescript?utm_source=chatgpt.com "soroban_spec_typescript - Rust"
[12]: https://github.com/JakubPluta/defillama/?utm_source=chatgpt.com "JakubPluta/defillama: Python wrapper do Defi Llama API"
