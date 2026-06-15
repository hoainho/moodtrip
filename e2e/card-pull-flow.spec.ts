import { test, expect } from '@playwright/test';
import { preacceptConsent, gotoHome, clickExplore } from './_helpers';

test.describe('Card-pull onboarding (Phase 1 A2)', () => {
  test.beforeEach(async ({ page }) => {
    await preacceptConsent(page);
  });

  test('Khám phá ngay leads to card-pull view', async ({ page }) => {
    await gotoHome(page);
    await clickExplore(page);

    // Card-pull onboarding: eyebrow "Rút quẻ du lịch", headline, and the three card
    // slots (Nguyên tố / Nhịp / Bạn đi cùng). Labels are styled uppercase via CSS but
    // the DOM text is title-case — assert the real text content.
    await expect(page.getByText('Rút quẻ du lịch', { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Hôm nay bạn muốn đi đâu?')).toBeVisible();
    await expect(page.getByText('Nguyên tố', { exact: true })).toBeVisible();
    await expect(page.getByText('Nhịp', { exact: true })).toBeVisible();
    await expect(page.getByText('Bạn đi cùng', { exact: true })).toBeVisible();
  });

  test('Manual fallback button is present and reaches TripForm', async ({ page }) => {
    await gotoHome(page);
    await clickExplore(page);
    await page.waitForTimeout(2500);

    const manual = page.locator('button:has-text("Tôi muốn chọn thủ công")');
    await expect(manual).toBeVisible();
    await manual.first().click();
    await page.waitForTimeout(2500);

    await expect(page.locator('text=ĐỊA ĐIỂM')).toBeVisible();
    await expect(page.locator('text=THỜI GIAN')).toBeVisible();
    await expect(page.locator('text=NGÂN SÁCH MỖI NGƯỜI')).toBeVisible();
  });

  test('TripForm does not crash with partial initial data (regression: duration.days)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await gotoHome(page);
    await clickExplore(page);
    await page.waitForTimeout(2500);
    await page.locator('button:has-text("Tôi muốn chọn thủ công")').first().click();
    await page.waitForTimeout(2500);

    const dayValue = await page
      .locator('text=NGÀY')
      .first()
      .locator('xpath=ancestor::*[1]/following-sibling::*[1]')
      .innerText()
      .catch(() => '');
    expect(dayValue).toMatch(/[12]/);
    expect(errors.filter((e) => e.includes('duration'))).toEqual([]);
  });
});
