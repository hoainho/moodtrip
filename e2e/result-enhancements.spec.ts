import { test, expect } from '@playwright/test';
import { preacceptConsent, gotoHome, clickExplore } from './_helpers';

async function createTrip(page: import('@playwright/test').Page): Promise<void> {
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
}

test.describe('Result view enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await preacceptConsent(page);
    await gotoHome(page);
    await createTrip(page);
  });

  test('View mode toggle exposes Timeline / Storyboard / Compact', async ({ page }) => {
    await expect(page.locator('button:has-text("Storyboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Gọn")')).toBeVisible();
    await expect(page.locator('button[title="Theo giờ"]')).toBeVisible();
  });

  test('Storyboard mode renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.locator('button:has-text("Storyboard")').first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Ngày 1').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Compact mode renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.locator('button:has-text("Gọn")').first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Ngày 1').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Reel modal opens with SVG preview', async ({ page }) => {
    await page.locator('button:has-text("Tạo Reel")').first().click();
    await page.waitForTimeout(1500);
    const reelImg = page.locator('img[alt*="Reel preview"]');
    await expect(reelImg).toBeVisible();
    const src = await reelImg.getAttribute('src');
    expect(src).toMatch(/^data:image\/svg\+xml/);
  });

  test('Reel modal close button works', async ({ page }) => {
    await page.locator('button:has-text("Tạo Reel")').first().click();
    await page.waitForTimeout(1000);
    const closeBtn = page.locator('button[aria-label="Đóng"]').first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(800);
    await expect(page.locator('img[alt*="Reel preview"]')).not.toBeVisible();
  });

  test('Reel SVG download produces a 9:16 file', async ({ page }) => {
    await page.locator('button:has-text("Tạo Reel")').first().click();
    await page.waitForTimeout(1000);

    // Ensure the 9:16 "Reels / Story" format is selected (it is the default, but be explicit).
    await page.getByRole('tab', { name: 'Reels / Story' }).click();

    // The reel modal exposes separate "Tải PNG" and "SVG" download buttons (plus "Copy").
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("SVG")').first().click();
    const download = await downloadPromise;
    // Filename: moodtrip-<slug>-<formatId>-<w>x<h>.svg  → e.g. moodtrip-da-lat-story-1080x1920.svg
    expect(download.suggestedFilename()).toMatch(/^moodtrip-.*-story-1080x1920\.svg$/);

    const path = await download.path();
    expect(path).not.toBeNull();
    if (path) {
      const fs = await import('node:fs/promises');
      const text = await fs.readFile(path, 'utf-8');
      expect(text).toContain('width="1080"');
      expect(text).toContain('height="1920"');
      expect(text).toContain('MOODTRIP');
    }
  });

  test('Section nav scrolls to anchor sections', async ({ page }) => {
    const foodTab = page.locator('button:has-text("Ẩm thực")').first();
    await foodTab.click();
    await page.waitForTimeout(800);
    await expect(page.locator('text=Món ăn nên thử').first()).toBeInViewport({ ratio: 0.05 });
  });

  test('Floating action bar shows Save, PDF, Share, Kỷ niệm, Mới', async ({ page }) => {
    await expect(page.locator('button:has-text("Lưu"), button:has-text("Đã lưu")').first()).toBeVisible();
    await expect(page.locator('button:has-text("PDF")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Chia sẻ")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Kỷ niệm")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Mới")').first()).toBeVisible();
  });
});
