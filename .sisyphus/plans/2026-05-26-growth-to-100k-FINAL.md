# MoodTripV2 → 100K Users — FINAL Consolidated Plan

> **Status:** FINAL v2 — synthesized from 5 reviewer critiques (Oracle, Metis, Momus, librarian, artistry)
> **Date:** 2026-05-26
> **Supersedes:** `2026-05-26-growth-to-100k-v1.md`
> **Repo:** [`moodtripV2`](file:///Users/nhonh/Documents/personal/moodtripV2)
> **Companion:** [`2026-05-26-qa-plan-FINAL.md`](file:///Users/nhonh/Documents/personal/moodtripV2/.sisyphus/plans/2026-05-26-qa-plan-FINAL.md)

---

## 0. How Reviewers Were Merged (Contradiction Resolution Log)

| Topic | Oracle | Metis | librarian | artistry | **Decision** |
|---|---|---|---|---|---|
| Backend choice | Hybrid: Supabase + CF Workers + Fly.io | Supabase OK with exit ramp | n/a | n/a | **Hybrid (Oracle wins)** — Supabase for data/auth/realtime; CF Workers for AI proxy + OG; Fly.io for video |
| AI cost budget | $2K/mo realistic (not $1K) | Need cost circuit breaker | n/a | n/a | **Raise ceiling to $2K/mo, add daily $-spend circuit breaker** |
| K-factor targets | K=0.8 fantasy without referral economy | K=0.10/0.20/0.30 honest | No public benchmarks; travel apps median K unmeasured | Card-pull, Mơ, 3D world = K boosters | **Re-anchor to K=0.10/0.20/0.30. Treat artistry bets as upside, not assumption.** |
| F2 (Group Vote) keep/cut | Architecturally feasible but watch INP | **Cut entirely from 100K plan** | n/a | Anti-itinerary, dual-persona richer | **Cut F2 from 100K push. Defer to post-100K.** Group-share = editable link in F1. |
| F7 (English i18n) timing | n/a | **Cut from 100K plan** — prompts deeply Vietnamese | Vietnam market alone supports 100K (Layla shows mood-first works at scale) | "Tiếng Vùng" (regional dialect) is the opposite direction | **Cut F7 from 100K. Add regional dialect mode as Phase 2 differentiator.** |
| F5 (recap video) | Pipeline wrong (Stream ≠ render); $500/mo at 10K renders | Music licensing missing; cut full video, ship "image card" | n/a | "Sóng Đi" sound postcard > generic video | **Phase 1: ship trip-recap image card (cheap). Phase 3: optional sound postcard (artistry). Drop 15s video from 100K plan.** |
| Persona / mascot | n/a | n/a | Mindtrip moat = knowledge base; not character | **Mơ is THE bet** — Duolingo-tier brand equity | **Mơ persona is non-negotiable. Phase 0 ships Mơ illustration + system prompt.** |
| Three.js NatureScene | Drop or lazy-mount (LCP killer) | Performance untested | PWA case studies: speed matters more than visuals | "Personal 3D World" promotes Three.js to identity, not background | **Lazy-mount NatureScene post-LCP in Phase 0. Phase 2-3: pilot Personal 3D World as profile artifact.** |
| Decree 13 / PDPL | Mentioned as risk | Hard launch blocker | **Hard launch blocker — AIITPD dossier within 60 days, mood data may be sensitive** | n/a | **Phase 0 hard gate: AIITPD dossier + consent flow + DPO designation before any production data flows.** |
| Affiliate sequencing | Tax/entity blocker | Klook only first, Agoda/Traveloka later | **Traveloka first (14-day cookie), Klook second (eSIM 18.6%). Booking.com last (session-only = bad fit).** | n/a | **Traveloka first, Klook second, Agoda third. Booking.com deprioritized.** |
| Phase 0 timeline | 7-9 weeks, split into 0a (security 2wk) + 0b (platform 6wk) | 8-12 weeks | n/a | n/a | **Phase 0a = 2 weeks (security ship-stop). Phase 0b = 6 weeks (platform). Total Phase 0 = 8 weeks.** |
| Hardcoded PROXY_API_KEY | Day-1 ship-stop fix via CF Worker + JWT | Already git-history-leaked; rotate + scrub | n/a | n/a | **Phase 0a Day 1: edge proxy + rotate key + gitleaks in CI. Non-negotiable.** |
| Team-size assumption | Implicit ≤3 eng | **MUST be named in §1** | n/a | n/a | **Plan assumes 3 FTE × 40 weeks. Solo/2-FTE scenario explicitly documented as 60-80% timeline inflation.** |

---

## 1. Team & Confidence Assumption (was missing in v1 — Metis fix)

This plan assumes:
- **3 FTE-equivalent engineering × 40 weeks** + 1 part-time designer/illustrator (for Mơ + watercolor system)
- **$30–45K marketing budget** over 40 weeks (paid creators + ambassadors + later paid acquisition)
- **~50–60% confidence** of hitting 100K MAU in 40 weeks under these conditions
- Solo or 2-FTE scenario inflates timeline to **60–80 weeks** for the same target

If team is smaller, do NOT scale down ambition — scale down scope. Cut F1 social feed to "fork only" and skip Phase 3 Personal 3D World.

---

## 2. Current State Recap (corrected per reviewers)

Stack from [`package.json`](file:///Users/nhonh/Documents/personal/moodtripV2/package.json) — React 19 + Vite 6 + Tailwind v4 + react-three/fiber + Gemini 2.5-flash + Vercel.

**Corrected gaps (from Metis):**
1. Hardcoded `PROXY_API_KEY = 'hoainho'` in [`geminiService.ts:4`](file:///Users/nhonh/Documents/personal/moodtripV2/services/geminiService.ts#L4) — **already compromised, treat as breach.**
2. The two openspec changes (`affiliate-booking-integration`, `quick-date-city-explorer`) are **empty directories** — work has not started.
3. Gemini prompts are heavy Vietnamese natural language ([`geminiService.ts:14-60`](file:///Users/nhonh/Documents/personal/moodtripV2/services/geminiService.ts#L14-L60)) — i18n requires prompt rewrite, not string swap.
4. Three.js + drei + GSAP + motion stack risks ~900KB-1.1MB initial JS payload → LCP 3.5-4.5s on VN mobile 4G. Plan v1 LCP <2.5s target unachievable without architectural surgery.

---

## 3. Target Persona (validated via librarian data)

**Linh, the spontaneous urban explorer** (validated by Layla data: 40% of users start without a destination in 2026, up from 12% in 2023).
- 22–32, VN urban, mobile-first, heavy TikTok user
- D7 retention target: **15-18%** (industry median 7.6%; top quartile ~15-25%)

**Cut from v1:** "Minh & friends group planner" persona — F2 group vote is deferred post-100K, so this persona is not addressed in the 100K push.

**Value proposition (sharpened):**
> "Tell Mơ how you feel. Get a trending, ready-to-go Vietnamese trip in 20 seconds — with a card to share, a passport to stamp, and a memory to keep."

---

## 4. Feature Roster (v1 had 8, FINAL has 5 + 3 artistry differentiators)

### Core (must-ship for 100K) — 5 features

| # | Feature | Source | Phase | Why kept |
|---|---|---|---|---|
| **F1** | **Trip Remix v0.5** — public share + fork (NO profiles, NO public feed v1) | v1 F1, scoped down by Metis | Phase 1 | 80/20 of viral value at 30% of build cost |
| **F4** | **Affiliate Booking** — Traveloka FIRST, then Klook, then Agoda | v1 F4 + librarian sequencing | Phase 2 | Non-negotiable: monetization unlocks paid acquisition |
| **F6** | **PWA + Offline (read-only itinerary cache)** | v1 F6, scoped down by Metis | Phase 0b | MakeMyTrip case: 3× conversion, 50% bookings last-minute |
| **F8** | **Mood Memory (preferences pre-fill only, no embeddings)** | v1 F8, scoped down by Metis | Phase 1 | 90% of activation lift at 20% of build cost |
| **F-Card** | **Trip Recap Image Card** (carved out of v1 F5) | v1 F5 stripped per Metis | Phase 1 | Post-trip viral artifact, cheap (reuse OG pipeline) |

### Differentiation (artistry bets that survived Oracle/Metis scrutiny) — 3 features

| # | Feature | Source | Phase | Why kept |
|---|---|---|---|---|
| **A1** | **Mơ — Named Persona** (watercolor illustrated, Vietnamese-spoken, system prompt + voice + sticker pack) | artistry §3.1 | Phase 0b (foundation) | Mascot moat (Duolingo-tier). Survived all reviewers — none objected. |
| **A2** | **Rút Quẻ Du Lịch — Card-Pull Onboarding** (3-card shake-to-reveal) | artistry §1.1 | Phase 1 | Cheapest highest-K-factor bet (1wk build, screenshot-native, culturally-rooted) |
| **A3** | **Đường Về Quê — Ancestral Hometown Mode** | artistry §5.1 | Phase 2 | Cultural moat no foreign competitor will build. Activates VN diaspora segment. |

### Deferred / Cut from 100K push (revisit after 100K)

| # | Feature | Why deferred |
|---|---|---|
| ~~F2~~ | ~~Group Planner with Live Vote~~ | Metis cut: high build cost, narrow use, missing Zalo. "Editable share link" inside F1 covers basic use case. |
| ~~F3~~ | ~~Trending Map + Reels Embed~~ → **F3-Lite: Static map + link-out** | Metis: oEmbed legal risk, OSM venue coverage poor. Ship static MapLibre map + deep-link to TikTok (no embed cache). |
| ~~F5~~ | ~~15s Recap Video~~ → F-Card + optional A4 sound postcard | Oracle: pipeline wrong, $500/mo at scale. Music licensing missing. |
| ~~F7~~ | ~~English i18n~~ | Metis + librarian: VN market alone supports 100K. Prompts deeply Vietnamese. Save for post-100K phase. |
| ~~Personal 3D World~~ | artistry §8.1 — pilot only after 100K (drei import cost). |
| ~~AR Hidden Spots~~ | artistry §4.2 — pilot only after 100K. |
| ~~Sunday Dream ritual~~ | artistry §7.1 — KEEP as a Phase 2 micro-feature (1-week build). Promoted to **F-Sunday**. |
| ~~Watercolor brand system~~ | artistry §8.2 — phased rollout as part of Mơ illustration sprint. |

### Promoted micro-feature (low-cost, high-leverage)
- **F-Sunday: Sunday Dream notification + streak** — 1-week build, Phase 2. Solves the "why open the app weekly" problem. Direct fit with Vietnamese cà phê + mơ mộng ritual.

**Final roster: F1, F4, F6, F8, F-Card, A1 (Mơ), A2 (Card-pull), A3 (Quê), F3-Lite, F-Sunday = 10 shippable items in 40 weeks across 3 FTE.**

---

## 5. Architecture (hybrid, per Oracle)

```
┌────────────────────┐   ┌─────────────────────────┐   ┌──────────────────┐
│  Vercel (frontend) │ → │  CF Worker (api edge)   │ → │  Gemini 2.5-flash│
│  - PWA + offline   │   │  - JWT (anon + Supabase)│   │  + prompt cache  │
│  - Code-split SPA  │   │  - Rate limit (KV)      │   └──────────────────┘
│  - Lazy NatureScene│   │  - $-spend circuit-brkr │
└────────────────────┘   │  - OG image (Satori)    │
                         └─────────────────────────┘
                                   │
                                   ▼
              ┌─────────────────────────────────────────┐
              │  Supabase (Singapore region)            │
              │  - Auth (magic + Google + Apple)        │
              │  - Postgres + RLS (Trip, Remix, Pref)   │
              │  - Realtime (Phase 3 only, behind flag) │
              │  - Storage (photos metadata)            │
              │  - pgvector (Phase 3 only)              │
              └─────────────────────────────────────────┘
                                   │
                                   ▼
              ┌─────────────────────────────────────────┐
              │  Cloudflare R2 (photos, recap cards)    │
              │  + Fly.io render worker (Phase 3, A4)   │
              └─────────────────────────────────────────┘

Compliance layer (cross-cutting):
- Consent flow → AIITPD dossier (Decree 13)
- Data residency review (Supabase SG region acceptable; document)
- Daily $-spend Gemini circuit breaker
- gitleaks in CI
- Sentry + PostHog (Phase 1)
```

### Performance targets (Oracle-corrected)
| Metric | Budget | How we hit it |
|---|---|---|
| LCP mobile 4G | < 2.5s | Lazy-mount NatureScene post-LCP; static gradient placeholder; code-split |
| INP | < 200ms | useTransition for any list updates; defer chat companion mount |
| Initial JS gzip | < 300KB | Drop GSAP (keep motion/react). Audit drei imports — named subpaths only. |
| Gemini call p95 | < 8s | gemini-2.5-flash, retry+backoff on schema fail |
| Cost per Gemini call | < $0.008 | Output schema split (skeleton + on-demand enrichment) + prompt cache |
| Infra ceiling @ 100K | < $3.5K/mo | Includes affiliate ops + content moderation budget |

### AI cost (Oracle math, corrected)
- 100K MAU × 2.2 trips/mo + 50% non-trip calls = **~330K Gemini calls/mo**
- At ~$0.008/call uncached → **$2,640/mo**
- With prompt caching + schema split → **$1,800-2,200/mo**
- With short-trip downgrade to gemini-2.5-flash-lite (60% of volume @ 6× cheaper) → **$1,200-1,500/mo**
- **Budget: $2,000/mo with hard circuit breaker at $80/day**

### Rate limits (anti-abuse)
| Tier | Daily limit | How enforced |
|---|---|---|
| Anonymous (no account) | 1 trip generation | IP-hash JWT, CF KV |
| Free authed | 3 trips/day, 1 remix/day | Supabase user_id, KV counter |
| Paid (Phase 3 stretch) | Unlimited | Stripe billing flag in Supabase |

---

## 6. Phased Roadmap (Oracle-corrected timeline)

### Phase 0a — Ship-Stop Security (Weeks 1-2)
**Owner:** 1 backend eng (full-time) + 1 reviewer  
**Effort:** ~15 dev-days

- [ ] CF Worker edge proxy at `api.moodtrip.app` — accepts POST, validates Origin, rate limits by IP via KV
- [ ] Anonymous client JWT mint endpoint (15min lifetime, HS256, IP-hash + nonce)
- [ ] Rotate Gemini API key in CF Worker Secrets
- [ ] Old proxy at `proxy.hoainho.info` proxies to new Worker for 14d backward compat
- [ ] **gitleaks** in CI; one-time historical audit (`git log -p | grep -i 'key\|token\|secret'`)
- [ ] Sentry wired (errors only, no PII)
- [ ] Daily $-spend circuit breaker (pause Gemini calls if total daily cost > $50)

**Exit gate:** New proxy live, old key rotated, no regression in existing flows (smoke-tested manually).

### Phase 0b — Platform & Mơ Foundation (Weeks 3-8)
**Owner:** 2 eng + 1 illustrator/designer (PT)  
**Effort:** ~60 dev-days

- [ ] Supabase project, Singapore region; schema (User, Trip, Remix, Preference, AffiliateClick)
- [ ] RLS policies + automated RLS regression tests
- [ ] Auth: magic link + Google + Apple
- [ ] LocalStorage → Supabase migration UX ("import your local trips on first login")
- [ ] PWA activation: workbox config, manifest, icons, install prompt, read-only offline itinerary cache
- [ ] PostHog wired (funnel events, no PII)
- [ ] Replace [`geminiService.ts`](file:///Users/nhonh/Documents/personal/moodtripV2/services/geminiService.ts) hardcoded URL with edge proxy URL + Supabase JWT
- [ ] Lazy-mount NatureScene post-LCP; static gradient placeholder; drop GSAP
- [ ] **Mơ illustration sprint (parallel track):** 30 expression variants by Da Lat-based VN watercolor illustrator
- [ ] **Mơ system prompt + voice library** integrated into chat companion + Gemini prompts
- [ ] **Decree 13 compliance gate:** AIITPD dossier drafted, consent flow live, DPO named, privacy policy + ToS v1, takedown endpoint scaffolded, audit log table created
- [ ] Schema split: itinerary skeleton (cheap, immediate) + enrichment (lazy, on-demand)
- [ ] LSP diagnostics + integration tests green; manual QA on 4 device classes

**Exit gate (Phase 0):**
- All existing functionality works for both anon and authed users with zero regression
- LCP mobile 4G < 2.5s (measured via ohmyperf, ci-stable mode, 5 runs)
- Decree 13 dossier submitted to A05 (or in active counsel review)
- Sentry error rate < 1% sessions over last 3 days
- Mơ visibly present in chat + 3 sticker reactions wired

### Phase 1 — First 1,000 Users (Weeks 9-16)
**Owner:** 3 eng + illustrator  
**Effort:** ~75 dev-days

**Ship:**
- [ ] **F1 Trip Remix v0.5** — public trip page + fork button + OG image (Satori on CF Worker); NO public feed, NO profiles
- [ ] **F-Card** trip recap image (single PNG, post-trip generation, share to Zalo/TikTok)
- [ ] **F8 Mood Memory** preference pre-fill (JSON column, no embeddings)
- [ ] **A2 Rút Quẻ Du Lịch card-pull onboarding** (24-card watercolor deck + shake trigger + 3-card → Gemini prompt)
- [ ] Seed 200 hand-authored sample trips before social-share launch (cold-start mitigation per librarian)
- [ ] Pre-seed `#MoodTrip` and `#RutQueDuLich` hashtags with 10-15 founder posts (librarian playbook)
- [ ] Recruit 10-15 UGC creators for 6-8wk pre-launch beta (librarian recommendation)

**Marketing:**
- [ ] 5 mid-tier VN travel creator partnerships ($8-15K, NOT $5K per Metis):
  - 2× inspirational life-travel (Phượng Đi Đâu-tier, 4-8% ER)
  - 1× city-specific local discovery (Tuấn Đi Đâu-tier)
  - 1× fast-growth micro creator (8-15% ER)
  - 1× mental health / slow travel creator (đi để chữa lành niche)
- [ ] 50 trending-venue SEO landing pages (auto-generated from highest-quality itineraries)
- [ ] Zalo Mini App scoped (do not omit — 80M MAU platform)

**KPI gates (revised from v1):**
- 1,000 signups
- D7 retention ≥ 15% (industry median is 7.6%)
- K-factor ≥ **0.10** (not 0.3)
- % users who share at least once ≥ 8%

**Rollback gate (added per Oracle):**
- If D7 < 10% by end of Phase 1, HALT new features, run retention audit before Phase 2.

### Phase 2 — First 10,000 Users (Weeks 17-26)
**Owner:** 3 eng + 1 BD/affiliate ops PT  
**Effort:** ~110 dev-days

**Ship:**
- [ ] **F4 Affiliate — Traveloka FIRST** (14-day cookie, 6.4% hotel commission VN-upsized). Klook second (eSIM 18.6%, Klook Kreator co-marketing).
- [ ] **F3-Lite** static MapLibre map + Foursquare venue resolver + deep-link out to TikTok (no embed cache, no scrape)
- [ ] **A3 Đường Về Quê** ancestral hometown mode — 63-province landmark database + custom Gemini prompt template
- [ ] **F-Sunday** Sunday Dream ritual (notification + streak counter, Vietnamese-only)
- [ ] **Regional Voice Mode** (artistry §5.3 "Tiếng Vùng") — Hue/Saigon/Mekong slang in Mơ's voice based on trip destination
- [ ] University ambassador program (HCMC, Hanoi, Da Nang) — 20 ambassadors, $2-3K stipends
- [ ] 500 indexed SEO pages
- [ ] Affiliate attribution: server-to-server tracking (not cookie); promo codes via creators (Metis)
- [ ] Daily affiliate revenue dashboard + chargeback model (15% cancellation assumption)

**Compliance gate (added):**
- [ ] Vietnam content takedown SLA endpoint live (24h response, audit log)
- [ ] Tax/entity decision finalized BEFORE first affiliate payout (LLC vs Singapore entity)

**KPI gates:**
- 10,000 MAU
- D7 retention ≥ 22% (top quartile territory)
- K-factor ≥ **0.20** (not 0.5)
- First $500/mo affiliate revenue (Traveloka)
- % users who share ≥ 15%

**Rollback gate:** If K < 0.10 OR affiliate revenue < $100/mo by end of Phase 2 → halt Phase 3 launch, retention audit.

### Phase 3 — First 100,000 Users (Weeks 27-40)
**Owner:** 3 eng + 1 BD + paid acquisition consultant PT  
**Effort:** ~120 dev-days

**Ship:**
- [ ] **A4 (optional, stretch) Sóng Đi sound postcard** — Web Audio + ffmpeg.wasm or Fly.io render worker
- [ ] **A5 (optional, stretch) Mơ's Notebook** — handwritten letter at trip-end (PDF, share-native)
- [ ] **F-Stretch Personal 3D World** pilot for power users (drei import cost — only if Phase 2 LCP holds)
- [ ] Klook + Agoda integrations live (Traveloka already live from Phase 2)
- [ ] Travel-blogger embeddable widget
- [ ] Paid acquisition turned ON: TikTok Spark Ads + Meta Reels, target CAC < $0.50
  - Realistic paid budget: **$25-40K** (Metis: not $15-30K)
  - Expected: 50-80K paid acquisitions to compensate for K=0.30 (not 0.8)
- [ ] Hộ Chiếu Mộng Mơ physical passport pilot (50 partner cafes, optional purchase via Lazada/Tiki)

**KPI gates:**
- 100,000 MAU
- D7 retention ≥ 28%
- K-factor ≥ **0.30** (not 0.8)
- $5,000+/mo affiliate revenue (net of chargebacks)
- Revenue covers infra + AI + moderation cost
- % users who share ≥ 25%

**Rollback gate:** If 100K MAU not reached by Week 40 AND K < 0.20 → reassess paid acquisition ROI, do not increase paid spend.

---

## 7. KPI Tree (revised per Metis + librarian)

**North Star:** Weekly Active Planners (WAP) = users who generated, voted on, forked, or shared a trip in last 7 days.

| Layer | Metric | Phase 1 | Phase 2 | Phase 3 | Source |
|---|---|---|---|---|---|
| Acquisition | New signups / wk | 125 | 1,000 | 6,500 | Realistic per team size |
| Activation | % new users complete 1 trip | 55% | 65% | 72% | Layla benchmark |
| Activation (week-1 value) | Trips generated within 7d of signup | 1.4 avg | 1.7 avg | 2.0 avg | Amplitude: 69% activation→retention correlation |
| Retention | D1 / D7 / D30 | 22/15/6 | 30/22/10 | 38/28/15 | Travel industry top-quartile = ~15-25% D7 |
| Virality | K-factor | 0.10 | 0.20 | 0.30 | Honest (Metis) |
| Virality | % users who share | 8% | 15% | 25% | Upstream measurable signal |
| Engagement | Trips / user / mo | 1.4 | 1.8 | 2.2 | Same as v1 |
| Monetization | Net affiliate $ / MAU / mo (after 15% chargebacks) | $0 | $0.05 | $0.18 | Metis: net not gross |
| Infra | Cost / MAU / mo (incl. moderation, Decree 13 ops) | $0.12 | $0.06 | $0.035 | Includes hidden ops |

---

## 8. Owner & Effort Table (per workstream)

| Workstream | Owner | Effort (FTE-weeks) | Phase |
|---|---|---|---|
| Edge proxy + JWT + key rotation | Backend eng | 2 | 0a |
| Supabase schema + RLS + auth | Backend eng | 4 | 0b |
| LocalStorage migration UX | Frontend eng | 2 | 0b |
| PWA activation | Frontend eng | 2 | 0b |
| Mơ illustration + system prompt | Illustrator (PT) + frontend eng | 3 | 0b |
| Performance surgery (lazy NatureScene, drop GSAP) | Frontend eng | 2 | 0b |
| Decree 13 dossier + consent flow | Legal counsel + backend eng | 3 | 0b |
| F1 Remix v0.5 + OG image | Full-stack eng | 5 | 1 |
| F-Card image generation | Full-stack eng | 1 | 1 |
| F8 preference pre-fill | Backend eng | 2 | 1 |
| A2 card-pull onboarding | Frontend eng + illustrator | 2 | 1 |
| Seeding (200 trips + hashtag posts + creator pre-launch) | BD/founder | 4 (calendar) | 1 |
| F4 Traveloka affiliate integration | Backend eng + BD | 6 | 2 |
| F3-Lite map + venue resolver | Full-stack eng | 5 | 2 |
| A3 Đường Về Quê | Full-stack eng + content writer | 5 | 2 |
| F-Sunday ritual | Frontend eng | 1 | 2 |
| Tiếng Vùng dialect mode | Backend eng | 2 | 2 |
| Ambassador program | BD | 4 (calendar) | 2 |
| Klook + Agoda integrations | Backend eng + BD | 8 | 3 |
| Optional: Sóng Đi sound postcard | Full-stack eng | 4 | 3 |
| Optional: Mơ's Notebook | Frontend eng + illustrator | 3 | 3 |
| Optional: Personal 3D World pilot | Frontend eng (Three.js spec) | 6 | 3 |
| Paid acquisition launch | Paid consultant + analyst | 6 (calendar) | 3 |
| Hộ Chiếu Mộng Mơ pilot | BD + designer | 4 (calendar) | 3 |

---

## 9. Risks & Mitigations (consolidated)

| Risk | Severity | Mitigation | Phase |
|---|---|---|---|
| Hardcoded Gemini key already leaked | Critical | Day-1 CF Worker proxy + key rotation + gitleaks | 0a |
| Decree 13 non-compliance → takedown | Critical | AIITPD dossier within 60d, DPO, consent flow | 0b |
| AI cost runaway at scale | High | $2K/mo budget + daily $80 circuit breaker + schema split + flash-lite for short trips | 0a + ongoing |
| LCP > 2.5s on VN mobile 4G | High | Lazy NatureScene + drop GSAP + drei subpath imports + code split | 0b |
| K-factor falls short of 0.30 | High | Anchor plan at K=0.10/0.20/0.30 (not 0.8). If K=0.15, slip 100K to Week 60 honestly. | All |
| Cold-start of social feed | Medium | 200 hand-authored seed trips + founder hashtag posts + 10-15 UGC pre-launch | 1 |
| AI hallucinates closed venues → trust collapse | Medium | Foursquare venue resolver + "report this place" feedback loop + freshness check | 2 |
| Affiliate chargebacks erode net revenue | Medium | Assume 15% cancellation; track net not gross | 2 |
| Affiliate tax / entity blocker | Medium | LLC vs Singapore decision before F4 payout | 2 |
| Vietnam content moderation under Decree 53/2022 | Medium | Automated filter + 1 VA moderator FTE-equivalent ($300/mo via local hire) | 2 |
| Three.js drei bundle bloat | Medium | Named imports only; audit on every PR; LCP regression budget < 10% | 0b + ongoing |
| Gemini 2.5-flash deprecation in 12mo window | Low | Abstract model name behind config; eval set for model swap | 0b |

---

## 10. Decisions Log (replaces v1 §8 open questions)

| Decision | Verdict | Source |
|---|---|---|
| Backend platform | **Hybrid:** Supabase (data/auth/realtime) + CF Workers (AI proxy/OG) + Fly.io (Phase 3 video) | Oracle |
| English i18n in Phase 1? | **No.** Cut from 100K push. Win Vietnam first. Save English for next phase. | Metis + librarian |
| Affiliate-first vs subscription? | **Affiliate-first.** Traveloka → Klook → Agoda sequencing. No subscription gating before 100K. Soft "Pro" preorder list in Phase 3 to gauge demand. | librarian + Metis |
| Social/UGC aggressiveness | **Conservative.** Fork + share + recap image. NO public feed, profiles, comments, follows before 100K. | Metis |
| Is 100K in 40wk realistic? | **~50-60% confidence with 3 FTE + $30-45K marketing.** Solo/2-FTE = 60-80wk to same target. State explicitly. | Metis |
| Is Mơ persona worth the illustrator cost? | **Yes — non-negotiable.** Mascot moat is the singular brand differentiator. Phase 0b ships it. | artistry (uncontested) |
| Card-pull vs traditional form? | **Both.** Card-pull is default onboarding (A2). Traditional form available as "advanced" toggle. | artistry + plan continuity |
| Đường Về Quê — is it really worth the database work? | **Yes.** Cultural moat foreign players will not build. Activates diaspora segment (~5M global TAM). | artistry + librarian (no objection) |

---

## 11. Phase Exit Rollback Criteria (added per Oracle)

Every phase has an entry KPI, exit KPI, AND a rollback trigger.

| Phase | Rollback trigger | Action |
|---|---|---|
| 0a | Edge proxy fails smoke test OR Sentry error rate > 5% in 48h post-cutover | Revert to old proxy, debug, do not proceed to Phase 0b |
| 0b | LCP mobile > 3.5s OR Decree 13 dossier blocked by counsel | Pause Phase 1 launch, fix before Marketing spend |
| 1 | D7 retention < 10% by Week 16 | Halt new features, run retention audit, interview 20 churned users |
| 2 | K-factor < 0.10 OR affiliate revenue < $100/mo by Week 26 | Halt Phase 3 launch, reassess viral mechanics + affiliate sequence |
| 3 | 100K MAU not on track by Week 35 AND K < 0.20 | Do not increase paid spend; reassess product-market fit honestly |

---

## 12. Final Deliverable Map

This plan locks in: **3 FTE × 40 weeks** to ship 10 production features (F1, F4, F6, F8, F-Card, A1-Mơ, A2-Card-pull, A3-Quê, F3-Lite, F-Sunday) + 3 optional stretch (Sóng Đi, Mơ's Notebook, Personal 3D World) targeting **100K MAU at ~50-60% confidence**, with honest K-factor anchoring (0.10 → 0.20 → 0.30), an explicit Vietnam-first focus, a security-first Phase 0a, and a compliance gate baked into Phase 0b.

QA strategy that protects this plan at scale is in [`2026-05-26-qa-plan-FINAL.md`](file:///Users/nhonh/Documents/personal/moodtripV2/.sisyphus/plans/2026-05-26-qa-plan-FINAL.md).

---

*End of FINAL plan. Hand off to engineering with the QA companion document.*
