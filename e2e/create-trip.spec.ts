import { test, expect } from '@playwright/test';
import { preacceptConsent, gotoHome, clickExplore } from './_helpers';

test.describe('Create trip happy path (MOCK_ITINERARY)', () => {
  test.beforeEach(async ({ page }) => {
    await preacceptConsent(page);
  });

  test('Hero → card-pull → manual form → fill → submit → result with hero banner', async ({ page }) => {
    const errors: string[] = [];
    const apiCalls: Array<{ url: string; status: number }> = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      const u = r.url();
      if (u.includes('/v1/')) apiCalls.push({ url: u, status: r.status() });
    });

    await gotoHome(page);
    await clickExplore(page);
    await expect(page.locator('button:has-text("Tôi muốn chọn thủ công")').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('button:has-text("Tôi muốn chọn thủ công")').first().click();
    await expect(page.locator('input[placeholder*="AI gợi ý"]').first()).toBeVisible({ timeout: 10_000 });

    const dest = page.locator('input[placeholder*="AI gợi ý"]').first();
    await dest.fill('Đà Lạt');

    const submit = page.locator('button:has-text("Tạo hành trình")').first();
    await submit.scrollIntoViewIfNeeded();
    await submit.click({ force: true });

    await expect(page.locator('text=HÀNH TRÌNH TỪ MƠ')).toBeVisible({ timeout: 60_000 });

    const vitalsLabels = ['Số ngày', 'Hoạt động', 'Trending', 'Tổng dự kiến'];
    for (const label of vitalsLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }

    await expect(page.locator('button:has-text("Tạo Reel")')).toBeVisible();

    const generate = apiCalls.find((c) => c.url.includes('/v1/generate'));
    expect(generate).toBeDefined();
    expect(generate?.status).toBe(200);

    const anon = apiCalls.find((c) => c.url.includes('/v1/anon-token'));
    expect(anon).toBeDefined();
    expect(anon?.status).toBe(200);

    expect(errors).toEqual([]);
  });

  test('Result view shows 3 "why you will love it" reasons', async ({ page }) => {
    await gotoHome(page);
    await clickExplore(page);
    await expect(page.locator('button:has-text("Tôi muốn chọn thủ công")').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('button:has-text("Tôi muốn chọn thủ công")').first().click();
    await expect(page.locator('input[placeholder*="AI gợi ý"]').first()).toBeVisible({ timeout: 10_000 });

    const dest = page.locator('input[placeholder*="AI gợi ý"]').first();
    await dest.fill('Đà Lạt');
    await page.locator('button:has-text("Tạo hành trình")').first().click({ force: true });
    await expect(page.locator('text=HÀNH TRÌNH TỪ MƠ')).toBeVisible({ timeout: 60_000 });

    const reasons = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const matches = bodyText.match(/[1-3]\s*\n\n[^\n]+/g) || [];
      return matches.length;
    });
    expect(reasons).toBeGreaterThanOrEqual(3);
  });
});
