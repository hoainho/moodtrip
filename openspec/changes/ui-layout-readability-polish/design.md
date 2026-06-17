# Design — UI Layout & Readability Polish: Acceptance Criteria & E2E

## Definition of Done (every story)
`tsc` clean · unit pass · `npm run build` OK · no new console errors · mapped E2E specs green · visual baselines
reviewed + approved · no contrast regression (axe).

## Acceptance Criteria

### L1 — Responsive result layout
> ⚠️ STRUCTURAL NOTE (review finding): `<TripMap>` is currently rendered by **`App.tsx:574`**, OUTSIDE
> `ItineraryDisplay` and below it (separate `max-w-3xl` block, outside its error boundary). A real sticky
> right rail requires the timeline column and the map panel to be **siblings in the same scroll container**.
> So L1 is a structural refactor (lift `TripMap` into the 2-col container or restructure the App↔ItineraryDisplay
> seam), NOT a CSS-grid tweak — split into L1-layout + L1-map below. Also handle the existing `sticky top-0`
> header (two stacked sticky contexts) and call `map.resize()` on breakpoint/layout change.
- **AC-L1.1** At viewport ≥1024px the result renders **two columns**: timeline (left) + a **sticky** panel
  (right) with map + vitals/budget + section jump-nav. Asserted: at 1280px the map container's bounding box
  sits in the right half AND stays in view (position sticky) while the timeline scrolls; `map.resize()` fires
  on breakpoint change (no clipped/blank tiles).
- **AC-L1.2** At <768px it remains a single column (no horizontal scroll, no overlap).
- **AC-L1.3** Total result page scroll height at 1280px is meaningfully shorter than the current single-column
  baseline (recorded before/after).

### L2 — Readable over 3D
- **AC-L2.1** Every text block rendered over a 3D scene sits on a scrim/overlay achieving **≥4.5:1** contrast
  (axe-core, no contrast violations on landing/card-pull/form headers).
- **AC-L2.2** Card-pull cards have a solid/blurred panel + border (not bare over terrain) and a visible
  **label/caption** describing each card.

### L3 — Gradient discipline
- **AC-L3.1** Each screen has **at most one** gradient CTA (the primary action); secondary buttons are
  solid/ghost. Static check + visual baseline.

### L4 — Result IA / zero-states
- **AC-L4.1** Above-the-fold on load = hero + vitals + Day 1 (secondary sections below / anchored).
- **AC-L4.2** A zero metric (e.g. Trending = 0) is reframed ("Không có điểm trending") or omitted, never a bare "0".

### L5 — Hero composition + typography/a11y
- **AC-L5.1** Landing hero uses an intentional grid balancing headline + 3D; the three value chips are a single
  coherent strip (not scattered).
- **AC-L5.2** Body text ≥14px everywhere; axe-core reports **0 serious/critical** contrast/a11y violations on
  landing, form, result (desktop + mobile).

## E2E mapping (runs on `e2e-harness-upgrade` harness, MOCK_ITINERARY)

| Spec file | Project | Covers | Key assertions |
|---|---|---|---|
| `e2e/layout.spec.ts` | desktop + `@mobile` | L1.1–L1.3, L4 | at 1280px assert 2-col bounding boxes + map `position:sticky` + scroll-height delta; at 390px single-column, no overflow; Day 1 above fold; no bare "0" metric |
| `e2e/a11y.spec.ts` | desktop + `@mobile` | L2.1, L5.2 | inject `@axe-core/playwright`; assert 0 serious/critical violations on landing/form/result |
| `e2e/visual-3d.spec.ts` (extend) | `chromium-visual` | L2.2, L3.1, L5.1 | `freezeScene` then `toHaveScreenshot` for landing/card-pull/form/result desktop+mobile (gradient/scrim/hero baselines) |

**New dep**: `@axe-core/playwright` for automated contrast/a11y assertions (approved in scope).
**Determinism**: visual specs use `freezeScene` + `chromium-visual` (swiftshader) per the harness contract.

## Notes / decisions
- Aesthetic items (scrim look, hero composition, gradient feel) are gated by **visual baseline + human
  sign-off**; CI gates only the measurable proxies (layout boxes, axe, body size, scroll delta).
- Two-column result reuses the existing `TripMap` component placed in the sticky panel — no map rewrite.
- **Sequencing FIXED: harness → 3d-experience-polish → THIS change.** Scrims/contrast (L2) and all over-3D
  visual baselines are tuned over the FINAL post-processed 3D and captured once here — no re-baseline churn.
- **Card-pull DOM polish belongs here** (moved from 3d-polish): `CardPullOnboarding.tsx` is framer-motion DOM
  (no three.js). The burst jitter/warm-ambient + card affordance/label (AC-L2.2) are DOM/CSS work.
