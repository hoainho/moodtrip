import { test, expect, type Page } from '@playwright/test';
import { preacceptConsent, gotoHome, clickExplore } from './_helpers';

async function createTripToResult(page: Page) {
  await preacceptConsent(page);
  await gotoHome(page);
  await clickExplore(page);
  await page.locator('button:has-text("Tôi muốn chọn thủ công")').first().click();
  await page.locator('input[placeholder*="AI gợi ý"]').first().fill('Đà Lạt');
  await page.locator('button:has-text("Tạo hành trình")').first().click({ force: true });
  await expect(page.getByText('HÀNH TRÌNH TỪ MƠ')).toBeVisible({ timeout: 60_000 });
}

// Is the map (or an ancestor) position:sticky?
async function mapHasStickyAncestor(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('h3')).find((e) => /Bản đồ hành trình/.test(e.textContent ?? ''));
    let el: HTMLElement | null = (h as HTMLElement) ?? null;
    for (let i = 0; el && i < 6; i++, el = el.parentElement) {
      if (getComputedStyle(el).position === 'sticky') return true;
    }
    return false;
  });
}

test.describe('Result layout (US-L1)', () => {
  test('desktop >=1024px: timeline + map are 2-column with a sticky map panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await createTripToResult(page);
    const mapHeading = page.getByRole('heading', { name: 'Bản đồ hành trình' });
    await expect(mapHeading).toBeVisible();
    const box = await mapHeading.boundingBox();
    expect(box).not.toBeNull();
    // Right column: the map heading sits in the right portion of a 1280px viewport.
    expect(box!.x).toBeGreaterThan(1280 * 0.45);
    expect(await mapHasStickyAncestor(page)).toBe(true);
  });

  test('mobile <768px: single column, map stacks below, no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await createTripToResult(page);
    const mapHeading = page.getByRole('heading', { name: 'Bản đồ hành trình' });
    await expect(mapHeading).toBeVisible();
    const box = await mapHeading.boundingBox();
    // Single column → map heading spans near full width starting at the left.
    expect(box!.x).toBeLessThan(390 * 0.25);
    // No horizontal overflow.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
