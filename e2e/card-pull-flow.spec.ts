import { test, expect } from '@playwright/test';
import { preacceptConsent, gotoHome } from './_helpers';

test.describe('Card-pull onboarding (Phase 1 A2)', () => {
  test.beforeEach(async ({ page }) => {
    await preacceptConsent(page);
  });

  test('Khám phá ngay leads to card-pull view', async ({ page }) => {
    await gotoHome(page);
    await page.locator('button:has-text("Khám phá ngay")').first().click();
    await page.waitForTimeout(2500);

    await expect(page.locator('text=RÚT QUẺ DU LỊCH')).toBeVisible();
    await expect(page.locator('text=NGUYÊN TỐ')).toBeVisible();
    await expect(page.locator('text=NHỊP')).toBeVisible();
    await expect(page.locator('text=BẠN ĐI CÙNG')).toBeVisible();
  });

  test('Manual fallback button is present and reaches TripForm', async ({ page }) => {
    await gotoHome(page);
    await page.locator('button:has-text("Khám phá ngay")').first().click();
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
    await page.locator('button:has-text("Khám phá ngay")').first().click();
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
