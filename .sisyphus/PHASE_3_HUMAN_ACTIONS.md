# Phase 3 — Human Actions Required Before Cutover

> Stacked on PR #4. Merge order: PR #1 → #2 → #3 → #4 → #5.

## 1. Optional: load handwriting font

Mơ's Notebook uses a `Caveat`/`Be Vietnam Pro` handwriting fallback stack. For best visual:

- Add to `index.html` `<head>`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap" rel="stylesheet">
  ```
- Or self-host via the same workflow as the existing `Be Vietnam Pro`.

## 2. Sóng Đi — no infrastructure needed

The recorder is fully client-side (WebAudio + MediaRecorder). Recorded audio stays on-device unless you later wire upload to Supabase Storage (not in this PR).

## 3. Mơ persona illustration

`Mơ viết thư cho bạn` currently renders text + SVG doodle placeholders. Once you hire the Vietnamese watercolor illustrator (per FINAL plan), drop replacement SVGs into `services/moNotebook.ts` `DOODLE_SVG_LIBRARY`.

## 4. Personal World — Supabase RLS reminder

`PersonalWorldBadge` calls `listOwnedTrips()` which uses the `trips_owner_all` RLS policy from Phase 0b. Verify this policy is still active in Supabase Studio before relying on the badge to scope correctly.

## 5. F1 public share — verify slug uniqueness

`PublicShareButton` uses `ensurePublicTrip()` which generates a fresh `share_slug` via `generateShareSlug()` if no public version exists. The `UNIQUE` constraint on `share_slug` in the migration catches collisions, but the client doesn't currently retry on collision — extremely rare (10^15 space) but worth flagging.

## 6. Smoke test after deploy

1. **Mơ's Notebook**: open a result view → click "✍️ Mơ viết thư cho bạn" → letter renders within 8s → click "In / Lưu PDF" → printable layout opens.
2. **Personal World badge**: log in as a user with 0 / 1 / 5 / 10+ trips and verify milestone progression.
3. **Tiếng Vùng dialect override**: open `About` page (or wherever you mount `<RegionDialectSelector>`), pick "Miền Trung" → generate a trip to Sài Gòn → Mơ should now use central dialect instead of southern.
4. **Sóng Đi**: open a result view on a mobile device with mic permission → tap "Bắt đầu ghi" → 5s recording → waveform visualization appears → playback works.
5. **F1 public share**: log in, generate a trip, click "🔗 Chia sẻ công khai" → URL returned → open in incognito → SharedTripView loads with itinerary visible.

## What this PR ships

### Mơ's Notebook — End-of-trip handwritten letter
- `services/moNotebook.ts`:
  - `composeMoLetter(trip)`: calls Gemini flash-lite with Mơ persona + structured JSON schema
  - `buildDoodleSvg(seed)`: 4 preset SVG doodles (nón lá, cafe, biển, núi) + text fallback
- `components/MoNotebookModal.tsx`:
  - Letter modal with paper-textured background, Caveat handwriting font
  - In-modal `print()` action that opens a print-friendly window with full letter + doodle
  - Graceful handling of RATE_LIMIT_EXCEEDED / BUDGET_EXCEEDED with VN copy
- Wired into result view as "✍️ Mơ viết thư cho bạn" CTA

### Sóng Đi — Sound postcard (scaffolding)
- `services/songDi.ts`:
  - Browser feature detection (MediaRecorder + getUserMedia + supported MIME types)
  - `startSoundRecorder({ maxDurationMs, label })`: 5-second cap, cleans up MediaStream tracks
  - `computeWaveform(blob, samples)`: client-side WebAudio decode + peak extraction for visualization
- `components/SongDiRecorder.tsx`:
  - 5-state machine: idle/requesting/recording/processing/ready
  - Live waveform visualization after recording
  - Audio playback with `<audio controls>`
  - Graceful unsupported-device fallback
- NOT yet wired into the UI by default — left as a building block. Mount as `<SongDiRecorder destination={trip.destination} />` wherever appropriate (e.g., a "post-trip ritual" page).

### Personal World — Trip-derived identity
- `services/personalWorld.ts`:
  - `buildWorldStats(trips)`: counts trips, unique destinations, regions visited (north/central/south/mekong/highlands), top mood tags
  - 5 milestones: Lá thứ nhất → Cây nhỏ → Bụi tre → Vườn nhỏ → Rừng riêng
- `components/PersonalWorldBadge.tsx`:
  - Stats grid + progress bar toward next milestone
  - Only renders for authed users with at least 0 trips loaded
- Mounted in result view above the map

### F1 — Public Share Button (finally wired)
- `components/PublicShareButton.tsx`:
  - One-click "🔗 Chia sẻ công khai" → calls `ensurePublicTrip()` from Phase 1
  - Returns copyable share URL + 14-day cookie-safe attribution chain
  - Auth-gated (opens AuthModal if anonymous)
- Mounted next to Mơ Notebook button in result view

### Tiếng Vùng — Settings UI
- `components/RegionDialectSelector.tsx`:
  - 5 options: auto / north / central / south / mekong (with VN dialect samples)
  - Saves to `preferences.region_dialect` via `setRegionDialect()` (added in Phase 2)
  - NOT yet mounted in the app — drop into a future Settings page or About page
- Backend was wired in Phase 2; this PR adds only the UI control

### Tests
- `services/__tests__/moNotebook.test.ts` (5 tests): SVG doodle output, fallback behavior, XML escaping
- `services/__tests__/personalWorld.test.ts` (8 tests): regional classification, milestone ladders, mood aggregation, empty trips edge case
- `services/__tests__/songDi.test.ts` (1 test): feature detection in happy-dom

### Verification
- **Client: 100/100 tests pass** (up from 87)
- **Worker: 40/40 tests pass** (unchanged)
- Frontend typecheck clean except 2 pre-existing errors
- Build succeeds

## What this PR does NOT yet do

- **Personal World 3D visualization** — currently a stats badge only. Real 3D monument placement in NatureScene needs custom Three.js assets and a designer. Deferred.
- **Sóng Đi server-side stitching into postcard video** — recorder is client-side only. Server-side ffmpeg pipeline (per FINAL plan) needs Fly.io worker. Deferred.
- **RegionDialectSelector mounted** — component exists but no Settings page mounts it. Easy follow-up.
- **Mơ Notebook → R2 storage** — letters are ephemeral (modal). To persist, write to `trips.enrichment.mo_letter`. Easy follow-up.
- **Public share OG meta tags in `index.html`** — same deferral as Phase 1.
- **Watercolor illustrator artwork** — all visuals are emoji/SVG placeholders.

## Risks (Phase 3 specific)

1. **Mơ Notebook calls Gemini** — counts against the user's daily quota. Free users get 3 generations/day; a notebook letter consumes 1. Consider gating behind paid plan if cost matters.
2. **`composeMoLetter` schema drift** — Gemini sometimes returns slightly different JSON shapes. The parser uses bracket extraction + structure check; retry logic is single-attempt. If this becomes a real reliability issue, port the retry+JSON-extract logic from `geminiService.ts`.
3. **Sóng Đi mic permission** — many users will reject mic access. UI gracefully degrades, but you'll see a high dismissal rate in analytics.
4. **PersonalWorldBadge fetches 100 trips on mount** — at scale, paginate or use a count-only query. Currently fine for early users (<100 trips/user).
5. **`print()` popup blocked** — many browsers block `window.open` from non-user-gestures. The current implementation triggers from click handler so should be fine, but verify on iOS Safari.
