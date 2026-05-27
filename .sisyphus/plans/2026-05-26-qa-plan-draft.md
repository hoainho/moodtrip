# MoodTripV2 — QA Plan Draft (pre-synthesis skeleton)

> This is a working draft created in parallel while review agents complete.
> Final QA plan will be re-derived after the synthesized growth plan locks the feature set.

## Layered Testing Strategy

### Layer 1 — Unit (Vitest + React Testing Library)
- **Coverage target:** 70% lines, 80% on `services/*`
- **Scope:** pure functions (haptics, shareService compress/decompress, geminiService prompt builders, validation helpers)
- **CI gate:** all unit tests pass; coverage threshold enforced
- **Example targets:**
  - `buildDurationText` ([`geminiService.ts:7-12`](file:///Users/nhonh/Documents/personal/moodtripV2/services/geminiService.ts#L7-L12))
  - `compressItinerary` / `decompressItinerary` ([`shareService.ts`](file:///Users/nhonh/Documents/personal/moodtripV2/services/shareService.ts))
  - Form validation (budget bounds, duration ≥ 0, mood selection limits)

### Layer 2 — Integration (Vitest + MSW)
- **Coverage target:** every service-to-component contract
- **Scope:** Gemini proxy responses (success, rate-limit, invalid key, malformed JSON), Supabase auth flows, affiliate API mocks
- **CI gate:** all happy-path + 3 failure-path scenarios per service
- **Mock layer:** MSW handlers for `proxy.hoainho.info`, Supabase REST/Realtime, Klook/Agoda affiliate endpoints

### Layer 3 — E2E (Playwright)
- **Coverage target:** 100% of P0 user journeys
- **Scope:** full browser flows on Chromium, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 14)
- **CI gate:** all P0 flows green on all 4 browsers; flaky test budget = 0
- **P0 journeys:**
  1. Generate long trip end-to-end (form → loading → result → save → re-open)
  2. Generate short trip end-to-end
  3. Share trip → open share URL in incognito → decompress + render correctly
  4. PDF export produces non-empty file matching destination
  5. Group vote flow (after F2 ships): create vote → 3 phantom voters → consensus itinerary generated
  6. Remix flow (after F1 ships): visit public trip → fork → edit → republish
  7. Affiliate booking click (after F4 ships): click hotel → click-tracking fires → redirect lands on partner
  8. PWA install + offline open of saved itinerary

### Layer 4 — Performance (Lighthouse CI + ohmyperf MCP)
- **Coverage target:** every PR runs Lighthouse on hero + form + result pages
- **Budgets:** LCP < 2.5s mobile 4G, INP < 200ms, CLS < 0.1, TBT < 200ms, JS bundle < 250KB initial
- **CI gate:** budget regression > 10% blocks merge
- **Tools:** `ohmyperf measure` with `mode=ci-stable, runs=5` per PR; `track_url` for production trend monitoring

### Layer 5 — Security (semgrep + manual review + DAST)
- **Coverage:** OWASP Top 10 plus app-specifics
- **Specific checks:**
  - No secrets in client bundle (verify via `rg` on build output)
  - JWT proxy enforces per-user rate limits (anonymous: 3/day, authed: 10/day, paid: 50/day)
  - Share URL cannot be used to inject malicious markdown into `ItineraryDisplay`
  - Affiliate redirect URLs are allowlisted (no open redirect)
  - Supabase RLS policies block cross-user read on Trip / Remix / Vote tables
  - Vietnamese Decree 13/2023 PII handling: data residency, deletion-on-request, consent banner
- **CI gate:** semgrep ruleset (`r/owasp-top-ten`, `r/javascript`) green; weekly OWASP ZAP DAST scan

### Layer 6 — Accessibility (axe + Playwright a11y + Lighthouse)
- **Coverage target:** WCAG 2.1 AA
- **Specific checks:** keyboard nav full flow, focus traps in modals (ShareModal, TravelTipsModal, ApiKeyModal), color contrast on glass-dark backgrounds, screen-reader labels on all icon-only buttons
- **CI gate:** zero axe critical/serious violations on hero, form, result

### Layer 7 — Load (k6)
- **Coverage:** capacity test before each major launch
- **Scenarios:**
  - Itinerary generation: 100 → 500 → 1000 concurrent users, p95 < 8s
  - Group vote: 50 simultaneous rooms, 6 voters each, realtime latency p95 < 500ms
  - Auth: 200 concurrent magic-link verifications, p95 < 2s
- **CI gate:** quarterly load test; pre-launch load test before each phase exit

---

## Top 3 Highlight Features — Example Test Cases (placeholder)

**Will be filled after synthesis confirms which 3 features are top-priority.**
Candidates: F1 Remix, F2 Group Vote, F3 Trending Map, F4 Affiliate, F5 Stories.

---

## Release-Readiness Checklist (per phase exit)

- [ ] All unit + integration + E2E tests green on main for 7 consecutive days
- [ ] Lighthouse mobile score ≥ 90 on 3 key pages
- [ ] Zero axe critical/serious a11y violations
- [ ] Semgrep + DAST scan green
- [ ] Load test passes target concurrency at p95 SLO
- [ ] Sentry error rate < 0.5% sessions over last 7 days
- [ ] PostHog funnel: activation rate meets phase KPI
- [ ] Rollback plan documented (last-known-good Vercel deployment + Supabase migration revert)
- [ ] On-call rota and runbook updated
- [ ] Customer-support macros updated (Vietnamese + English)
- [ ] Privacy policy + ToS updated if data model changed
- [ ] Affiliate partner notified of any URL-format changes
