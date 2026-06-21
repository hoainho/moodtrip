# Tasks — Device-Local Persistence

## 1. Quota-safe + compressed storage (P1)
- [ ] 1.1 `services/safeStorage.ts`: `setItemSafe(key, value)` catching `QuotaExceededError` → returns false + caller toasts
- [ ] 1.2 Reuse `deflate-raw` codec from `shareService.ts`; store/read saved itineraries compressed
- [ ] 1.3 Read-time migration: detect uncompressed legacy value → load + re-save compressed
- [ ] 1.4 Wire `App.tsx:400-413` (handleSaveItineraryToList) + `ItineraryDisplay.tsx:62-68` through `setItemSafe`; toast on failure, gate confetti/"Đã lưu" on success only

## 2. Remove dead cloud code (P2)
- [ ] 2.1 Delete `components/AuthModal.tsx`, `components/MigrationBanner.tsx`
- [ ] 2.2 Delete `services/tripsApi.ts`, `services/supabaseClient.ts`, remove `useAuth`/`if (user)` paths in `App.tsx`
- [ ] 2.3 Worker: remove `src/supabaseRest.ts`, `/v1/og` route, `SUPABASE_*` from `wrangler.toml` (both `[vars]` and `[env.production.vars]`)
- [ ] 2.4 Grep-verify no `supabase` import remains; fix all dangling refs until tsc/build clean

## 3. Export / Import (P3)
- [ ] 3.1 Expand `services/dataExport.ts`: `exportTrips()` → Blob `.moodtrip.json` (version + trips[]); `importTrips(file)` with schema validation
- [ ] 3.2 UI: Export/Import buttons in the saved-trips view; friendly error on malformed import
- [ ] 3.3 Round-trip + migration unit tests in `dataExport.test.ts`

## 4. Saved-trips management UI (P4)
- [ ] 4.1 Saved list (title/destination) from `SAVED_ITINERARIES_LS_KEY`
- [ ] 4.2 `handleDeleteItinerary`: remove from state + `setItemSafe`; verify localStorage-only

## 5. Share URL-embed (P5)
- [ ] 5.1 Standardize Share on `?trip=` (shareService); warn when encoded size > ~8 KB
- [ ] 5.2 Remove slug/OG share UI + `publicShare`/`sharedTripRouter` dead paths
- [ ] 5.3 `shareService.test.ts`: size-bound + decode fidelity

## 6. Validation (per `e2e-harness-upgrade`)
- [ ] 6.1 `npm run typecheck` clean; worker tests pass
- [ ] 6.2 Unit: dataExport round-trip/migration; shareService size
- [ ] 6.3 E2E: `e2e/persistence.spec.ts` + `e2e/save-quota.spec.ts` green; `create-trip.spec.ts` regression green
- [ ] 6.4 Bundle: build succeeds, no size regression from removals (expect shrink)
- [ ] 6.5 Review gate (fresh reviewer) — per-AC evidence
