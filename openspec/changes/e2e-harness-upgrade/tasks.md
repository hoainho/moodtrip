# Tasks — E2E Harness Upgrade

## 1. Playwright projects
- [ ] 1.1 Add `chromium-mobile` project (Pixel 7 viewport, `isMobile`, `hasTouch`) to `playwright.config.ts`
- [ ] 1.2 Add `chromium-visual` project with `launchOptions.args: ['--use-gl=swiftshader']`
- [ ] 1.3 Keep `chromium-desktop` as the default functional project; `workers: 1`, `fullyParallel: false`
- [ ] 1.4 Configure `expect.toHaveScreenshot` defaults (`maxDiffPixelRatio: 0.02`, `threshold: 0.25`)

## 2. Determinism helper
- [ ] 2.1 `freezeScene(page)` in `e2e/_helpers.ts`: emulate reduced-motion + seed `Math.random` via `addInitScript` + settle wait
- [ ] 2.2 Document tag conventions: `@visual`, `@mobile` in `e2e/README.md`

## 3. npm scripts
- [ ] 3.1 `test:e2e` → functional + mobile projects, exclude `@visual` (`--grep-invert @visual`)
- [ ] 3.2 `test:e2e:visual` → `--project chromium-visual --grep @visual`
- [ ] 3.3 `test:e2e:update` → `test:e2e:visual --update-snapshots`

## 4. CI wiring
- [ ] 4.1 Add `e2e-functional` job (needs `build`) — required gate
- [ ] 4.2 Add `e2e-mobile` job — required gate
- [ ] 4.3 Add `e2e-visual` job — `continue-on-error: true` (informational) initially
- [ ] 4.4 Add `test-worker` to `build.needs` (close pre-existing gap)

## 5. Validation
- [ ] 5.1 Existing specs (`create-trip`, `page-nav`, etc.) pass green under the new multi-project config
- [ ] 5.2 `freezeScene` produces a byte-stable screenshot across 3 consecutive local runs (swiftshader)
- [ ] 5.3 `npm run typecheck` clean; CI dry-run shows the new jobs registered
- [ ] 5.4 Review gate — confirm no app behavior changed (test-infra only)
