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

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

// Single-column result layout: the map + actions stack BELOW the itinerary (centered),
// at every breakpoint — no 2-column split, no sticky sidebar.
test.describe('Result layout (single column)', () => {
  test('desktop >=1024px: map stacks below the itinerary, centered, no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await createTripToResult(page);
    const mapHeading = page.getByRole('heading', { name: 'Bản đồ hành trình' });
    await expect(mapHeading).toBeVisible();
    const box = await mapHeading.boundingBox();
    expect(box).not.toBeNull();
    // Single column: the map block is centered (max-w container), so it starts left of mid-viewport.
    expect(box!.x).toBeLessThan(1280 * 0.45);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
  });

  test('mobile <768px: single column, map stacks below, no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await createTripToResult(page);
    const mapHeading = page.getByRole('heading', { name: 'Bản đồ hành trình' });
    await expect(mapHeading).toBeVisible();
    const box = await mapHeading.boundingBox();
    expect(box!.x).toBeLessThan(390 * 0.25);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
  });

  test('mobile <768px: Storyboard + Compact view modes do not overflow horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await createTripToResult(page);
    const modes: Array<{ name: RegExp; shot: string | null }> = [
      { name: /Storyboard/, shot: 'renders/vm-storyboard-mobile.png' },
      { name: /Gọn/, shot: 'renders/vm-compact-mobile.png' },
      { name: /Lịch trình/, shot: null },
    ];
    for (const m of modes) {
      await page.getByRole('button', { name: m.name }).first().click();
      await page.waitForTimeout(400);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
      if (m.shot) await page.screenshot({ path: m.shot, fullPage: true });
    }
  });
});

// Real Gemini itineraries can contain very long names / number ranges / unbreakable tokens that the
// short MOCK fixture never produces. The timeline lives inside `grid md:grid-cols-2`, and grid items
// default to `min-width:auto`, so a wide min-content child used to blow the implicit mobile column
// past the viewport (page h-scroll) — most visibly in Storyboard. Guard every view mode at narrow
// widths against adversarial content so this can't regress.
const STRESS_ITINERARY = {
  destination: 'Cà Mau',
  overview: 'Hành trình về Đất Mũi — điểm cực Nam của Tổ quốc, với thời tiết và mẹo di chuyển cho từng ngày.',
  timeline: [
    {
      day: 'Ngày 1',
      title: 'Hành trình về Đất Mũi',
      schedule: [
        {
          time: '06:00 - 12:00',
          activity:
            'Di chuyển từ TP.HCM đến Cà Mau. KhuDuLichSinhThaiMuiCaMauVuonQuocGiaDatMuiXaDatMuiHuyenNgocHienTinhCaMau — đường dài nhưng đáng giá.',
          venue: 'KhuDuLichSinhThaiMuiCaMau-VuonQuocGiaDatMui-XaDatMui-HuyenNgocHien-TinhCaMauVietNam',
          estimated_cost: '200.000-300.000VNĐ/người(véxekhách+bảohiểm+hướngdẫnviên+nướcuống)',
          google_maps_link: 'https://www.google.com/maps/search/?api=1&query=Mui+Ca+Mau',
          is_trending: true,
          trending_reason: 'Điểm check-in cực Nam Tổ quốc đang được cộng đồng phượt thủ chia sẻ rất nhiều.',
        },
      ],
    },
  ],
  food: [{ name: 'Lẩu mắm U Minh', description: 'Đặc sản trứ danh.' }],
  accommodation: [{ name: 'Homestay Tư Tỵ', type: 'Homestay', reason: 'Ấm cúng.' }],
  tips: ['Mang theo kem chống nắng.'],
};

test.describe('Result view modes — adversarial long content', () => {
  test('mobile: Storyboard / Gọn / Lịch trình never overflow horizontally with long unbreakable content', async ({ page }) => {
    await preacceptConsent(page);
    await page.addInitScript((it) => {
      localStorage.setItem('moodtrip_saved_itinerary', JSON.stringify(it));
    }, STRESS_ITINERARY);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Storyboard/ }).first()).toBeVisible({ timeout: 25_000 });

    for (const mode of [/Storyboard/, /Gọn/, /Lịch trình/]) {
      await page.getByRole('button', { name: mode }).first().click();
      await page.waitForTimeout(300);
      for (const width of [390, 360, 320]) {
        await page.setViewportSize({ width, height: 844 });
        await page.waitForTimeout(200);
        expect(await horizontalOverflow(page), `mode=${mode.source} width=${width}`).toBeLessThanOrEqual(2);
      }
    }
    await page.getByRole('button', { name: /Storyboard/ }).first().click();
    await page.setViewportSize({ width: 360, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'renders/vm-storyboard-longcontent-360.png', fullPage: false });
  });
});

// The fixed one-screen home with the horizontal history strip must not overflow horizontally.
test.describe('Home layout', () => {
  test('mobile <768px: home has no horizontal overflow with saved history', async ({ page }) => {
    await preacceptConsent(page);
    // Seed a few saved trips so the history strip renders. First destination is long so the title
    // truncation under the (corner) delete button is actually exercised.
    await page.addInitScript(() => {
      const mk = (id: number, d: string) => ({ id, destination: d, overview: d + ' — chuyến đi đáng nhớ với nhiều hoạt động thú vị.', timeline: [{ day: 'N1', title: 't', schedule: [{ time: '08:00', activity: 'x' }, { time: '10:00', activity: 'y' }] }], food: [], accommodation: [], tips: [] });
      localStorage.setItem('moodtrip_saved_itineraries_list', JSON.stringify([mk(1, 'Ninh Bình, Việt Nam'), mk(2, 'Nha Trang'), mk(3, 'Cà Mau'), mk(4, 'Hà Nội')]));
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHome(page);
    await expect(page.getByText('Hành trình đã lưu')).toBeVisible({ timeout: 10_000 });
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);

    // Headline must clear the logo/nav zone (~44px) — never clipped/cramped under the logo.
    const h1box = await page.getByRole('heading', { name: 'Không biết đi đâu?' }).boundingBox();
    expect(h1box!.y, 'hero headline should sit below the logo zone').toBeGreaterThanOrEqual(56);

    // The history delete button must not horizontally overlap the (truncated) destination title.
    const nameBox = await page.locator('span.font-bold.truncate', { hasText: 'Ninh Bình' }).first().boundingBox();
    const btnBox = await page.getByRole('button', { name: 'Xóa lịch trình' }).first().boundingBox();
    expect(nameBox!.x + nameBox!.width, 'title must end before the delete button').toBeLessThanOrEqual(btnBox!.x + 1);

    await page.waitForTimeout(400);
    await page.screenshot({ path: 'renders/vm-home-mobile.png' });
  });
});
