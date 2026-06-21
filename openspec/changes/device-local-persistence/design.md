# Design — Device-Local Persistence: Acceptance Criteria & E2E

## Definition of Done (every story)
`tsc` clean · unit pass · `npm run build` OK · no new console errors · mapped E2E specs green · no bundle-budget regression.

## Acceptance Criteria

### P1 — Quota-safe + compressed storage
- **AC-P1.1** Saving a trip then doing a **full page reload** → the trip is still present in the saved list.
- **AC-P1.2** The persisted `moodtrip_saved_itineraries_list` value is **compressed** (deflate-raw, not raw JSON) and decompresses losslessly to the original object.
- **AC-P1.3** When `localStorage.setItem` throws `QuotaExceededError`: a clear Vietnamese toast appears (e.g. "Bộ nhớ thiết bị đã đầy…"), the app does **not** crash, and **no** success affordance (confetti/"Đã lưu") is shown.
- **AC-P1.4** Pre-existing **uncompressed** saved entries still load after the change (read-time migration); no data loss on upgrade.

### P2 — Remove dead cloud code
- **AC-P2.1** No `supabase*` import remains in the frontend source/bundle; `AuthModal`/`MigrationBanner`/`tripsApi` cloud fns are deleted.
- **AC-P2.2** `tsc` + `npm run build` + unit + existing E2E all pass after removal (no dangling refs).
- **AC-P2.3** No `SUPABASE_*` keys remain in `workers/edge-proxy/wrangler.toml`; the `/v1/og` route + `supabaseRest` are removed; worker tests pass.
- **AC-P2.4** Create-trip + save + share flows show **no regression** vs current behavior.

### P3 — Export / Import
- **AC-P3.1** "Export" downloads a `.moodtrip.json` containing all saved trips; the file parses as valid JSON matching the documented schema (version + trips[]).
- **AC-P3.2** With storage cleared, "Import" of that file restores every trip into the saved list (visible after import).
- **AC-P3.3** Importing a malformed/incompatible file shows a friendly error and does not crash or partially corrupt existing data.
- **AC-P3.4** Round-trip (export → clear → import) yields byte-identical trip data (unit-asserted).

### P4 — Saved-trips management UI
- **AC-P4.1** The saved list renders every stored trip with title + destination.
- **AC-P4.2** Delete removes the trip from the UI **and** from `localStorage`, persists across reload, and touches no network.

### P5 — Share via URL-embed
- **AC-P5.1** "Share" produces a URL containing a compressed `?trip=` param; opening it in a **fresh browser context** renders the shared itinerary with no backend call.
- **AC-P5.2** A multi-day itinerary either stays under the practical URL limit (~8 KB) or the UI warns the user; verified by a unit size check.
- **AC-P5.3** The slug/OG share UI is gone — no path that 404s without a DB.

## E2E mapping (specs run on the `e2e-harness-upgrade` harness, MOCK_ITINERARY)

| Spec file | Covers | Key assertions |
|---|---|---|
| `e2e/persistence.spec.ts` | P1.1, P3, P4, P5 | generate→save→reload→present; export download → assert file JSON; clear+import→present; delete→absent after reload; capture `?trip=` URL → new context → renders |
| `e2e/save-quota.spec.ts` | P1.3 | `addInitScript` overrides `localStorage.setItem` to throw `QuotaExceededError` on the trips key → assert toast text + no confetti + app alive |
| (unit) `services/__tests__/dataExport.test.ts` | P3.4, P1.2, P1.4 | compress/decompress round-trip; export/import fidelity; uncompressed→compressed migration |
| (unit) `services/__tests__/shareService.test.ts` | P5.2 | encoded `?trip=` size bound; decode fidelity |
| existing `e2e/create-trip.spec.ts` | P2.4 | regression — still green after cloud removal |

**Determinism:** all specs use `MOCK_ITINERARY` (deterministic Đà Lạt fixture) so generated content is stable;
`preacceptConsent` + `gotoHome` helpers reused. localStorage is cleared per test via a fresh context.

## Notes / decisions
- Compression reuses `shareService.ts`'s `deflate-raw`; do **not** add a new dep.
- "Cross-device" = explicit user export/import file, not silent sync. This is the documented limitation.
- Removing `/v1/og` is safe: it depends on Supabase which is being removed; OG social cards are dropped (documented).
