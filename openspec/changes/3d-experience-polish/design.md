# Design — 3D Experience Polish: Acceptance Criteria & E2E

## Definition of Done (every story)
`tsc` clean · unit pass · `npm run build` OK · **0 console errors** when scenes mount · mapped E2E specs green ·
bundle within budget · aesthetic items have a reviewed visual baseline.

## Acceptance Criteria

### 3D-V — Visual lift (aesthetic; visual-regression + human sign-off)
- **AC-V.1 Post-processing active**: `<EffectComposer>` with `<Bloom>` wraps the **two real R3F Canvases** — `PersonalWorldCanvas` and `NatureScene` (NOTE: `CardPullOnboarding` is framer-motion DOM, NOT a Canvas — its polish moved to `ui-layout-readability-polish`); dep pinned `@react-three/postprocessing@^3` (fiber 9.5 / three 0.183). `gl.toneMapping = ACESFilmicToneMapping` and `THREE.ColorManagement.enabled = true` (asserted via init/props). Emissive elements (lantern/lighthouse/rim) render as glow, confirmed against a reviewed swiftshader baseline. Numeric pass-targets (regression guard, not the gate): fog near ≈12, journey-arc opacity ≥0.45 / lineWidth ≥1.5, warm point light `#f59e0b`, indigo ambient `#1e3a5f`.
- **AC-V.2 Light/colour mood**: corporate-cyan fill (`#38bdf8`) replaced by warm-core (`~#f59e0b` point light) + indigo shadow (`~#1e3a5f`); verified by baseline.
- **AC-V.3 Atmospheric depth**: fog near plane pulled in (≈12) with daylight-driven colour; distant terrain visibly recedes; baseline.
- **AC-V.4 Metaphor visible**: JourneyArcs opacity ≥ 0.45 / lineWidth ≥ 1.5 (or animated); arcs clearly visible on mobile baseline.
- **AC-V.5 Camera + Float**: NatureScene camera reframed (horizon in lower third); island `Float` symmetric about y=0 (no orbit-pivot drift); baseline.
- **AC-V.6 Palette coherence**: no `purple-*` in 3D/world UI (mood tags → amber); card-pull burst has angle/colour jitter + a warm ambient source; baseline.
- **AC-V.7 Human sign-off**: a reviewer approves before/after screenshots; baselines committed via `test:e2e:update`.

### 3D-P — Performance & robustness (measurable)
- **AC-P.1 Render pauses when not visible** (REVISED — `frameloop="demand"` dropped: it would freeze the perpetual auto-rotate/orbit/fog/fireflies that 3D-V enhances, and conflicts with `MeshReflectorMaterial`'s per-frame FBO). Keep `frameloop="always"` but **stop the loop when the work isn't seen**: render halts when the 3D modal is closed/unmounted, when the tab is hidden (`document.visibilitychange`), and when `prefers-reduced-motion` is set; dpr capped and fireflies throttled. Asserted: with the modal closed OR `emulateMedia({reducedMotion:'reduce'})`, `gl.info.render.frame` does not advance over a 1.5 s window (read via an `import.meta.env`-guarded `__r3fRenderCount` hook).
- **AC-P.2 No per-frame allocation**: no `new THREE.Color(` (or equivalent heap alloc) inside any `useFrame` (static check / lint rule).
- **AC-P.3 Reduced-motion**: with `emulateMedia({ reducedMotion: 'reduce' })`, idle 3D animation is paused/static; a live OS toggle is respected (subscription, not one-shot).
- **AC-P.4 WebGL fallback**: when WebGL is unavailable or context is lost, a graceful fallback UI renders (not blank, no crash); the `PersonalWorldScene` error boundary catches Three.js errors.
- **AC-P.5 Bundle budget**: `manualChunks` emits separate `three`/`drei`/`maplibre` chunks; **main entry chunk ≤ 600 KB gzipped** (build-size assertion).
- **AC-P.6 No leak**: opening then closing the PersonalWorld modal **10×** does not grow the JS heap unboundedly (CDP heap snapshot delta within a generous threshold; geometries/materials disposed).

## E2E mapping

| Spec file | Project | Covers | Key assertions |
|---|---|---|---|
| `e2e/three-d.spec.ts` | desktop + `@mobile` | P.1, P.3, P.4, P.6 + "0 console errors" | `freezeScene`; assert `gl.info.render.frame` does NOT advance when modal closed / `reducedMotion:reduce` (1.5 s window); reduced-motion → static; stub `HTMLCanvasElement.getContext('webgl')`→null → fallback text; open/close ×10 → heap delta bound |
| `e2e/visual-3d.spec.ts` | `chromium-visual` (swiftshader) | V.1–V.6 (3D only) | `freezeScene` then `toHaveScreenshot('personal-world.png')`, `toHaveScreenshot('nature-scene.png')` (card-pull baseline lives in ui-layout, not here) |
| (build) `scripts/check-bundle-size.mjs` | — | P.5 | parse `dist/assets/*`; assert main chunk ≤ budget + named vendor chunks exist |
| (static) eslint rule / grep test | — | P.2 | fail if `new THREE.Color(` appears within a `useFrame` body |

**Determinism:** every 3D spec calls `freezeScene(page)` (reduced-motion + seeded RNG + settle) before
asserting/capturing. Visual specs run only under `chromium-visual` with `--use-gl=swiftshader`.

## Notes / decisions
- New dep `@react-three/postprocessing` is approved in scope (needed for Bloom).
- Aesthetic AC are gated by **visual-regression baseline + reviewer sign-off**, NOT by automated pixel rules
  beyond "diff vs approved baseline" — the harness can only catch *regressions from* an approved look.
- `__r3fRenderCount` is a dev/test-only hook (guarded by `import.meta.env`) so demand-rendering is testable.
- Bundle budget 600 KB gz is a starting target; tighten in `e2e-harness-upgrade` follow-up if achievable.
