# E2E Harness Upgrade (device-local + 3D verification)

## Why

The device-local persistence and 3D-polish work cannot be verified by the current Playwright harness.
Today: a single Chromium **desktop** project (1280×900), a `MOCK_ITINERARY=1` dev webserver, **no
visual-regression**, and E2E is **not wired into CI** (`ci.yml` runs typecheck/unit/build only). To gate
the upcoming work we need (a) deterministic, GPU-independent 3D rendering so screenshots are stable, (b) a
**mobile viewport** project for the mobile AC (map height, 3D on low-end), (c) **visual-regression**
baselines for the aesthetic 3D items that cannot be asserted programmatically, and (d) a **CI gate** for the
functional specs. This change upgrades the harness only — it is the contract the two feature changes run
against.

## What Changes

- **Mobile project**: add a second Playwright project using a mobile viewport (Pixel 7 ≈ 412×915) alongside
  the existing desktop Chromium, so mobile-specific AC run automatically.
- **Deterministic 3D**: launch Chromium with `--use-gl=swiftshader` (software GL) for the visual project so
  3D output is identical across machines/CI; set `toHaveScreenshot` tolerances (`maxDiffPixelRatio`,
  `threshold`) appropriate for software GL.
- **Determinism helper**: `e2e/_helpers.ts` gains `freezeScene(page)` — emulates `prefers-reduced-motion:
  reduce`, seeds `Math.random`, and waits for one settled frame before any 3D screenshot.
- **Visual-regression**: enable `expect(page).toHaveScreenshot()`; baselines stored under
  `e2e/__screenshots__/`; `@visual`-tagged specs only.
- **npm scripts**: `test:e2e` (functional, MOCK mode, all non-`@visual`), `test:e2e:visual` (visual project),
  `test:e2e:update` (seed/update baselines).
- **CI**: add an `e2e-functional` job (three-d non-visual + layout + a11y + existing specs) as a **required
  gate**; add an `e2e-visual` job that is **non-blocking** (informational) until baselines prove stable across
  ≥3 runs (cross-GPU/software-GL flake risk), then promote.

## Impact

- Affected code: `playwright.config.ts`, `e2e/_helpers.ts`, `package.json` (scripts),
  `.github/workflows/ci.yml`. No application behavior change.
- Risk lane: **test-infra only** → validate:quick + a green run of the existing specs under the new config.
- This change MUST land first, then `3d-experience-polish`, then `ui-layout-readability-polish` (the two
  ultragoal feature stories) — both reference the run profiles + visual-regression policy in this `design.md`.
  (Persistence is OUT of this ultragoal: no `persistence.spec` and no persistence-driven rationale here.)
