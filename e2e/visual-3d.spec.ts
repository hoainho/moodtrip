import { test, expect } from '@playwright/test';
import { preacceptConsent, gotoHome, freezeScene } from './_helpers';

// @visual — runs ONLY on the chromium-visual project (software GL via --use-gl=swiftshader).
// Baselines are seeded with `npm run test:e2e:update` AFTER a human approves the aesthetic (the swiftshader
// render, which differs from hardware GL). CI keeps @visual non-blocking until baselines prove stable.
//
// Determinism: freezeScene() seeds Math.random + reduced-motion (must precede goto); page.clock pins the
// time-of-day so NatureScene's day/night cycle renders the same phase every run.
test.describe('3D visual baselines @visual', () => {
  test('landing NatureScene @visual', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-06-17T12:00:00') }); // noon phase, fixed
    await preacceptConsent(page);
    await freezeScene(page);
    await gotoHome(page);
    await page.waitForTimeout(1800); // mount + settle (loop pauses under reduced-motion)
    // Hero region over the NatureScene backdrop — fog depth, ACES tone, warm/indigo light.
    await expect(page).toHaveScreenshot('nature-landing.png', { maxDiffPixelRatio: 0.05 });
  });
});
