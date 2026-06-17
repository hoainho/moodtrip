# Tasks — 3D Experience Polish

## 1. Post-processing + colour management (3D-V)
- [ ] 1.1 Add dep `@react-three/postprocessing@^3` (verify fiber 9.5 / three 0.183 peer matrix FIRST); `<EffectComposer><Bloom mipmapBlur …/>` on the two real Canvases (PersonalWorldCanvas, NatureScene)
- [ ] 1.2 `gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure }}`; `THREE.ColorManagement.enabled = true` in `index.tsx`
- [ ] 1.3 Replace cyan fill with warm-core point light + indigo ambient (`PersonalWorldCanvas.tsx:41`)
- [ ] 1.4 Fog depth + daylight colour (`NatureScene.tsx:532`, feed `DynamicFog`)
- [ ] 1.5 JourneyArcs visibility (opacity/width/animate) (`PersonalWorldCanvas.tsx:115`)
- [ ] 1.6 Camera reframe (`NatureScene.tsx:328`) + symmetric `Float` (`PersonalWorldCanvas.tsx:54`)
- [ ] 1.7 flatShading hierarchy on monuments (`PersonalWorldMonuments.tsx`); mood-tag purple→amber (`PersonalWorldScene.tsx:117`)
- [ ] 1.8 (MOVED to `ui-layout-readability-polish` — CardPullOnboarding is framer-motion DOM, not 3D)

## 2. Render-pause + allocations (3D-P1/P2)
- [ ] 2.1 Keep `frameloop="always"` but PAUSE the loop when not seen: unmount/suspend Canvas when modal closed; stop on `document.visibilitychange` (hidden); fully static under `prefers-reduced-motion`; cap dpr; throttle fireflies. (NO `frameloop="demand"` — would freeze auto-rotate/orbit/fog + fight MeshReflectorMaterial.)
- [ ] 2.2 Hoist scratch `THREE.Color`/vectors to refs; `.set()` inside `useFrame`, no `new` per frame
- [ ] 2.3 Expose `import.meta.env`-guarded `__r3fRenderCount` (reads `gl.info.render.frame`) for the render-pause assertion; `freezeScene` must also disable `autoRotate`

## 3. Robustness (3D-P3/P4/P6)
- [ ] 3.1 Live `prefers-reduced-motion` subscription (`PersonalWorldCanvas.tsx:20`); pause loops when reduced
- [ ] 3.2 WebGL availability guard + `webglcontextlost` via `onCreated`; fallback UI
- [ ] 3.3 Wrap `LazySceneCanvas` in `SceneErrorBoundary` (`PersonalWorldScene.tsx:173`)
- [ ] 3.4 Dispose geometries/materials/textures on unmount; verify with open/close ×10 heap check

## 4. Bundle + minor (3D-P5 + low)
- [ ] 4.1 `vite.config.ts` `manualChunks`: `vendor-three` (three/fiber/drei), `vendor-map` (maplibre)
- [ ] 4.2 `scripts/check-bundle-size.mjs`: assert main ≤ 600 KB gz + vendor chunks exist
- [ ] 4.3 Instancing for repeated monument meshes (`PersonalWorldMonuments.tsx`)
- [ ] 4.4 Sphere segments 32→16; fireflies throttle/early-return; AA-vs-flatShading decision

## 5. Validation (per `e2e-harness-upgrade`)
- [ ] 5.1 `npm run typecheck` clean; build OK; `check-bundle-size` passes
- [ ] 5.2 Static: no `new THREE.Color(` inside `useFrame`
- [ ] 5.3 E2E `e2e/three-d.spec.ts` (desktop+mobile): idle-render ≈ 0, reduced-motion static, WebGL fallback, heap bound, 0 console errors
- [ ] 5.4 Visual: seed `e2e/visual-3d.spec.ts` baselines under `chromium-visual` after **human aesthetic sign-off**
- [ ] 5.5 Review gate (fresh reviewer) — per-AC evidence; aesthetic items reference approved baselines
