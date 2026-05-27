# E2E Test Suite

Playwright end-to-end tests for MoodTrip's critical user flows.

## What it covers

| Spec | Focus |
|---|---|
| `hero-and-consent.spec.ts` | Landing page, Decree 13 consent banner, top-right button non-overlap |
| `card-pull-flow.spec.ts` | Phase 1 A2 card-pull onboarding (Rút quẻ du lịch), manual fallback, TripForm crash regression |
| `create-trip.spec.ts` | Full create-trip happy path → result view with hero banner + vitals + reasons |
| `result-enhancements.spec.ts` | View-mode toggle, Reel modal, Reel SVG download, section nav, floating action bar |

## How it works

The suite uses `MOCK_ITINERARY=1` (via `playwright.config.ts` `webServer`), which makes the Vite dev-edge-proxy plugin
return a fixture itinerary instead of calling Gemini. This keeps the suite:
- Fast (no real LLM call)
- Deterministic (same fixture every run)
- Free (no Gemini quota burn)

In production / dev with a real `GEMINI_API_KEY` in `.env.local`, the same flow uses real Gemini — only the e2e
spawned dev server is mocked.

## Prerequisites

```bash
npm install                 # already installed
npx playwright install      # one-time: download chromium for your platform
```

## Run

```bash
npm run test:e2e            # headless, all specs
npm run test:e2e:ui         # interactive UI mode for debugging
```

To run a single spec:

```bash
npx playwright test e2e/create-trip.spec.ts
```

To run against a custom dev server URL:

```bash
E2E_BASE_URL=http://localhost:5173 E2E_NO_WEBSERVER=1 npm run test:e2e
```

## CI

The config respects `CI=1`:
- `forbidOnly` = true (no `.only` left in code)
- `retries` = 2
- `webServer.reuseExistingServer` = false (always fresh)

## Environment-specific browser

If Playwright's bundled chromium doesn't run in your environment (e.g. wrong arch, missing libs), point at your
system browser:

```bash
CHROME_PATH=/usr/bin/google-chrome npx playwright test
```
