# 3D Experience Polish (cảm quan + performance)

## Why

MoodTrip's 3D scenes (R3F: `PersonalWorldCanvas`, `NatureScene`, `PersonalWorldMonuments`,
`CardPullOnboarding`) are functional but read as "default three.js" and waste device resources. Two audits
(technical + aesthetic) found concrete gaps:

- **Aesthetic**: no post-processing pipeline at all (`@react-three/postprocessing` absent), so high
  `emissiveIntensity` lanterns/lighthouse render as flat chalk-white instead of glowing — the single biggest
  "unreviewed" signal. The fill light is saturated corporate cyan (`#38bdf8`), fog has no depth (near plane
  30 vs terrain ~25), the core JourneyArcs metaphor is near-invisible (opacity 0.22), mood tags use an
  unanchored purple, and the card-pull burst is a perfectly symmetric "spinner".
- **Technical**: 5 always-on `useFrame` loops at 60 fps with `frameloop="always"` (GPU/battery drain on a
  static scene), ~600 `new THREE.Color()` allocations/sec causing GC microstutter, no WebGL availability
  guard / `webglcontextlost` handler / error boundary on `PersonalWorldScene` (iOS context-loss crashes the
  modal), one-shot `prefers-reduced-motion`, no `manualChunks` (three+drei in the 1 MB main bundle), and no
  instancing for up to 25 monuments.

These degrade both the intended dreamy travel mood and low-end mobile performance.

## What Changes

- **3D-V Visual lift**: add `@react-three/postprocessing` (`<Bloom>` + ACES tone mapping +
  `ColorManagement.enabled`); replace corporate-cyan fill with a warm-core / indigo-shadow split; deepen fog
  with daylight-driven color; raise JourneyArcs visibility; fix camera framing + symmetric `Float`; apply a
  flatShading hierarchy (stylized nature vs polished cultural monuments); recolor unanchored purple → amber;
  warm up the card-pull burst/ambient.
- **3D-P Performance & robustness**: keep `frameloop="always"` but **pause the loop when not seen**
  (unmount/suspend on modal close, stop on tab `visibilitychange`, static under reduced-motion; cap dpr +
  throttle fireflies) — NOT `frameloop="demand"`, which would freeze auto-rotate/orbit/fog and fight
  `MeshReflectorMaterial`; hoist `THREE.Color` out of `useFrame`; WebGL guard + `webglcontextlost` + error
  boundary on `PersonalWorldScene`; live `prefers-reduced-motion` subscription; `manualChunks` (regression
  guard — three/drei/maplibre already auto-split); instancing for repeated monuments; dispose on unmount;
  minor (sphere segments, AA). NOTE: card-pull polish moved to `ui-layout-readability-polish` (DOM, not 3D).

## Impact

- Affected code: `components/three/PersonalWorldCanvas.tsx`, `NatureScene.tsx`, `PersonalWorldMonuments.tsx`,
  `components/PersonalWorldScene.tsx`, `vite.config.ts`, `index.tsx` (ColorManagement),
  `package.json` (`@react-three/postprocessing@^3`). (CardPullOnboarding excluded — handled in ui-layout.)
- **Sequencing: this story runs BEFORE `ui-layout-readability-polish`** (harness → 3d → ui-layout) so the
  ui scrims/baselines are tuned over the FINAL post-processed 3D, captured once.
- Risk lane: **medium** — visual changes are reviewer/visual-regression gated; perf/robustness changes are
  measurable. Adds one dependency (`@react-three/postprocessing`, explicitly approved here).
- Runs on the harness in `e2e-harness-upgrade` (must land first), incl. the `chromium-visual` swiftshader
  project for baselines.
- Aesthetic AC cannot be fully automated — they require **visual-regression baselines + human sign-off**;
  CI gates only the measurable proxies.
