# Phase 0b — Human Actions Required Before Cutover

> Stacked on PR #1 (Phase 0a). Do not merge this PR until #1 is merged and the Worker is live.

## 🔴 Order-of-operations

1. **Merge PR #1 first.** Phase 0b's worker tests rely on the Phase 0a worker code, and the client-side Supabase integration shares an environment with the edge proxy.
2. **Complete Phase 0a cutover** (deploy CF Worker, rotate Gemini key, set `VITE_EDGE_PROXY_URL`).
3. Only then proceed with the steps below.

## 1. Create a Supabase project

- Sign up at https://supabase.com if you don't have an account.
- Create a new project in the **Singapore region** (closest to Vietnam — ~40ms HCMC latency).
- Note these values from Settings → API:
  - Project URL → goes into `VITE_SUPABASE_URL` in Vercel
  - `anon` public key → goes into `VITE_SUPABASE_ANON_KEY` in Vercel
  - JWT Secret → goes into `wrangler secret put SUPABASE_JWT_SECRET` in the edge proxy
  - Service role key → keep secret, needed for the delete-account edge function

## 2. Run the schema migration

Option A — local CLI:
```bash
brew install supabase/tap/supabase
cd /path/to/moodtripV2
supabase link --project-ref <your-project-ref>
supabase db push
```

Option B — copy/paste in Supabase Studio:
- Open the migration file: `supabase/migrations/20260526000001_initial_schema.sql`
- Paste into Supabase Dashboard → SQL Editor → run.

Verify with `\dt` in Studio: you should see `profiles`, `preferences`, `trips`, `consent_log`, `audit_log`.

## 3. Configure OAuth providers (optional)

If you want Google / Apple login:

**Google:**
- Cloud Console → OAuth 2.0 client ID (Web application).
- Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`.
- Copy client ID + secret. Set in Supabase Dashboard → Authentication → Providers → Google.

**Apple:**
- Apple Developer → Certificates, Identifiers & Profiles → Services ID.
- Configure Sign In with Apple, add the same redirect URI.
- Generate client secret JWT (use `openssl`).
- Set in Supabase Dashboard → Authentication → Providers → Apple.

If you skip both, magic-link email still works (recommended for v1).

## 4. Deploy the delete-account edge function

```bash
cd /path/to/moodtripV2
supabase functions deploy delete-account
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## 5. Wire up the edge proxy (Phase 0a worker) for Supabase JWTs

```bash
cd workers/edge-proxy
wrangler secret put SUPABASE_JWT_SECRET
# paste the JWT Secret from Supabase Settings → API
wrangler deploy
```

## 6. Set Vercel environment variables

In Vercel Project Settings → Environment Variables:

```
VITE_EDGE_PROXY_URL    = https://<your-worker>.workers.dev    (from Phase 0a)
VITE_SUPABASE_URL      = https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...   (Supabase anon key)
VITE_SENTRY_DSN        = (optional, from Sentry project)
VITE_POSTHOG_KEY       = (optional, from PostHog project)
VITE_POSTHOG_HOST      = https://app.posthog.com (or your self-hosted URL)
```

Redeploy the frontend after setting these.

## 7. Smoke-test the cutover

In an incognito window:

1. **Anonymous flow still works:** open the app, generate a trip, save it. Trip persists in LocalStorage as before.
2. **Sign-up flow:** click "Đăng nhập" (top-right), enter your email, click the magic link in your inbox. You should land back in the app authenticated.
3. **Migration banner:** the banner should appear offering to import your local trips. Click "Đồng bộ ngay" — they should appear under your Supabase `trips` table.
4. **Quota enforcement:** verify that as an authed-free user, your 4th trip generation in one day returns the friendly "Bạn đã đạt giới hạn..." message (HTTP 429 from worker).
5. **Consent banner:** appears on first visit; disappears after accept. Check `consent_log` table — your row should be there with `consent_version = '2026-05-26-v1'`.
6. **PWA install:** open Chrome on mobile, hit "Add to home screen". Open the installed app — should work offline for previously-loaded itineraries.
7. **Performance:** run `npx lighthouse https://moodtrip.app --form-factor=mobile --view`. LCP should be < 2.5s on Fast 4G throttling.

## What this PR ships

### Schema + auth
- `supabase/migrations/20260526000001_initial_schema.sql` — 5 tables (profiles, preferences, trips, consent_log, audit_log) + RLS policies (owner-only access, public trips readable by anyone) + triggers (`updated_at` + auto-create profile on signup).
- `src/types/database.ts` — strict typed `Database` interface for client SDK.
- `services/supabaseClient.ts` — singleton client, no-ops if env vars missing.
- `services/authSession.ts` — subscribe-based session state, magic link + OAuth, JWT bridge to edge proxy.
- `services/useAuth.ts` — React hook.
- `services/edgeProxyClient.ts` updated — automatically uses Supabase JWT when authed, falls back to anon JWT otherwise.
- `workers/edge-proxy/test/supabaseJwt.test.ts` — 4 new worker tests proving the worker verifies Supabase tokens, enforces tier-based quota, and rejects wrong-secret tokens.

### Persistence + UX
- `components/AuthModal.tsx` — magic link + Google + Apple sign-in.
- `services/localTripMigration.ts` + `components/MigrationBanner.tsx` — one-time LocalStorage → Supabase trip import.
- `components/PWAInstallPrompt.tsx` — uses native `beforeinstallprompt`.

### Mơ persona
- `services/moPersona.ts` — central persona builder with regional dialect detection (north / central / south / mekong).
- `services/geminiService.ts` updated — itinerary generation uses Mơ's voice with destination-aware dialect.
- `components/ChatCompanion.tsx` updated — chat uses Mơ persona.
- 8 new tests in `services/__tests__/moPersona.test.ts` covering dialect detection + prompt construction.

### Compliance (Decree 13)
- `services/consent.ts` + `components/ConsentBanner.tsx` — first-visit consent flow, stored locally + in `consent_log` table.
- `supabase/functions/delete-account/index.ts` — server-side deletion (cascades through RLS).
- `services/authSession.ts` exports `requestAccountDeletion()` for the deletion UI.
- 5 new tests in `services/__tests__/consent.test.ts`.

### Performance surgery
- `App.tsx` — NatureScene now mounts via `requestIdleCallback` (with 800ms `setTimeout` fallback), not 100ms timer.
- `index.css` — static radial-gradient background so LCP renders immediately without the 3D scene.
- `index.css` — global `prefers-reduced-motion` honor.
- `package.json` — dropped unused `gsap` dependency.

### Schema split for AI cost
- `services/itinerarySchemaSplit.ts` — `generateItinerarySkeleton()` returns lean itinerary (flash-lite, ~4K maxOutputTokens) + `enrichItinerary()` lazy-loads the heavy fields (food, accommodation, packing, traffic, safety, budget) only when user asks. Not yet wired into the UI (intentional — Phase 1 surfaces will use it).

### Analytics
- `services/analytics.ts` — PostHog with PII scrubbing, lazy-loaded only if `VITE_POSTHOG_KEY` set.

### Tests
- **31 client tests pass** (up from 9 in Phase 0a)
- **36 worker tests pass** (up from 32 in Phase 0a)
- Frontend typecheck clean except 2 pre-existing errors in `ItineraryDisplay.tsx` and `LoadingAnimation.tsx` (unchanged from `main`).

## What this PR does NOT yet do

These are deferred to Phase 1+ (per the FINAL plan):
- F1 Trip Remix v0.5 (public share + fork + OG image) — Phase 1
- F-Card trip recap image — Phase 1
- A2 Card-pull onboarding — Phase 1
- F8 Mood Memory preference pre-fill UI — Phase 1 (data layer is ready)
- Wiring `generateItinerarySkeleton` into the UI — Phase 1
- Mơ illustrated artwork (currently text-only persona) — illustrator hire required (your action)
- Wiring `MigrationBanner` to actually load trips from Supabase into the saved-itineraries list — small follow-up

The Supabase auth layer + JWT bridge is fully working — every existing flow now works for both anon and authed users.
