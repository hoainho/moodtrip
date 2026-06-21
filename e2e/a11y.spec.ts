import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { preacceptConsent, gotoHome, clickExplore } from './_helpers';

// US-L5/L2: no serious/critical a11y (incl. contrast) on the key screens, over the 3D backdrop.
function seriousViolations(results: { violations: { impact?: string | null; id: string; nodes: { target: string[] }[] }[] }) {
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.impact}:${v.id} → ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join('  |  ')}`);
}

test.describe('Accessibility (axe) — no serious/critical', () => {
  test('landing', async ({ page }) => {
    await preacceptConsent(page);
    await gotoHome(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(seriousViolations(results)).toEqual([]);
  });

  test('card-pull onboarding', async ({ page }) => {
    await preacceptConsent(page);
    await gotoHome(page);
    await clickExplore(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(seriousViolations(results)).toEqual([]);
  });

  test('result view', async ({ page }) => {
    await preacceptConsent(page);
    await gotoHome(page);
    await clickExplore(page);
    await page.locator('button:has-text("Tôi muốn chọn thủ công")').first().click();
    await page.locator('input[placeholder*="AI gợi ý"]').first().fill('Đà Lạt');
    await page.locator('button:has-text("Tạo hành trình")').first().click({ force: true });
    await expect(page.getByText('HÀNH TRÌNH TỪ MƠ')).toBeVisible({ timeout: 60_000 });
    // Let the staged entrance animations finish: axe computes contrast against the *current* (possibly
    // mid-fade, opacity<1) colors, so sampling during fade-in yields false color-contrast violations.
    // Wait for the result to settle so axe sees the final, intended colors.
    await page.waitForTimeout(2000);
    const results = await new AxeBuilder({ page }).analyze();
    expect(seriousViolations(results)).toEqual([]);
  });
});
