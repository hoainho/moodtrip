# Phase 1 — Human Actions Required Before Cutover

> Stacked on PR #2 (Phase 0b). Do not merge until PR #1 and #2 are merged AND Supabase project is live.

## 🔴 Order-of-operations

1. Merge PR #1 (Phase 0a edge proxy + key rotation).
2. Complete PR #2 cutover (deploy Worker, create Supabase project, run migration). Merge PR #2.
3. Then proceed below.

## 1. Update Worker secrets for OG image rendering

The Worker now needs Supabase REST access to fetch trip metadata for OG cards:

```bash
cd workers/edge-proxy
wrangler secret put SUPABASE_URL          # https://<your-project>.supabase.co
wrangler secret put SUPABASE_ANON_KEY     # from Supabase Settings → API
wrangler deploy
```

The new endpoint is `GET /v1/og/:slug` — returns a 1200×630 PNG (via Satori + resvg-wasm) or a fallback SVG.

## 2. Configure share URLs in your domain

If you deploy at `https://moodtrip.app`, shared trips live at `https://moodtrip.app/t/<slug>`. The `parseCurrentRoute()` helper detects this path client-side; Vercel SPA routing already handles it.

For OG meta tags, you'll want to inject server-side meta tags pointing at the Worker's `/v1/og/:slug` endpoint. Currently the OG meta is rendered client-side (won't be seen by Zalo/Facebook scrapers). Follow-up: add edge middleware on Vercel or update `index.html` to use a Vercel Edge Function for OG metadata. Tracked as a TODO in this PR; not a blocker for launch.

## 3. (Optional) Seed 200 sample public trips

Per the librarian's social-feed cold-start research, F1 needs seed content before public launch. After Supabase is live:

```bash
# Manual approach: open Supabase Studio → SQL Editor and run
# (sample insert template; repeat for 200 curated trips you'd hand-author):
INSERT INTO trips (owner_id, destination, trip_mode, form_input, skeleton, is_public, share_slug)
VALUES (
  '<your-admin-user-id>',
  'Đà Lạt 3 ngày 2 đêm',
  'long',
  '{"moods":["relax","nature"],"budget":3000000}'::jsonb,
  '<paste itinerary JSON>'::jsonb,
  true,
  '<10-char-slug-from-generateShareSlug>'
);
```

A proper admin seeding script is not included in this PR (deferred). You can:
- Use the app yourself logged in as an admin, generate 200 trips, toggle each public.
- Or write a one-off Node script using the Supabase service role key.

## 4. Smoke test in production

After Worker + Supabase are live and PR #2 is merged:

1. Generate a trip (logged in). Verify it appears in `trips` table in Supabase.
2. Toggle that trip public (manually update `is_public = true` and `share_slug` in Supabase Studio for now).
3. Open `https://moodtrip.app/t/<slug>` in incognito — should render the SharedTripView.
4. Open `https://api.moodtrip.app/v1/og/<slug>` — should render a 1200×630 image.
5. Open the app fresh → click "Bắt đầu" → should land on card-pull onboarding.
6. Shake your phone (mobile) or click "Rút bài" → 3 cards reveal.
7. Click "Đi với quẻ này →" → form pre-fills with mood + personal note "Mơ rút quẻ: …".
8. Submit form → generate trip → preferences are auto-saved.
9. Sign out + sign in again → next trip form should pre-fill mood + budget from saved preferences.
10. Fork flow: from `/t/<slug>` page click "Remix lịch trình này" → if signed in, copy of trip lands in your saved list with `parent_remix_id` pointing at the original.

## What this PR ships

### F1 — Trip Remix v0.5
- `services/tripsApi.ts` — CRUD: `saveTrip`, `listOwnedTrips`, `getTripBySlug`, `togglePublic`, `deleteTrip`, `forkTrip`. Slug generation uses 32-char alphabet (no `l/1/0/o`) for unambiguous sharing.
- `services/sharedTripRouter.ts` — client-side `/t/:slug` route detection + URL builders.
- `services/publicShare.ts` — `ensurePublicTrip()` helper that creates-or-toggles a public copy.
- `components/SharedTripView.tsx` — minimal viewer + "Remix" CTA (auth-gated; opens AuthModal if anon).
- `App.tsx` — boot-time route check, popstate listener, fork-success → loads forked trip into current session.

### F-Card — Trip Recap Image
- `workers/edge-proxy/src/recapCard.ts` — Satori JSX builder (1200×630, brand palette, top 4 activities, optional handle).
- `workers/edge-proxy/src/index.ts` — new `GET /v1/og/:slug` endpoint with Satori + resvg-wasm rendering, 300s edge cache, SVG fallback if Satori fails.
- `workers/edge-proxy/src/supabaseRest.ts` — read-only REST helper using Supabase anon key.

### F8 — Mood Memory
- `services/preferencesApi.ts` — `loadPreferences()` + `savePreferencesFromTrip()` (merges with existing, caps at 6 moods).
- `App.tsx` — on auth, loads preferences and pre-fills new trips; on successful generate (authed), saves preferences + persists trip to Supabase in background.

### A2 — Card-pull Onboarding
- `services/cardPullDeck.ts` — 6×6×6 = 216 unique combinations across element/tempo/companion. `shuffleAndPull()` accepts custom RNG for determinism. `pullToMoods()` maps cards onto existing `Mood`/`ShortTripMood` taxonomy.
- `components/CardPullOnboarding.tsx` — shake-to-pull via `DeviceMotionEvent` (with iOS permission request) + button fallback. 3-card slot grid with watercolor placeholder. "Đi với quẻ này →" CTA, plus escape hatch to traditional form.
- Hero `onStart` → card-pull → form (with prefilled moods + narrative as `personalNote`).

### Tests
- `services/__tests__/cardPullDeck.test.ts` — 8 tests including uniformity check across 5,000 trials.
- `services/__tests__/sharedTripRouter.test.ts` — 6 tests covering route parsing edge cases.
- `services/__tests__/tripsApi.test.ts` — 4 tests for slug generation (length, alphabet, uniqueness).
- `workers/edge-proxy/test/recapCard.test.ts` — 4 tests for Satori JSX tree.

### Verification snapshot
- **Client: 50/50 tests pass** (was 31 in Phase 0b)
- **Worker: 40/40 tests pass** (was 36 in Phase 0b)
- Frontend typecheck clean except 2 pre-existing errors unchanged from main
- Worker typecheck clean
- Frontend build succeeds

## What this PR does NOT yet do

Deferred items, in priority order:
- **Server-side OG meta tags in index.html** — currently client-rendered, so Zalo/Facebook scrapers won't see the recap card preview. Fix via Vercel Edge Function or a small Express/Hono SSR layer.
- **F1 share button in ItineraryDisplay** — `publicShare.ensurePublicTrip()` is wired but no UI button exposes it yet. Easy follow-up: add a "Chia sẻ công khai" button in the existing share modal.
- **MigrationBanner integration with `listOwnedTrips`** — after migration, the saved-itinerary list doesn't auto-refresh from Supabase. Minor UX polish.
- **Mơ illustrated artwork on cards** — currently emoji placeholders. Awaits your illustrator hire.
- **Admin seeding script for 200 trips** — manual approach documented above.
- **A2 watercolor card backs (instead of emoji)** — same illustrator dependency.
- **F-Card client-side fallback** — currently relies on Worker `/v1/og/:slug`. For environments where Worker is down, no client-side render path exists yet.

## Risks (under "designed contract, not deployed" assumption)

You authorized me to ship Phase 1 before Phase 0a/0b are deployed. Specific drift risks:

1. **Supabase REST API key handling** — Worker reads via `SUPABASE_ANON_KEY` which respects RLS. Public trips have an explicit `is_public = true AND share_slug = ...` filter. If you change the RLS policy after deploy, the OG endpoint may break.
2. **Worker bundle size** — adding `satori` + `@resvg/resvg-wasm` to the Worker bumps deploy size. Cloudflare's 1MB Worker limit may need the paid plan ($5/mo). Verify on `wrangler deploy` output.
3. **Slug collision** — `generateShareSlug` uses 32-char alphabet × 10 chars = ~1.1 × 10¹⁵ space. At 100K trips with collision probability ~5×10⁻⁶, statistically zero collisions expected; UNIQUE constraint on the column will catch any race.
4. **DeviceMotionEvent on iOS** — requires user gesture before `requestPermission`. Currently called from button click, which should work; verify in real Safari iOS at launch.
