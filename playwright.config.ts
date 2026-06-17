import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ? parseInt(process.env.E2E_PORT, 10) : 5174;
const BASE_URL = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`;

// Shared launch options. CHROME_PATH (CI/containers) → system Chrome + sandbox-off flags; otherwise {}.
const CHROME_LAUNCH: { executablePath?: string; args?: string[] } = process.env.CHROME_PATH
  ? {
      executablePath: process.env.CHROME_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    }
  : {};

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 90_000,
  expect: {
    timeout: 10_000,
    // Visual-regression tolerance (3D under software GL diverges sub-pixel — see e2e-harness-upgrade).
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, threshold: 0.25 },
  },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // Functional desktop — runs every non-@visual spec (the historical default surface).
    {
      name: 'chromium-desktop',
      grepInvert: /@visual/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        launchOptions: CHROME_LAUNCH,
      },
    },
    // Mobile — only @mobile-tagged specs (mobile-specific AC), so desktop-only specs don't run here.
    {
      name: 'chromium-mobile',
      grep: /@mobile/,
      use: {
        ...devices['Pixel 7'],
        launchOptions: CHROME_LAUNCH,
      },
    },
    // Visual-regression — only @visual specs, software GL for deterministic cross-machine screenshots.
    {
      name: 'chromium-visual',
      grep: /@visual/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        launchOptions: {
          ...CHROME_LAUNCH,
          args: [...(CHROME_LAUNCH.args ?? []), '--use-gl=swiftshader'],
        },
      },
    },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: `MOCK_ITINERARY=1 npm run dev -- --host 127.0.0.1 --port ${PORT} --strictPort`,
        url: `http://127.0.0.1:${PORT}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
