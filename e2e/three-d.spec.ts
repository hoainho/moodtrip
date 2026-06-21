import { test, expect } from '@playwright/test';
import { preacceptConsent, gotoHome } from './_helpers';

// G002 3D perf + robustness. NatureScene renders as the landing backdrop, so these run without a modal.
// RenderCountProbe writes the renderer frame count to window.__r3fRenderCount when window.__r3fForceRenderCount
// is set (or in DEV). PauseOnHidden flips the R3F frameloop to 'never' while the tab is hidden.
test.describe('3D scene perf + robustness (G002)', () => {
  test('render loop pauses when the tab is hidden', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __r3fForceRenderCount?: boolean }).__r3fForceRenderCount = true;
    });
    await preacceptConsent(page);
    await gotoHome(page);
    await page.waitForTimeout(1500); // scene mounts + advances the counter

    const before = await page.evaluate(() => (window as unknown as { __r3fRenderCount?: number }).__r3fRenderCount ?? null);
    test.skip(before === null, '__r3fRenderCount hook not exposed in this build');

    // Simulate the tab going hidden → PauseOnHidden should set frameloop 'never'.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(300); // let the last queued frame flush
    const settled = await page.evaluate(() => (window as unknown as { __r3fRenderCount?: number }).__r3fRenderCount ?? 0);
    await page.waitForTimeout(1500); // window during which a paused loop must NOT advance
    const after = await page.evaluate(() => (window as unknown as { __r3fRenderCount?: number }).__r3fRenderCount ?? 0);

    expect((after as number) - (settled as number)).toBeLessThanOrEqual(1); // paused (allow 1 flush frame)
  });

  test('no uncaught page errors when the 3D scene mounts', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await preacceptConsent(page);
    await gotoHome(page);
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('WebGL unavailable → graceful fallback, app does not crash', async ({ page }) => {
    await preacceptConsent(page);
    // Force every webgl context to null so the scene must fall back via SceneErrorBoundary / isWebGLAvailable.
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: any[]) {
        if (typeof type === 'string' && type.includes('webgl')) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (orig as any).call(this, type, ...args);
      };
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await gotoHome(page); // waits for the Hero CTA — proves the app rendered, not a white screen
    await expect(page.locator('button:has-text("Khám phá ngay")').first()).toBeVisible();
    // Forcing WebGL off legitimately emits the browser's own "Error creating WebGL context." — that is the
    // trigger, not an app crash. The app must not throw anything ELSE (graceful degradation).
    const unexpected = errors.filter((e) => !/webgl context|creating webgl|getcontext/i.test(e));
    expect(unexpected).toEqual([]);
  });
});
