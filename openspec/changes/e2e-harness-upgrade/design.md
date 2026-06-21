# Design — E2E Harness Upgrade

This document is the **harness contract** ("quy định harness"): how E2E runs for the device-local and 3D
changes. Feature specs MUST conform to these rules.

## 1. Run profiles

| Profile | Project | Webserver | Purpose |
|---|---|---|---|
| Functional | `chromium-desktop` (1280×900) | `MOCK_ITINERARY=1 npm run dev` | All non-`@visual` specs (persistence, 3D behavioural) |
| Mobile | `chromium-mobile` (Pixel 7 ≈ 412×915, `isMobile`, `hasTouch`) | same | Mobile-tagged AC (map height, 3D on small screen) |
| Visual | `chromium-visual` (1280×900, `--use-gl=swiftshader`) | same | `@visual` specs only (3D screenshot baselines) |

- `fullyParallel: false`, `workers: 1` (unchanged — 3D + dev server are heavy).
- `MOCK_ITINERARY=1` stays the default so generation is **deterministic** (Đà Lạt fixture) — no live proxy
  calls in CI. A separate live smoke test against the deployed Worker is out of scope here.

## 2. Determinism rules (mandatory before any 3D assertion/screenshot)

`freezeScene(page)` helper MUST be called before interacting with / capturing a 3D scene:
1. `await page.emulateMedia({ reducedMotion: 'reduce' })` — stops idle animation.
2. Seed RNG: `addInitScript` overriding `Math.random` with a fixed-seed PRNG (Fireflies/particles are random).
3. Wait for settle: `await page.waitForTimeout(600)` after mount, then assert the scene's render counter has
   stopped advancing (see `frameloop="demand"` AC in 3d-experience-polish).

## 3. Visual-regression policy

- Use `await expect(page).toHaveScreenshot('<name>.png', { maxDiffPixelRatio: 0.02, threshold: 0.25 })`.
- Software GL (`swiftshader`) is **required** for the visual project — hardware GL output differs per driver.
- Baselines live in `e2e/__screenshots__/`; committed to git.
- Seeding/updating baselines: `npm run test:e2e:update` — **only** after a human has visually reviewed the
  rendered scene (aesthetic sign-off). Updating a baseline is a deliberate, reviewed act, never automatic.
- A failed visual diff in CI is **informational** (non-blocking) until baselines prove stable across ≥3 runs,
  then promoted to a gate.
- **Baselines MUST be generated in the SAME container that runs CI** (Docker-pinned Playwright image), not a
  dev Mac — font/Mesa/libc drift will otherwise diff on Linux CI. The human aesthetic sign-off approves the
  **swiftshader** render (what CI sees), not the local hardware-GL render — they differ (Bloom/ACES float
  precision diverges most under software GL).
- **drei `<Stars>`/`<Sparkles>` use their own internal RNG**, not always `Math.random` — seeding `Math.random`
  in `freezeScene` may NOT fully determinize them. Verify empirically; keep `e2e-visual` non-blocking until proven.
- `freezeScene` MUST also disable `OrbitControls autoRotate` (PersonalWorldCanvas) — reduced-motion covers it
  today, but state the dependency so the screenshot is static.

## 4. CI gate matrix

| Job | Specs | Blocking? |
|---|---|---|
| `e2e-functional` | three-d.spec (non-visual), layout.spec, a11y.spec, existing specs | **Yes (gate)** |
| `e2e-mobile` | `@mobile`-tagged | Yes (gate) |
| `e2e-visual` | visual-3d.spec | No (informational first), promote after ≥3 stable runs |

(No `persistence.spec` — device-local-persistence is out of this ultragoal.)

- Functional + mobile jobs `needs:` the existing `build` job; `build` itself gains `needs: [test-worker]`
  (closes the unrelated gap where a red worker test didn't block build).

## 5. Run commands (canonical)

```bash
E2E_PORT=5180 CI=1 npm run test:e2e                  # functional + mobile, deterministic
E2E_PORT=5180 npm run test:e2e -- e2e/persistence.spec.ts
npm run test:e2e:visual                              # visual project (swiftshader)
npm run test:e2e:update                              # seed/update baselines (after visual sign-off)
```

## 6. Flake policy

- `retries: 2` in CI (unchanged). A spec that needs >2 retries to pass is quarantined (`.fixme`) with an
  issue, never left flaky-but-green.
- 3D heap/leak and idle-render assertions use generous thresholds (software GL timing varies); they catch
  unbounded growth, not exact numbers.
