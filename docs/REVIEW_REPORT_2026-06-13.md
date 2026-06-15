# MoodTrip — Full Review & E2E Report

> Date: 2026-06-13 · Branch: `ui-polish-mobile-first` · Reviewer: automated multi-agent review (core-flow + services/security + UX/a11y) + E2E pass.
> Scope: whole-app review → prioritized improvements (authored as OpenSpec change proposals) + run existing E2E suite and fix failures.

---

## 1. Executive summary

MoodTrip is a Vietnamese AI travel-itinerary generator (React 19 + Vite, Gemini via an edge proxy,
Supabase, MapLibre, Three.js, PWA). The architecture is clean and the happy path works end-to-end
(proven by the passing create-trip E2E). The review surfaced **6 CRITICAL** and **18 HIGH** findings
concentrated in four areas, each turned into an OpenSpec change proposal:

| Pri | Proposal | Theme | Source findings |
|----|----------|-------|-----------------|
| **P0** | `resilient-itinerary-generation` | Money-path robustness: structured output, parse/render hardening, timeout+cancel, pre-flight validation, error mapping | core-flow CRITICAL/HIGH |
| **P0** | `untrusted-shared-trip-hardening` | Treat `?trip=` shared data as untrusted: schema-validate, size cap, decompression-bomb guard, URL→slug fallback | services CRITICAL/HIGH |
| **P1** | `accessibility-mobile-foundation` | WCAG: reduced-motion 3D, viewport zoom, focus-trap dialogs, 44px targets, aria-live, skippable intro | UX CRITICAL/HIGH (aligns with current branch) |
| **P1** | `consent-enforcement-decree13` | Decree 13: gate analytics + cross-border AI on consent, decline path, harden delete-account erasure | services + UX HIGH |
| **P2** | (backlogged — see §5) | Persistence integrity: upsert prefs, idempotent migration, slug-collision retry, wire fork to API | services MEDIUM |

**E2E result:** the existing suite had 2 hard failures + 3 flaky tests, **all caused by test drift / timing**
(not app bugs). Fixed in this pass → suite is green. See §4.

---

## 2. Critical & High findings (by area)

### 2.1 Core trip-generation flow
- **[CRITICAL] `itinerarySchemaSplit.ts` is dead code.** The resilient split-pipeline (smaller per-call
  token budget + graceful enrichment degradation) is implemented but never imported. The live path is a
  single 8192-token Gemini call that must return the entire nested object or the whole trip fails.
- **[HIGH] Single large JSON response is the dominant failure mode and under-handled.** 5–7 day trips
  truncate (`finishReason: MAX_TOKENS`) → invalid JSON → retry reproduces the same truncation (identical
  prompt). Detected but only `console.warn`ed (`geminiService.ts:313`).
- **[HIGH] `parseItinerary` validates only `destination`/`timeline`/`overview`** but `ItineraryDisplay`
  unconditionally maps `food` and `tips` (`:414,:443`). A model omission → render crash with **no error
  boundary** around the display (only the 3D scene is wrapped). The bad object is **persisted to
  localStorage before render** (`App.tsx:233`), so it reloads broken on every visit.
- **[HIGH] No timeout/cancel on the Gemini fetch.** A hung proxy leaves the user on an infinite loading
  animation. (PDF export *does* have a 45s timeout — the more critical call does not.)
- **[HIGH] No pre-flight form validation.** Submits with 0 moods or budget 0 spend a rate-limited token on
  a degenerate prompt; no double-submit guard.
- **[MEDIUM] Raw technical errors shown to users** (`Proxy error: 500…` in the Vietnamese error UI);
  `retryAfterSeconds` from the proxy is discarded; `EMPTY_RESPONSE` is not retried; `lastFormData` is
  cleared on success, breaking retry-after-error and hiding the Anti-Itinerary CTA.
- **[MEDIUM] No prompt-injection delimiting** for `personalNote`/`destination` (bounded impact — own
  session, JSON-only, server budget guard — but can break the JSON contract / abuse the persona).

### 2.2 Services / data / security
- **[CRITICAL] `delete-account` edge fn uses the service-role key as the user-context client**
  (`supabase/functions/delete-account/index.ts:49`). Auth works today via `getUser()`, but any future query
  on that client runs as service-role (RLS bypass). Use anon key for user context; reserve service-role for
  the admin client.
- **[CRITICAL] Erasure integrity** — `audit_log.actor_id` is `on delete set null`, so the deletion-audit row
  is orphaned the instant the user is deleted (Decree 13 accountability gap). No cascade verification.
- **[HIGH] `decompressItinerary` trusts attacker-controlled `?trip=` input** — `JSON.parse` + blind cast to
  `ItineraryPlan`, then rendered. Missing/`null` `timeline` → unhandled render crash; arbitrary URLs flow
  into the UI.
- **[HIGH] Decompression bomb** — `DecompressionStream` output is unbounded; a tiny link can expand to
  hundreds of MB and freeze the tab (pre-auth, victim-clickable).
- **[HIGH] No share-size guard** — full deflated itinerary in a query param; large trips silently 414 /
  truncate → corrupt share. (`String.fromCharCode(...bytes)` also stack-overflows on large arrays.)
- **[HIGH] Anon bearer token in `localStorage`** — XSS-exfiltratable; grants paid Gemini quota.
- **[HIGH] Trip read/write paths swallow all errors** → RLS-denied and network failures both return
  `null`/`[]`; correctness depends 100% on RLS existing in every environment, with no signal if it doesn't.

### 2.3 UX / accessibility / mobile / PWA
- **[CRITICAL] 3D background ignores `prefers-reduced-motion`** (`NatureScene` mounted unconditionally) —
  the CSS reduced-motion block does not reach the WebGL render loop. WCAG 2.3.3.
- **[CRITICAL] Viewport blocks zoom** (`index.html:5` `maximum-scale=1.0, user-scalable=no`) — WCAG 1.4.4 AA.
- **[HIGH] `ShareModal` has no scroll-lock / Escape / focus management / dialog role** — the repo already
  has `useBodyScrollLock`/`useEscapeKey` hooks; they're just unused here.
- **[HIGH] No real focus trap in any modal** (`aria-modal` set but Tab escapes to the page behind).
- **[HIGH] Consent banner has only "Tôi đồng ý" — no decline path** (Decree 13 requires refusable consent).
- **[HIGH] Multiple touch targets < 44px** (Hero delete-trip ≈22px and hover-only/unreachable on touch;
  top-right buttons, map links, modal closes at 36px) — directly contradicts the `ui-polish-mobile-first` branch.
- **[HIGH] Hero mobile menu** lacks `aria-expanded`/Escape/focus management.
- **[MEDIUM] Unskippable ~3.3s IntroScreen**, toasts not announced (`aria-live`), PWA has no iOS
  install fallback, "xem offline" claim unverified against the cache strategy.

### 2.4 Cross-cutting (found directly)
- **[LOW/quick-win] `package.json` has duplicate keys** — `@sentry/react`, `@supabase/supabase-js`,
  `posthog-js` are each declared twice (esbuild emits `duplicate-object-key` warnings on every dev start).
  Trivial dedupe.

---

## 3. Prioritized improvement specs (OpenSpec changes)

Authored under `openspec/changes/`:

1. **`resilient-itinerary-generation/`** — see proposal/design/specs/tasks.
2. **`untrusted-shared-trip-hardening/`**
3. **`accessibility-mobile-foundation/`**
4. **`consent-enforcement-decree13/`**

Each follows the harness format (proposal.md + design.md + specs/ + tasks.md) and is **high-risk** per the
validation ladder (user-facing behavior + security/compliance) → requires E2E + review gate before archive.

---

## 4. E2E report

Suite: Playwright, `MOCK_ITINERARY=1` dev server (deterministic Đà Lạt fixture, no real Gemini). 14 tests
across 4 specs. Run on `E2E_PORT=5180` (Docker holds the default 5174 on this machine).

### 4.1 Baseline (before fixes) — `2 failed, 3 flaky, 13 passed`
| Test | Verdict | Root cause |
|---|---|---|
| card-pull › *leads to card-pull view* | ❌ fail (all retries) | `gotoHome` fixed 2500ms wait races the ~3.3s IntroScreen; CTA detaches mid-click during intro→hero handoff |
| result › *Reel SVG download 9:16* | ❌ fail | Modal redesign: single **"Tải về"** button → split into **"Tải PNG"** + **"SVG"**; filename changed `…-reel.svg` → `…-story-1080x1920.svg`. Test referenced the old button/filename. |
| card-pull › *manual fallback* | ⚠️ flaky | Same intro-timing race |
| create-trip › *3 reasons* | ⚠️ flaky | Same navigation race |
| result › *compact mode* | ⚠️ flaky | Same navigation race |

**All five are test-harness drift, not application defects** — the full create-trip happy path (Hero →
card-pull → manual form → submit → result, with API-call assertions and zero page errors) passed
throughout.

### 4.2 Fixes applied (test-only)
- `e2e/_helpers.ts`: `gotoHome` now waits on `domcontentloaded` (not `networkidle`, which never settles due
  to analytics) and blocks until the Hero CTA is visible + settled. Added `clickExplore()` — a retrying
  click (`expect.toPass`) that tolerates the StrictMode/lazy-3D remount detaching the CTA, and confirms the
  card-pull view is reached.
- `e2e/card-pull-flow.spec.ts`: assert the real rendered labels (`Rút quẻ du lịch`, `Hôm nay bạn muốn đi
  đâu?`, `Nguyên tố`/`Nhịp`/`Bạn đi cùng`) instead of stale uppercase strings; use `clickExplore`.
- `e2e/result-enhancements.spec.ts`: select the **Reels / Story** format tab, click the **SVG** button,
  match the current filename `^moodtrip-.*-story-1080x1920\.svg$`.
- `e2e/create-trip.spec.ts`: use `clickExplore`.

### 4.3 After fixes
See §6 (final run result, appended after the full suite completes).

### 4.4 Coverage gaps (existing suite does NOT cover)
Share flow (public slug + `?trip=` decompress), Anti-Itinerary, Mơ notebook, Personal World scene, Đường về
quê, auth/login, preferences persistence, PDF export, PWA install, consent **decline**, error/rate-limit
paths. Recommend expanding once the P0/P1 specs land (each spec lists its own E2E acceptance scenarios).

---

## 5. Backlog (P2 / not yet specced)
- **Persistence integrity:** `preferencesApi` should `upsert` (currently silent no-op `update` if no row);
  `localTripMigration` dedupe is weak and re-imports on partial failure; `share_slug` unique-violation
  unhandled; `SharedTripView` fork is a client-only clone that never calls `forkTrip` (lineage lost).
- **`package.json` duplicate-key dedupe** (quick win).
- **Sentry PII denylist** is by fixed key set; nested/renamed PII fields slip through.

---

## 6. Final E2E run

**Result: 18/18 passed · 0 failed · 0 flaky · 4.0 min** (`E2E_PORT=5180 CI=1 npm run test:e2e`).

Every test passed on the **first attempt** (no retries consumed) and the run logged **0 page reloads**.

### The deeper root cause (most important finding of the E2E pass)
The intermittent failures were **not** in the app and **not** purely stale assertions. Vite's dev-server file
watcher was watching in-repo, non-source state directories (`.omc/state/*`, `test-results/`, etc.) and firing
a **full-page reload every time one changed**. Those files are written continuously by background tooling
during a session, so the browser would reload at an arbitrary moment — restarting the IntroScreen splash and
**detaching whatever element a test was mid-interaction with** (CTA click, manual button, form submit). This
is why failures moved around between runs and worsened in the longer full run (more concurrent writes).

**Fix:** `vite.config.ts` → `server.watch.ignored` excludes `.omc`, `.sisyphus`, `.agent`, `.campaign`,
`test-results`, `.playwright-mcp`, `playwright-report`. This is a real dev-experience improvement (the
spurious reloads also hit anyone running the app locally with those tools active), not a test-only patch.

### All changes made in the E2E pass (test + dev-config only — no app source touched)
| File | Change |
|---|---|
| `vite.config.ts` | Add `server.watch.ignored` for tooling/state dirs (root-cause fix for reload flakiness) |
| `e2e/_helpers.ts` | `gotoHome` → `domcontentloaded` + wait for settled Hero CTA; add retrying `clickExplore()` |
| `e2e/card-pull-flow.spec.ts` | Assert real rendered labels; use `clickExplore` |
| `e2e/create-trip.spec.ts` | Use `clickExplore` |
| `e2e/result-enhancements.spec.ts` | Select Reels/Story tab, click `SVG` button, match current filename; use `clickExplore` |

### Run history
| Run | Result | Note |
|---|---|---|
| 1 & 2 | aborted | port 5174 held by Docker → switched to 5180 |
| 3 (baseline) | 13 passed, 2 failed, 3 flaky | stale assertions + reload races surfaced |
| targeted verify | 12 passed, 1 flaky | after assertion/helper fixes |
| full (pre-watch-fix) | 13 passed, 1 failed, 4 flaky | exposed the reload root cause |
| **final** | **18 passed, 0 failed, 0 flaky** | after `server.watch.ignored` |

