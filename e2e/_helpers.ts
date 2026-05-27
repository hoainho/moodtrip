import type { Page } from '@playwright/test';

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
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
}
