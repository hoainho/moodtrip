# UI Layout & Readability Polish

## Why

A senior design review of the actual rendered screens (landing, card-pull, form, result — desktop + mobile)
found the product reads as a stretched mobile layout on desktop and lets the 3D backdrop fight the content:

- **Desktop wastes ~40–50% of width**: landing, form, and especially the result screen are a single narrow
  centred column with large dark voids on both sides; the result is one very long vertical scroll that
  ignores the wide viewport (no sticky map, no two-column split).
- **3D backgrounds hurt readability**: the card-pull's three "constellation" cards are low-contrast floating
  over busy terrain (and lack labels for what they represent); the form/result let terrain bleed behind the
  header as visual noise.
- **First-screen overload + weak zero-states** on the result (everything stacked despite tabs; "Trending: 0"
  shown as a bare metric).
- **Gradient overuse** (teal→cyan on every CTA + banner) dilutes the primary action.
- **Contrast/a11y risk** for muted text on dark and any text over 3D (WCAG AA), plus body text that should be
  ≥14px.

These are visual/UX quality gaps, not bugs — verified against Refactoring UI / Apple HIG / WCAG 2.2 on real
screenshots.

## What Changes

- **Responsive result layout**: at ≥1024px, split into two columns — left = day timeline (scrolls), right =
  **sticky** map + vitals/budget summary + section jump-nav. Reduces scroll length and uses the viewport.
- **Readable-over-3D**: add a scrim/overlay (radial darken) behind content rendered over 3D; calm/blur the 3D
  when it is a reading backdrop; raise card-pull card contrast (solid/blurred panel + border).
- **Card-pull affordance**: add a label/caption + light preview to each card; "what happens" microcopy.
- **Gradient discipline**: reserve the signature gradient for the single primary action per screen; secondary
  actions become solid/ghost.
- **Result IA**: lead with hero + vitals + Day 1; lazy/anchor secondary sections; reframe or omit zero metrics.
- **Hero composition**: intentional grid balancing headline + 3D; consolidate the floating value chips
  (AI-Powered / 3D / 100+) into a coherent trust strip.
- **A11y/typography**: body text ≥14px, all text ≥4.5:1 contrast (incl. over 3D scrims).

## Impact

- Affected code: `components/ItineraryDisplay.tsx`, `TripDayStoryboard.tsx`, `TripMap.tsx`, `Hero.tsx`,
  `IntroScreen.tsx`, `CardPullOnboarding.tsx`, `TripForm.tsx`, `index.css` (tokens/scrim utility).
- Risk lane: **medium** — broad visual change → gated by **visual-regression baselines + reviewer sign-off**
  (aesthetic) plus measurable AC (breakpoint layout, contrast, body size).
- Runs on the harness in `e2e-harness-upgrade` (must land first). Pairs with `3d-experience-polish` (the 3D
  scrim/readability items here assume that change's lighting/post-processing).
- No data/API change. Frontend-only.
