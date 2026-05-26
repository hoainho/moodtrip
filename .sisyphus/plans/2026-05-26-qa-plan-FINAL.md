# MoodTripV2 — FINAL QA Plan (Companion to Growth Plan)

> **Status:** FINAL v2 — aligned with [`2026-05-26-growth-to-100k-FINAL.md`](file:///Users/nhonh/Documents/personal/moodtripV2/.sisyphus/plans/2026-05-26-growth-to-100k-FINAL.md)
> **Date:** 2026-05-26
> **Scope:** Test strategy for 10 shipping features + 3 stretch features through 100K MAU
> **Repo:** [`moodtripV2`](file:///Users/nhonh/Documents/personal/moodtripV2)

---

## 1. QA Philosophy

Three principles:
1. **Tests fail as a CONSEQUENCE of broken code, not the goal.** No hard-coded values to satisfy assertions. No deletion of failing tests to ship.
2. **At every phase exit, every layer must pass simultaneously.** A green unit suite with broken E2E is NOT a release.
3. **Performance and accessibility are functional requirements, not nice-to-haves.** A feature that ships LCP=4s is broken, regardless of behavior correctness.

---

## 2. Seven-Layer Testing Strategy

### Layer 1 — Unit Tests (Vitest + React Testing Library)
- **Coverage target:** 70% lines overall, **80% on `services/*`** (proxy, share, haptics, geminiService prompt builders)
- **Scope:**
  - Pure functions: `buildDurationText` ([`geminiService.ts:7-12`](file:///Users/nhonh/Documents/personal/moodtripV2/services/geminiService.ts#L7-L12)), `buildShortTripPrompt` ([`geminiService.ts:14-60`](file:///Users/nhonh/Documents/personal/moodtripV2/services/geminiService.ts#L14-L60))
  - Compression: `compressItinerary` / `decompressItinerary` round-trip with edge cases (long Vietnamese strings, emoji, malformed data)
  - Form validation: budget bounds, duration ≥ 0, mood selection ≤ 3, required fields
  - Mơ system prompt builder (post-Phase 0b): persona injection, dialect conditioning
  - Card-pull (A2): card-shuffle randomness uniformity over 10K samples
- **Tooling:** Vitest + RTL + happy-dom (faster than jsdom for VN locale)
- **CI gate:** all unit tests pass; coverage threshold enforced via `vitest --coverage --thresholds`

### Layer 2 — Integration Tests (Vitest + MSW)
- **Coverage target:** every service-to-component contract; every Supabase RLS policy
- **Scope:**
  - Gemini proxy responses: success, rate-limit (429), invalid JWT (401), malformed JSON, schema retry path, $-spend circuit breaker trip
  - Supabase auth flows: magic link, Google, Apple; signup with imported local trips
  - Supabase RLS: cross-user trip read attempt → blocked; remix attribution; preference isolation
  - Affiliate API mocks: Traveloka 14-day cookie attribution, Klook click tracking, chargeback simulation
  - PWA offline: read cached itinerary with network down → succeeds; write attempt → queues + retries
- **Tooling:** MSW for proxy/affiliate mocks; Supabase local emulator for RLS
- **CI gate:** all happy-path + 3 failure-path scenarios per service; RLS regression suite green

### Layer 3 — E2E Tests (Playwright)
- **Coverage target:** 100% of P0 user journeys on 4 browser configs
- **Configs:** Chromium desktop, WebKit desktop, Mobile Chrome (Pixel 7), Mobile Safari (iPhone 14)
- **CI gate:** all P0 flows green on all 4 configs; flaky-test budget = 0 (quarantine + fix within 24h)
- **P0 journeys:**

| # | Journey | Phase introduced |
|---|---|---|
| E2E-01 | Generate long trip (form → loading → result → save → re-open) | Already exists, regression-test in 0b |
| E2E-02 | Generate short trip (city explorer mode) | Already exists |
| E2E-03 | Share trip → open share URL in incognito → decompress + render | Already exists |
| E2E-04 | PDF export produces non-empty file matching destination | Already exists |
| E2E-05 | Anon → signup → import 2 local trips → trips visible in dashboard | Phase 0b |
| E2E-06 | Magic-link login on mobile WebKit (most-broken combo) | Phase 0b |
| E2E-07 | PWA install prompt → install → open offline → cached itinerary visible | Phase 0b |
| E2E-08 | Mơ chat: send message, receive in-character Vietnamese reply, sticker reaction renders | Phase 0b |
| E2E-09 | Card-pull onboarding: shake → 3 cards reveal → tap "Generate" → itinerary matches card combo | Phase 1 |
| E2E-10 | Trip Remix: visit public trip → fork → edit mood → republish → new URL works | Phase 1 |
| E2E-11 | Trip Recap Image card: post-trip → tap "Share recap" → PNG downloads → preview matches | Phase 1 |
| E2E-12 | Affiliate click: tap "Book on Traveloka" → external redirect → click-tracking event fired in PostHog | Phase 2 |
| E2E-13 | Đường Về Quê: select hometown → receive culturally-grounded itinerary referencing local landmarks | Phase 2 |
| E2E-14 | F3-Lite map: itinerary shows static map → tap pin → deep-link to TikTok hashtag | Phase 2 |
| E2E-15 | Sunday Dream: notification at 4pm Sun → tap → dream card → streak counter increments | Phase 2 |
| E2E-16 | Regional dialect: trip to Huế → Mơ uses "mệ" instead of "bà" in chat | Phase 2 |

### Layer 4 — Performance (Lighthouse CI + ohmyperf MCP)
- **Coverage target:** every PR runs Lighthouse on hero + form + result; production trend tracked weekly
- **Budgets (hard fails, not warnings):**

| Metric | Budget | Surface |
|---|---|---|
| LCP | < 2.5s | Mobile 4G Fast, all 3 pages |
| INP | < 200ms | Form interactions, card-pull shake, chat |
| CLS | < 0.1 | All pages |
| TBT | < 200ms | Hero page (Three.js threat surface) |
| JS initial gzip | < 300KB | Critical path |
| FCP | < 1.8s | Hero page |
| TTFB | < 800ms | All pages |

- **Tooling:** `ohmyperf measure --mode=ci-stable --runs=5` per PR; `ohmyperf track-url` for production weekly trend; `ohmyperf enforce-budget` as CI gate
- **CI gate:** budget regression > 10% blocks merge; absolute budget breach blocks regardless of regression
- **Specific regression guards (per Oracle):**
  - Drei import must not exceed named subpaths (lint rule)
  - NatureScene must lazy-mount only post-LCP (test: hero page LCP measured before scene mounts)
  - GSAP must not appear in initial bundle (build assertion)

### Layer 5 — Security (semgrep + manual review + DAST + gitleaks)
- **Coverage:** OWASP Top 10 + app-specifics + Decree 13 compliance audits
- **Checks:**
  - No secrets in client bundle (build-time assertion via `rg` on dist/)
  - **gitleaks** scans every PR + historical scan one-time in Phase 0a
  - JWT edge proxy enforces tier limits (anon=1/day, free=3/day) — fuzzed at 2× limit, verifies 429
  - Share URL cannot inject malicious markdown into [`ItineraryDisplay`](file:///Users/nhonh/Documents/personal/moodtripV2/components/ItineraryDisplay.tsx) (react-markdown XSS regression suite)
  - Affiliate redirect URLs are allowlisted (no open redirect — verifies `traveloka.com`, `klook.com`, `agoda.com` only)
  - Supabase RLS blocks cross-user reads on Trip / Remix / Preference (automated regression suite, 50+ test cases)
  - Daily Gemini $-spend circuit breaker activates at $80 (load-test simulates abusive client)
  - **Decree 13 compliance audits:**
    - Consent flow blocks data collection without explicit acceptance
    - User can request deletion → all PII + embeddings + analytics events purged within 30d
    - AIITPD-listed cross-border recipients match actual outbound destinations (Gemini, Supabase, PostHog)
    - Data export endpoint produces machine-readable JSON
- **Tooling:** semgrep (`r/owasp-top-ten`, `r/javascript`), OWASP ZAP DAST weekly, gitleaks in CI
- **CI gate:** semgrep green, gitleaks clean, weekly DAST scan green before phase exit

### Layer 6 — Accessibility (axe + Playwright a11y + Lighthouse)
- **Coverage target:** WCAG 2.1 AA on every shipping page
- **Specific checks:**
  - Keyboard nav full flow (no mouse): hero → card-pull → form → result → share
  - Focus traps in modals: ShareModal, TravelTipsModal, ApiKeyModal, Mơ chat dialog
  - Color contrast on glass-dark backgrounds (current `#0a0e1a` + Tailwind oklch needs verification)
  - Screen-reader labels on all icon-only buttons (current icons in [`components/icons.tsx`](file:///Users/nhonh/Documents/personal/moodtripV2/components/icons.tsx))
  - Card-pull (A2): shake gesture has button alternative for motor-impaired users
  - Vietnamese diacritics render correctly in screen readers (NVDA + VoiceOver Vietnamese)
  - Reduced-motion preference: NatureScene + GSAP-replacement animations honor `prefers-reduced-motion`
- **CI gate:** zero axe critical/serious violations on hero, form, result, share, card-pull, recap

### Layer 7 — Load (k6 + Artillery)
- **Coverage:** capacity test before each phase exit
- **Scenarios:**

| Scenario | Concurrent users | Target p95 | Phase |
|---|---|---|---|
| Itinerary generation (cold) | 100 → 500 → 1,000 | < 8s | 0b |
| Itinerary generation (warm, cached) | 1,000 → 2,000 | < 3s | 1 |
| Trip share/fork resolution | 500 | < 1s | 1 |
| Affiliate click-tracking | 200 | < 500ms | 2 |
| Auth: magic-link verification | 200 | < 2s | 0b |
| Edge proxy rate limit enforcement | 5,000 abusive clients | 429 within 100ms | 0a |
| Recap image generation (Satori) | 300 | < 4s | 1 |

- **Tooling:** k6 for HTTP load, Artillery for WebSocket (if Phase 3 realtime ships)
- **CI gate:** quarterly load test green; pre-launch load test before each phase exit

---

## 3. Test Cases for Top 3 Highlight Features (per growth plan)

Per the FINAL plan, the 3 highest-leverage NEW features are:
- **A1 — Mơ Persona** (foundation, Phase 0b)
- **A2 — Rút Quẻ Du Lịch card-pull onboarding** (Phase 1, highest-K-factor cheap bet)
- **F4 — Affiliate Booking (Traveloka first)** (Phase 2, monetization)

### 3.1 Mơ Persona (A1) — Test Cases

**TC-Mơ-01 — Persona Voice Consistency**
- **Setup:** Authenticated user, language=vi-VN, no prior chat
- **Steps:** Send 3 messages to Mơ on different topics (trip planning, weather, random)
- **Expected:** All 3 replies use Mơ's voice markers: mixed VN-EN, occasional poetic line, gentle sarcasm at over-planning, references to cà phê sữa đá at least once across the 3 replies
- **Layer:** E2E + manual review
- **Pass criteria:** 100% of replies pass automated voice-marker regex; manual reviewer rates 4/5 on persona consistency

**TC-Mơ-02 — Regional Dialect Switching (Phase 2)**
- **Setup:** Generate trip to Huế
- **Steps:** Open chat with Mơ, send "Chào bạn"
- **Expected:** Mơ's reply contains Huế dialect markers (e.g., "mệ", "tê", "ni")
- **Failure mode tested:** Trip to Saigon must NOT use Huế markers (cross-contamination guard)
- **Layer:** E2E + integration

**TC-Mơ-03 — Sticker Reaction Pipeline**
- **Setup:** Send a message containing emotional keyword (e.g., "buồn")
- **Expected:** Mơ's reply includes a watercolor sticker reaction (image asset loaded from R2 with correct alt text)
- **Layer:** E2E + visual regression (Percy or Playwright screenshot diff)

**TC-Mơ-04 — Decree 13 Compliance — No PII Leak in Prompt**
- **Setup:** User profile has email "test@example.com", phone "+84..."
- **Steps:** Generate trip, intercept outbound Gemini request
- **Expected:** Outbound payload contains NO PII; only mood, budget, destination, anonymized user_id hash
- **Layer:** Integration + security

**TC-Mơ-05 — Fallback When Gemini Unavailable**
- **Setup:** Mock Gemini API returning 503 for 60s
- **Steps:** Send message to Mơ
- **Expected:** Mơ replies with a graceful fallback message in-character ("Mơ đang mơ một chút, thử lại sau nhé"), Sentry logs event, no user-facing error stack
- **Layer:** Integration

### 3.2 Rút Quẻ Du Lịch Card-Pull (A2) — Test Cases

**TC-Card-01 — Shake Trigger**
- **Setup:** Mobile WebKit, mobile Chrome
- **Steps:** Open homepage, perform shake gesture
- **Expected:** 3 cards flip up with smooth animation (motion/react), no jank (INP < 200ms during animation)
- **Layer:** E2E + performance
- **Pass criteria:** Animation completes < 800ms; INP measured during animation < 200ms

**TC-Card-02 — Accessibility Alternative**
- **Setup:** Keyboard-only navigation, screen-reader on
- **Steps:** Tab to homepage, locate card-pull button (must exist), activate
- **Expected:** Same 3-card reveal triggered via button; screen-reader announces "3 cards pulled: element, tempo, companion"
- **Layer:** Accessibility + E2E

**TC-Card-03 — Randomness Uniformity**
- **Setup:** Programmatic 10,000 card pulls
- **Steps:** Sample distribution of each card slot
- **Expected:** Chi-squared test p > 0.05 against uniform distribution per slot; no card appears > 1.5× expected frequency
- **Layer:** Unit

**TC-Card-04 — Card → Prompt Mapping**
- **Setup:** Force card pull to specific known combo (element=núi, tempo=chill, companion=solo)
- **Steps:** Generate itinerary
- **Expected:** Generated itinerary references mountain destinations + slow-paced activities + solo-friendly venues; NO romantic/group references; matches mood mapping table
- **Layer:** Integration + golden-set evaluation (10 known combos → 10 expected itinerary signatures)

**TC-Card-05 — Share Card-Pull Result**
- **Setup:** Post card-pull
- **Steps:** Tap "Share my cards"
- **Expected:** OG image generated server-side with 3 cards laid out + Mơ illustration; URL preview on Zalo/Facebook renders correctly
- **Layer:** E2E + visual regression
- **Failure mode:** Vietnamese diacritics in card names render correctly (no fallback boxes)

**TC-Card-06 — Repeated Pull (Anti-Slot-Machine Guard)**
- **Setup:** Anonymous user
- **Steps:** Pull cards 5 times in succession
- **Expected:** 5th pull triggers gentle Mơ message ("Mơ thấy bạn đang phân vân, cứ thử một lá đi nhé") + softer animation; does NOT consume rate-limit quota until "Generate Trip" is tapped
- **Layer:** E2E + business logic

### 3.3 Affiliate Booking — Traveloka (F4) — Test Cases

**TC-Aff-01 — Click Attribution**
- **Setup:** User on itinerary result page with hotel suggestion
- **Steps:** Tap "Book on Traveloka"
- **Expected:** Outbound URL contains affiliate ID + click_id + cookie set with 14-day expiry; PostHog event `affiliate_click_traveloka` fired with itinerary_id, user_id, hotel_id
- **Layer:** E2E + integration

**TC-Aff-02 — Redirect Safety**
- **Setup:** Malicious itinerary stored with hotel.booking_url = `javascript:alert(1)`
- **Steps:** Render itinerary, attempt to click hotel
- **Expected:** Click is blocked; URL allowlist rejects non-Traveloka/Klook/Agoda domains; Sentry logs attempted XSS
- **Layer:** Security + integration

**TC-Aff-03 — Server-to-Server Attribution Fallback**
- **Setup:** User in Safari iOS with ITP (Intelligent Tracking Prevention) cookie suppression
- **Steps:** Click "Book on Traveloka"
- **Expected:** Click tracked via server-side Traveloka API (postback URL with click_id), NOT relying on client cookie
- **Layer:** Integration

**TC-Aff-04 — Net Revenue Calculation (Chargeback Modeling)**
- **Setup:** Mock 100 successful bookings, mock 15 chargebacks after 7d
- **Steps:** Run nightly revenue rollup
- **Expected:** Dashboard shows gross $X, net $0.85X, chargeback rate 15%; alert if chargeback > 20%
- **Layer:** Integration

**TC-Aff-05 — Rate Limit on Tracking Endpoint**
- **Setup:** Script firing 1,000 affiliate clicks/sec from single IP
- **Expected:** CF Worker rate-limits at 10/sec/IP; excess returns 429; no malformed events reach PostHog
- **Layer:** Load + security

**TC-Aff-06 — Consent Gate (Decree 13)**
- **Setup:** New user, has NOT accepted cross-border data transfer consent
- **Steps:** Try to tap "Book on Traveloka"
- **Expected:** Consent dialog blocks click; explains Traveloka receives user data; click only proceeds after explicit accept; consent timestamp logged
- **Layer:** Compliance + E2E

**TC-Aff-07 — Tax/Entity Routing**
- **Setup:** Affiliate payout simulation
- **Expected:** Payout routes to designated entity bank account (LLC or Singapore entity per Decision Log); receipt generated for accounting
- **Layer:** Manual + financial reconciliation (not in CI; quarterly)

---

## 4. Release Readiness Checklist (per phase exit)

This checklist MUST be 100% green before declaring a phase complete. No exceptions, no "we'll fix it next sprint".

### Code Quality
- [ ] All unit + integration + E2E tests green on `main` for 7 consecutive days
- [ ] `lsp_diagnostics` clean across all changed files
- [ ] Coverage thresholds met (70% lines, 80% on services/*)
- [ ] semgrep + gitleaks green; weekly OWASP ZAP DAST green
- [ ] No `as any`, no `@ts-ignore`, no `@ts-expect-error` introduced this phase

### Performance
- [ ] Lighthouse mobile score ≥ 90 on hero, form, result
- [ ] LCP < 2.5s, INP < 200ms, CLS < 0.1 measured via `ohmyperf measure --mode=ci-stable --runs=5`
- [ ] Bundle size: initial JS gzipped < 300KB
- [ ] Three.js NatureScene confirmed lazy-mounted (post-LCP)

### Accessibility
- [ ] Zero axe critical/serious violations on hero, form, result, share, card-pull, recap
- [ ] Keyboard nav full flow works (no mouse required)
- [ ] Screen-reader test passed on NVDA (Vietnamese) and VoiceOver (Vietnamese)
- [ ] `prefers-reduced-motion` honored on all animations

### Security & Compliance
- [ ] No secrets in client bundle (verified via build-output scan)
- [ ] JWT edge proxy enforces tier rate limits (verified via load test)
- [ ] RLS regression suite (50+ tests) green
- [ ] Decree 13: consent flow live, AIITPD dossier filed/current, DPO designated, deletion endpoint works within 30d
- [ ] Privacy policy + ToS reflect any data-model changes
- [ ] Affiliate partner approvals current (Traveloka, Klook, Agoda partner status verified)

### Observability & Operations
- [ ] Sentry error rate < 0.5% sessions over last 7 days
- [ ] PostHog funnel: activation rate meets phase KPI
- [ ] Daily Gemini $-spend dashboard live; circuit breaker tested in staging
- [ ] On-call rota and runbook updated
- [ ] Status page + customer-support macros updated (Vietnamese)
- [ ] Rollback plan documented (last-known-good Vercel deployment + Supabase migration revert script)

### Phase-Specific Gates
- **Phase 0a:** Old `proxy.hoainho.info` returns 410 Gone after 14d backward-compat window
- **Phase 0b:** Decree 13 dossier submitted; Mơ visible in chat + 3 sticker reactions wired
- **Phase 1:** 200 hand-authored seed trips published; 10-15 UGC creator beta active
- **Phase 2:** Tax/entity decision finalized BEFORE first affiliate payout; content takedown SLA endpoint live
- **Phase 3:** Paid acquisition consultant retained; LTV/CAC dashboard live; affiliate net revenue covers infra + AI cost

---

## 5. Test Environment Matrix

| Env | Purpose | Data | Owner |
|---|---|---|---|
| `local` | Dev iteration | Supabase local emulator + MSW mocks | Engineer |
| `ci` | Per-PR validation | Ephemeral Supabase preview branches + sandbox Gemini | CI bot |
| `staging` | Pre-release manual QA | Supabase staging (anonymized prod snapshot) + live Gemini (low quota) | QA |
| `prod` | Live | Real | Eng + ops |

Staging mirrors prod within 1 day for data shape (sanitized). All E2E test runs hit `staging` weekly + on every release candidate.

---

## 6. Flaky Test Policy

- **Zero flake budget on `main`.** Any flake → quarantine + open issue within 24h.
- **Quarantined tests must be fixed or deleted within 7 days.** Indefinite quarantine is forbidden.
- Root-cause every flake. NEVER `--retries=3` as a fix. (Per Sisyphus protocol: "Tests pass as a CONSEQUENCE of correct code, not the goal.")

---

## 7. QA Ownership Matrix

| Layer | Owner | Cadence |
|---|---|---|
| Unit | Feature engineer (writes with code) | Per PR |
| Integration | Feature engineer + reviewer | Per PR |
| E2E | Dedicated QA eng (or rotating engineer) | Per release candidate |
| Performance | Frontend lead + ohmyperf in CI | Per PR + weekly trend |
| Security | Backend lead + external auditor (annual) | Per PR + quarterly |
| Accessibility | Frontend lead | Per release candidate |
| Load | Backend lead | Per phase exit |
| Compliance | Legal counsel + DPO | Per phase exit + ad-hoc |

---

## 8. Stability Guarantees This QA Plan Delivers

1. **No regression on existing flows** during Phase 0 platform migration (16 P0 E2E journeys assert this).
2. **Performance budgets enforced as hard CI gates** — feature ships fast or doesn't ship at all.
3. **Decree 13 compliance verified by automated audits** every PR (not just at launch).
4. **Affiliate revenue accuracy verified by net-not-gross dashboards** with chargeback modeling.
5. **Mơ persona consistency measurable** via voice-marker regex + manual reviewer rubric.
6. **Card-pull randomness statistically validated** so users cannot game the system.
7. **Zero flaky tests on main** — every failure is a real signal, not noise.
8. **Rollback plan tested in staging** at every phase exit — recovery from production breakage measured in minutes, not hours.

---

*End of FINAL QA plan. Ready to hand off with the growth plan.*
