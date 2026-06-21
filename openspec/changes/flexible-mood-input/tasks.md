# Tasks — Flexible Mood Input (Hybrid)

> NO PUSH. Verify per harness (G001). Human aesthetic sign-off gate at end (như G002/G003).

## US-M1 — Data model + migration shim
- [ ] `types.ts`: add `MoodInput`; add `FormData.mood: MoodInput`; mark `Mood`/`ShortTripMood` `@deprecated` (kept for migration only); remove `moods`/`shortMoods` from active `FormData`.
- [ ] Migration shim `migrateMood(old)` for any persisted enum moods → `MoodInput`.
- [ ] tsc passes (will surface every call site to fix).

## US-M2 — Constants: seeds replace fixed moods
- [ ] `constants.ts`: add `MOOD_SEEDS`, `SHORT_MOOD_SEEDS`; remove `MOOD_OPTIONS`, `SHORT_TRIP_MOOD_OPTIONS` (and now-unused icon imports).
- [ ] Grep for stale imports of removed symbols; clean them.

## US-M3 — Prompt building (geminiService)
- [ ] Add `buildMoodText(mood: MoodInput)`; free-text fenced via `fenceUserText`; intensity → 3-level directive; seeds joined.
- [ ] Wire into `buildPrompt` (long) + `buildShortTripPrompt` (short); delete `moodTextMap`/`shortMoodTextMap`.
- [ ] Unit tests: seeds-only / text-only / both / empty(fallback) / 3 intensity levels; assert free-text is fenced; assert no `moodTextMap` references remain.

## US-M4 — TripForm UI (hero mood section)
- [ ] State `mood: MoodInput`; remove `moods`/`shortMoods`/`moodError`/`moodHints` rigid logic.
- [ ] Big free-text "Hôm nay bạn muốn chuyến đi thế nào?" textarea + example placeholder.
- [ ] Seed chips (by tripMode) — `<button aria-pressed>`, toggle into `mood.seeds` + append into textarea; clear selected state.
- [ ] Intensity slider (nhẹ→mạnh) with text labels + `aria-label` + keyboard support.
- [ ] Relax validation: submit allowed with empty mood (no `moodError`).
- [ ] `personalNote` relabelled as "ghi chú/ràng buộc thêm" (distinct from mood), kept.

## US-M5 — Update e2e + helpers
- [ ] `e2e/_helpers.ts`: replace mood-button interaction with filling the emotion textarea.
- [ ] Update `create-trip` / `a11y` / `layout` specs accordingly; keep MOCK_ITINERARY path green.
- [ ] axe: 0 serious/critical on the form (desktop + mobile).

## US-M6 — Verify
- [ ] `npm run typecheck` + `npm run build` (Node 22) green.
- [ ] Unit: `npm test` (frontend + worker) green, incl. new mood tests.
- [ ] `E2E_PORT=5180 CI=1 npm run test:e2e` green (no regression).
- [ ] Render review of new mood section (desktop + mobile) → human aesthetic sign-off. NOT pushed.
