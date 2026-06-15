import { test, expect } from '@playwright/test';
import { preacceptConsent, gotoHome } from './_helpers';

/**
 * Regression: standalone pages (Mẹo du lịch / Giới thiệu / Phiên bản) render their own sticky
 * header. The floating top-right "Về quê / Thế giới" cluster must NOT also appear on them (that
 * produced a duplicated/overlapping navbar). Instead "Về quê" lives inside each page's header and
 * opens the Đường-về-quê modal.
 */
const pages = [
  { label: 'Mẹo du lịch' },
  { label: 'Giới thiệu' },
  { label: 'Phiên bản' },
];

test.describe('Standalone page navbar (no duplication)', () => {
  test.beforeEach(async ({ page }) => {
    await preacceptConsent(page);
  });

  for (const p of pages) {
    test(`${p.label}: single header with in-nav "Về quê", no floating cluster`, async ({ page }) => {
      await gotoHome(page);
      await page.getByRole('button', { name: p.label, exact: true }).first().click();

      // Exactly one page header.
      await expect(page.locator('header')).toHaveCount(1);

      // The floating fixed top-right cluster must be gone on this page.
      await expect(page.locator('div.fixed.top-4.right-4')).toHaveCount(0);

      // Exactly one "Về quê" control, and it lives inside the header.
      const que = page.getByRole('button', { name: 'Đường về quê' });
      await expect(que).toHaveCount(1);
      await expect(page.locator('header').getByRole('button', { name: 'Đường về quê' })).toBeVisible();

      // It opens the Đường-về-quê modal.
      await que.click();
      await expect(page.getByText('Đường về quê', { exact: false }).first()).toBeVisible();
    });
  }
});
