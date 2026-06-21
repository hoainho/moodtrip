# Tasks — UI Layout & Readability Polish

## 1. Responsive result layout (L1)
- [ ] 1.1a (L1-map relocation) Decide the 2-col container owner: lift `<TripMap>` (currently `App.tsx:574`) into `ItineraryDisplay`/a shared layout so timeline + map are siblings in ONE scroll container; move the share/anti-itinerary/PersonalWorldBadge cluster accordingly
- [ ] 1.1b (L1-layout) 2-column grid at ≥lg — timeline (left) + sticky panel (right: map + vitals/budget + jump-nav); reconcile with existing `sticky top-0` header; `map.resize()` on breakpoint
- [ ] 1.2 Single-column < md; no overflow/overlap; verify tap targets ≥44px on mobile
- [ ] 1.3 Record scroll-height before/after at 1280px (assert reduction)

## 2. Readable over 3D (L2)
- [ ] 2.1 Reusable scrim utility (radial/linear darken) in `index.css`; apply behind text over 3D (landing/card-pull/form header)
- [ ] 2.2 CardPull (framer-motion DOM): cards → solid/blurred panel + border + label/caption per card; burst jitter (±angle/radius/color) + warm ambient blob (moved from 3d-polish — this is DOM, not 3D)

## 3. Gradient discipline (L3)
- [ ] 3.1 Audit CTAs; one gradient primary per screen; secondaries → solid/ghost button variants

## 4. Result IA / zero-states (L4)
- [ ] 4.1 Order: hero + vitals + Day 1 above fold; anchor/lazy secondary sections
- [ ] 4.2 Reframe/omit zero metrics (Trending = 0)

## 5. Hero + typography/a11y (L5)
- [ ] 5.1 Landing hero intentional grid; consolidate value chips into one strip
- [ ] 5.2 Enforce body ≥14px; fix contrast until axe 0 serious/critical

## 6. Validation (per `e2e-harness-upgrade`)
- [ ] 6.1 `npm run typecheck` clean; build OK
- [ ] 6.2 Add dep `@axe-core/playwright`; `e2e/a11y.spec.ts` → 0 serious/critical
- [ ] 6.3 `e2e/layout.spec.ts` → 2-col + sticky + scroll-delta (desktop) / single-col (mobile)
- [ ] 6.4 Extend `e2e/visual-3d.spec.ts` baselines (after human aesthetic sign-off)
- [ ] 6.5 Review gate (fresh reviewer) — per-AC evidence; aesthetic items reference approved baselines
