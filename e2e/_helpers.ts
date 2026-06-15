import { expect, type Page } from '@playwright/test';

export async function acceptConsentIfPresent(page: Page): Promise<void> {
  const btn = page.locator('button:has-text("Tôi đồng ý")');
  if (await btn.first().isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.first().click();
    await page.waitForTimeout(300);
  }
}

export async function preacceptConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      const stored = {
        version: '2026-05-26-v1',
        scopes: ['ai_generation_cross_border', 'analytics_anonymous', 'storage_local'],
        acceptedAt: Date.now(),
      };
      localStorage.setItem('moodtrip_consent_v1', JSON.stringify(stored));
    } catch (err) {
      console.warn('[e2e] localStorage unavailable', err);
    }
  });
}

export async function gotoHome(page: Page): Promise<void> {
  // Use 'domcontentloaded' — the app keeps the network busy (analytics, PostHog,
  // anon-token mint, lazy 3D scene) so 'networkidle' is unreliable and slow.
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // The IntroScreen splash (fixed z-[100]) runs ~3.3s, then unmounts and the Hero —
  // which owns the "Khám phá ngay" CTA — mounts in its place. A fixed timeout races
  // that intro→hero handoff: the CTA can be clicked while detaching, which throws
  // "element was detached from the DOM". Wait for the CTA to actually be present and
  // settle before returning so downstream clicks are stable.
  const cta = page.locator('button:has-text("Khám phá ngay")').first();
  await cta.waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(500); // let the framer-motion entry animation finish
}

/**
 * Click the Hero "Khám phá ngay" CTA and land on the card-pull onboarding.
 *
 * During initial load the Hero can briefly re-render/remount (React StrictMode in
 * dev + the lazily-mounted 3D scene), which detaches the CTA mid-click and throws
 * "element was detached from the DOM". Retry the click until the card-pull view is
 * actually reached, per Playwright's web-first-assertion retry guidance.
 */
export async function clickExplore(page: Page): Promise<void> {
  const cta = page.locator('button:has-text("Khám phá ngay")').first();
  await expect(async () => {
    await cta.click({ timeout: 4000 });
    await expect(page.getByText('Rút quẻ du lịch', { exact: false })).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 30_000 });
}
