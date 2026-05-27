import { test, expect } from '@playwright/test';
import { gotoHome } from './_helpers';

test.describe('Hero landing + consent', () => {
  test('renders brand, tagline, and CTA', async ({ page }) => {
    await gotoHome(page);

    await expect(page.locator('text=MoodTrip').first()).toBeVisible();
    await expect(page.locator('text=Để cảm xúc dẫn đường').first()).toBeVisible();
    await expect(page.locator('button:has-text("Khám phá ngay")').first()).toBeVisible();
  });

  test('shows Decree 13 consent banner on first visit', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('text=Nghị định 13')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Tôi đồng ý")')).toBeVisible();
  });

  test('consent banner dismisses on accept and persists', async ({ page, context }) => {
    await gotoHome(page);
    await page.locator('button:has-text("Tôi đồng ý")').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Nghị định 13')).not.toBeVisible();

    const value = await context.storageState();
    const ls = value.origins.flatMap((o) => o.localStorage);
    const consent = ls.find((kv) => kv.name === 'moodtrip_consent_v1');
    expect(consent).toBeDefined();
  });

  test('top-right buttons do not overlap with Hero nav', async ({ page }) => {
    await gotoHome(page);
    const overlaps = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button, a'))
        .map((el) => {
          const r = el.getBoundingClientRect();
          const cs = window.getComputedStyle(el);
          return { r, vis: r.width > 0 && r.height > 0 && parseFloat(cs.opacity) > 0.5 };
        })
        .filter((b) => b.vis && b.r.top >= 0 && b.r.top < 70 && b.r.right > window.innerWidth - 500);
      const pairs: number[] = [];
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          const a = els[i].r;
          const b = els[j].r;
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
            pairs.push(1);
          }
        }
      }
      return pairs.length;
    });
    expect(overlaps).toBe(0);
  });

  test('no JS errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await gotoHome(page);
    expect(errors).toEqual([]);
  });
});
