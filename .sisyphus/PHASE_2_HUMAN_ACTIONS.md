# Phase 2 — Human Actions Required Before Cutover

> Stacked on PR #3 (Phase 1). Merge order: PR #1 → #2 → #3 → #4.

## 1. Affiliate program signups

You must register MoodTrip with each affiliate network before any clicks can be attributed to you:

### Traveloka (primary — 14-day cookie, 6.4% VN hotel upsize)
- Apply via Ecomobi: https://ecomobi.com/how-to-join-traveloka-affiliate-on-ecomobi-passio/
- Or directly: https://www.traveloka.com/en-en/p/affiliate
- After approval, get your **AID** (replaces `MOODTRIP_TVL` in `services/affiliate.ts`)
- Wait time: typically 5-10 business days

### Klook (Klook Kreator program)
- Apply: https://affiliate.klook.com/
- Get your **AID** (replaces `MOODTRIPKK`)

### Agoda (lowest priority — session-only cookie limits monetization fit)
- Apply: https://www.agoda.com/press/agoda-ambassador/
- Get your **CID** (replaces `MOODTRIPAG`)

Once approved, edit `services/affiliate.ts` (the `AFFILIATE_IDS` constant) with the real IDs and open a follow-up PR.

## 2. Tax / business entity decision (required before first payout)

Vietnamese affiliate income to a personal account vs LLC vs Singapore entity has 5-20% tax difference. Per Metis critique:

- **Personal account:** subject to Vietnamese PIT (5-35%)
- **Vietnamese LLC:** business income tax (20%) + dividend tax
- **Singapore Pte Ltd:** 17% corporate tax, easier for cross-border affiliate payments

Discuss with an accountant before activating affiliate links in production.

## 3. Edge proxy variables

No changes needed to the Worker for Phase 2 — affiliate click tracking is fully client-side (PostHog event + window.open redirect).

## 4. Vercel env

No new env vars required. Existing `VITE_POSTHOG_KEY` (from Phase 0b checklist) covers affiliate event tracking.

## 5. Sunday Dream timezone notes

The Sunday Dream window opens at **16:00 local time** (user's device clock), Sundays only. There's no server-side scheduling; the banner shows when `getSundayWindow().isOpen` is true.

For users who don't open the app during the Sunday afternoon window, the banner never shows that week — that's by design (the ritual is meant to be opt-in, not push).

## 6. Smoke test in production

After PR #4 is merged + deployed:

1. **Affiliate button:** generate a trip, find any venue, manually inject a Traveloka URL test via dev tools, verify:
   - Click on non-allowed domain → blocked with reason `BLOCKED_DOMAIN`.
   - Click on allowed domain without consent → shows consent prompt.
   - After accepting consent → opens new tab with decorated URL (verify `aid=...&sub_id=...` query params present).
2. **Map:** view a trip with `google_maps_link` containing `?q=lat,lng` or `@lat,lng` — markers should appear at the right places, numbered by day.
3. **Đường về quê:** click "🏡 Về quê" button (top-right), pick a province, verify form pre-fills with the emotional prompt + cultural moods.
4. **Sunday Dream:** if it's Sunday afternoon, banner appears bottom-right. If not, manually set system clock to Sunday 17:00 and reload — should appear. Tap "Mơ ngay" → goes to card-pull, streak counter increments.
5. **TikTok deep-link:** on map popup, click "Xem TikTok về địa điểm" → opens TikTok search in new tab.
6. **Map performance:** verify the map only loads when a trip is shown (lazy-imported `maplibre-gl` + CSS).

## What this PR ships

### F4 — Traveloka Affiliate (primary), Klook, Agoda
- `services/affiliate.ts`:
  - **Domain allowlist** per partner (https-only, exact-hostname match)
  - **Click ID** generated via `crypto.getRandomValues` (16 hex chars, ~10^19 space)
  - URL decoration with the right query param per partner (Traveloka `aid+sub_id`, Klook `aid+aff_label`, Agoda `cid+tag`)
  - **Consent gate**: tied to `ai_generation_cross_border` scope; if user hasn't accepted, shows in-banner consent UI before redirecting
  - PostHog event `affiliate_click_<partner>` fires with click_id, productType, venueName, destination, tripId
- `components/AffiliateButton.tsx`: drop-in component, two variants (primary / subtle), handles the consent dance + new-tab redirect

### F3-Lite — Static Map + Venue Resolver
- `services/venueResolver.ts`:
  - Parses both `?q=lat,lng` and `@lat,lng` formats from Google Maps URLs
  - Builds TikTok search deep-link per venue (Vietnamese-friendly: appends destination)
  - `computeBounds()` for auto-fit on map load
- `components/TripMap.tsx`:
  - MapLibre GL with OSM tiles (FREE — no Google Maps API cost, librarian-validated)
  - Lazy-imported (CSS + JS only when result view shown)
  - Markers numbered by day, click → popup with "Mở Google Maps" + "Xem TikTok"
  - Fallback state when no coords resolve
- Mounted under ItineraryDisplay in result view

### A3 — Đường Về Quê (Ancestral Hometown Mode)
- `services/duongVeQue.ts`:
  - Seeded database of 17 provinces across 5 regions (north / central / south / mekong / highlands)
  - Each province has emotional prompts, landmarks, signature dishes
  - `buildQueSeed()` picks a random emotional prompt for variety
  - `buildQuePersonalNote()` produces a Mơ-style note: "Chuyến đi về quê {province}. {prompt} ..."
- `components/DuongVeQueModal.tsx`: searchable province list, click → seeds form with destination + personalNote + cultural moods
- Top-right "🏡 Về quê" button entry point
- **Cultural moat note**: this is the feature foreign competitors will not build. Tet diaspora + family heritage trips = a long-tail user segment.

### F-Sunday — Sunday Dream Ritual
- `services/sundayDream.ts`:
  - Window detection: Sundays after 16:00 local time
  - Streak counter (consecutive Sundays, resets if a Sunday is skipped)
  - Local-storage only — no server dependency
  - Idempotent (same Sunday recorded twice doesn't double-count)
- `components/SundayDreamBanner.tsx`: bottom-right corner banner, gradient purple/pink for distinction, "🔥 Chuỗi N chủ nhật" streak display
- Tap → Card-pull onboarding

### Tiếng Vùng — Regional Dialect
- Already implemented at the persona level (`services/moPersona.ts` regional dialect injection from Phase 0b)
- Added `services/preferencesApi.setRegionDialect()` for explicit user override (UI for it deferred to Phase 3 to keep this PR scoped)

### Tests
- `services/__tests__/affiliate.test.ts` (10 tests): domain allowlist, URL decoration, consent gating, click ID uniqueness
- `services/__tests__/venueResolver.test.ts` (7 tests): both Google Maps URL formats, bounds calculation, TikTok query encoding
- `services/__tests__/duongVeQue.test.ts` (7 tests): regional coverage, prompt randomness, case-insensitive lookup
- `services/__tests__/sundayDream.test.ts` (7 tests): window detection by day-of-week + hour, streak increment/reset/idempotency

### Verification
- **Client: 87/87 tests pass** (up from 50)
- **Worker: 40/40 tests pass** (unchanged from Phase 1)
- Frontend typecheck clean except 2 pre-existing errors
- Build succeeds

## What this PR does NOT yet do

- **UI for "Tiếng Vùng" preference toggle** — the data field is wired in preferences table + service, but no settings page exists yet. Phase 3 work.
- **Real affiliate IDs** — placeholders only. Replace after partner approvals.
- **Affiliate revenue dashboard** — PostHog events fire, but no aggregation view yet.
- **Sunday Dream push notification** — currently banner-only when app is open. Phase 3 work (requires service worker push setup).
- **Đường về quê illustration** — text-only. Awaiting illustrator hire.
- **F1 share button in ItineraryDisplay** — still deferred from Phase 1. Easy follow-up.

## Risks (Phase 2 specific)

1. **Affiliate ID rotation** — when you get real partner IDs, you'll need to redeploy. Click IDs in flight at rotation time may not attribute correctly. Plan a low-traffic deploy window.
2. **Province name normalization** — Vietnamese diacritics. Currently doing case-insensitive exact match. "huế" matches "Huế" but "Hue" (no diacritic) doesn't. Phase 3 can add diacritic-fold normalization.
3. **Map tile costs at scale** — using OSM tiles (free, but bound by acceptable use policy: ~2 req/s/IP). At 100K MAU you may hit limits. Migration path: Maptiler ($25/mo for 100k tiles) or self-hosted vector tiles.
4. **MapLibre bundle size** — ~150KB gzipped. Lazy-loaded so doesn't affect LCP. Verify via Lighthouse after deploy.
5. **DST in Sunday Dream** — Vietnam doesn't observe DST, but if you i18n to a DST country later, the 16:00 cutoff will shift twice a year. Trivial fix when i18n happens.
