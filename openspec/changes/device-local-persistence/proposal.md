# Device-Local Persistence (serverless, no database)

## Why

MoodTrip is intentionally serverless with **no database**. The app already ships a full Supabase
accounts/cloud/sharing layer, but it is **dead in production**: `AuthModal`/`MigrationBanner` are never
mounted (`App.tsx` has no entry point → `useAuth()` always returns `user: null`), Supabase env vars are
unset, and `tripsApi` (`saveTrip`/`listOwnedTrips`/`forkTrip`/`deleteTrip`) plus slug-share + OG cards are
unreachable code that only adds confusion and a placeholder-secret footgun. Meanwhile the **real** save path
is localStorage-only and fragile: `App.tsx:408` writes `SAVED_ITINERARIES_LS_KEY` with no `try/catch`, so a
`QuotaExceededError` fires confetti + "saved" feedback while the trip is silently lost; itineraries are
stored raw (~80–150 KB each) risking iOS Safari's ~5 MB PWA eviction; and there is no cross-device story
because cloud is dead.

Decision: **commit to device-local persistence as the official strategy.** Make localStorage robust, remove
the dead cloud code, and provide file-based export/import as the portability ("cross-device") answer.

## What Changes

- **P1 — Quota-safe + compressed storage**: wrap every `localStorage.setItem` in a quota-aware utility
  (catch `QuotaExceededError` → clear Vietnamese toast, no false success); compress saved itineraries with
  the existing `deflate-raw` codec in `shareService.ts` (~70% smaller); migrate existing uncompressed entries
  on read.
- **P2 — Remove dead cloud code**: delete `AuthModal`, `MigrationBanner`, `tripsApi` cloud functions,
  `supabaseClient`, `supabaseRest`, the `if (user)` auto-save branch, and all `SUPABASE_*` vars from the
  Worker config. Strip the unreachable slug-share/OG path.
- **P3 — Export / Import**: expand the stub `services/dataExport.ts` into a real export (download a
  `.moodtrip.json` of all saved trips) + import (restore on another device), with schema validation and
  friendly rejection of malformed files.
- **P4 — Saved-trips management UI**: list saved trips (title/destination), delete (localStorage-only,
  persists across reload), optional rename.
- **P5 — Share via URL-embed**: standardize on the DB-free `?trip=` compressed-URL share (works device-side);
  warn when an itinerary is too large for the URL; remove the slug/OG share UI.

## Impact

- Affected code: `App.tsx` (save/delete/fork handlers, persistence), `constants.ts`, `services/dataExport.ts`,
  `services/shareService.ts`, `components/ItineraryDisplay.tsx`, `components/Hero.tsx` (saved list); **deletions**:
  `components/AuthModal.tsx`, `components/MigrationBanner.tsx`, `services/tripsApi.ts`, `services/supabaseClient.ts`,
  `workers/edge-proxy/src/supabaseRest.ts` + `/v1/og` route + `SUPABASE_*` config.
- Risk lane: **medium** (touches the save path + deletes code) → validate:quick + unit + E2E (persistence specs)
  + review gate before archive.
- Runs on the harness defined in `e2e-harness-upgrade` (must land first).
- No proxy/API change. Pure client + dead-code removal.
