# Phase 4 — Human Actions Required Before Cutover

> Stacked on PR #5. Merge order: PR #1 → #2 → #3 → #4 → #5 → #6.

## What's in this PR

### 1. Personal 3D World (real Three.js scene)
- `services/personalWorldScene.ts` — region-aware monument selection from trip data. 9 monument kinds (mountain, palm, pagoda, lantern, paddyField, cafeTable, riverBoat, lighthouse, tree); kind picked deterministically per `(trip.id, destination)` hash; positions on a disk with radius growing 4 → 8 with trip count.
- `components/three/PersonalWorldMonuments.tsx` — Three.js group with per-kind procedural geometry (cone/sphere/box primitives, no GLB assets needed).
- `components/three/PersonalWorldCanvas.tsx` — react-three/fiber canvas with auto-rotating OrbitControls, drei Stars backdrop, OSM-quality lighting. Lazy-imported so it doesn't bloat the main bundle.
- `components/PersonalWorldScene.tsx` — modal wrapper, loads up to 200 owned trips via `listOwnedTrips`, renders the scene or an empty-state if no trips. Closeable.
- Entry: new "🌳 Thế giới" button in the top-right button group (shown only when authed).

### 2. Anti-Itinerary mode
- `services/antiItinerary.ts` — Gemini flash-lite + Mơ persona, structured JSON output with three fields: `vibe`, `direction`, `whisper`. Strict no-schedule, no-time, no-address constraint in the prompt.
- `components/AntiItineraryView.tsx` — full-screen contemplative view with purple gradient backdrop, three-section layout (Vibe → Direction → Whisper), graceful rate-limit/budget-exceeded handling, "I'll just go" + "Give me a normal plan instead" escape hatches.
- Entry: new "🌒 Thử Anti-Itinerary" button in the result view (shown only when there's a `lastFormData` to regenerate from). Falls back to the normal generation flow if user wants a real schedule.

### 3. Trip data export (Decree 13 / GDPR portability)
- `services/dataExport.ts` — bundles user profile, preferences, trips, and consent log into a single JSON archive. `downloadArchive()` triggers a client-side download with no server roundtrip beyond the existing Supabase queries.
- `services/dataExport.requestAccountDeletionViaEdgeFunction()` — calls the `delete-account` Supabase Edge Function shipped in PR #2.
- `components/DataPortabilityPanel.tsx` — two-section panel: "Tải xuống dữ liệu" (data export) and "Yêu cầu xoá tài khoản" (account deletion with two-step confirmation).
- Entry: top-right "⚙️ Tài khoản" button (shown only when authed; falls back to "Đăng nhập" otherwise) opens the panel in a modal overlay.

## Tests
- `services/__tests__/personalWorldScene.test.ts` (5 tests): deduplication of destinations, region→kind mapping, position bounding, deterministic output.
- `services/__tests__/dataExport.test.ts` (1 test): export format version invariant.

## Verification snapshot
- **Client: 106/106 tests pass** (was 100 in Phase 3)
- **Worker: 40/40 tests pass** (unchanged)
- Frontend typecheck clean except 2 pre-existing errors in `ItineraryDisplay.tsx` and `LoadingAnimation.tsx`
- Build succeeds

## 🔴 Human Actions Required

### 1. Verify `delete-account` Edge Function is deployed (from PR #2)
The Data Portability panel calls `supabase.functions.invoke('delete-account', ...)`. If you skipped that step in PR #2:
```bash
supabase functions deploy delete-account
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 2. Optional: tune Personal 3D World performance
The scene mounts up to 200 monuments. On low-end Android, that's ~600 mesh draws. If you see frame drops:
- Reduce `listOwnedTrips(user.id, 200)` to `100` in `components/PersonalWorldScene.tsx`.
- Or add a `<Suspense>`-wrapped chunk loader with progressive monument reveal (~10 every 100ms).

### 3. Anti-Itinerary cost considerations
Each Anti-Itinerary generation consumes one Gemini call from the user's daily quota — same as a normal trip. Consider gating behind paid plan if you want to cap the cost. The prompt requests `flash-lite` model (cheaper than `flash`).

## Smoke test after deploy

1. **Personal 3D World**: log in as a user with 3+ trips → click "🌳 Thế giới" → scene loads with N monuments matching trip count → drag to rotate, scroll to zoom → "Đóng" closes.
2. **Anti-Itinerary**: generate a normal trip, then click "🌒 Thử Anti-Itinerary" → see vibe/direction/whisper sections appear within 5s → click "Cho tôi một lịch trình bình thường thay thế" → returns to normal generation.
3. **Data export**: click "⚙️ Tài khoản" → "Tải xuống dữ liệu" → file downloads with name `moodtrip-export-<userhash>-<date>.json` → inspect contents, verify trips + preferences + consent log are all present.
4. **Account deletion**: click "Yêu cầu xoá tài khoản" → two-step confirmation → on confirm, account is deleted, session signed out.

## Risks

1. **Three.js bundle bloat** — Phase 0b lazy-mounted NatureScene; Phase 4 lazy-loads `PersonalWorldCanvas`. Both share the `@react-three/fiber` + drei stack. Verify total initial JS gzip stays < 300KB via `ohmyperf`.
2. **Anti-Itinerary JSON parsing** — the model occasionally returns "I cannot help with that" style refusals. Current code throws `INVALID_ANTI_ITINERARY`; user sees a generic error. Consider adding a retry with stricter system prompt.
3. **Data export size** — at 1000 trips per user (the cap), the JSON can hit ~10 MB. Browser downloads handle that fine, but consider streaming via a Worker endpoint at 100K MAU scale.
4. **Account deletion is irreversible** — the two-step confirmation is the only guard. Consider adding a 7-day soft-delete window with reversal email if you want safety margin.
