import { test, expect } from '@playwright/test';
import { preacceptConsent } from './_helpers';

// The trip map must render ONE continuous, order-clear journey: global sequential numbering
// (1 = departure → N = final stop), NOT per-day numbering that restarts each day. Stops carry coords
// in google_maps_link so the map skips network geocoding and renders deterministically (OSRM road
// snapping is optional/network — the ordered straight line is the offline fallback).
const mk = (time: string, venue: string, lat: number, lng: number) => ({
  time,
  activity: venue,
  venue,
  google_maps_link: `https://maps.google.com/?q=${lat},${lng}`,
});
const ITINERARY = {
  destination: 'Cà Mau',
  overview: 'Hành trình từ TP.HCM về Đất Mũi.',
  timeline: [
    {
      day: 'Ngày 1',
      title: 'TP.HCM → Cà Mau',
      schedule: [
        mk('06:00', 'Bến xe Miền Tây, TP.HCM', 10.7401, 106.6203),
        mk('10:30', 'Nghỉ chân Cần Thơ', 10.0452, 105.7469),
        mk('14:00', 'Homestay TP. Cà Mau', 9.1769, 105.1524),
      ],
    },
    {
      day: 'Ngày 2',
      title: 'Đất Mũi',
      schedule: [
        mk('07:30', 'Bạc Liêu', 9.2850, 105.7244),
        mk('11:00', 'Mũi Cà Mau (cực Nam)', 8.6200, 104.7200),
      ],
    },
  ],
  food: [{ name: 'Lẩu mắm U Minh', description: 'Đặc sản.' }],
  accommodation: [{ name: 'Homestay Tư Tỵ', type: 'Homestay', reason: 'Ấm cúng.' }],
  tips: ['Mang kem chống nắng.'],
};

test.describe('Trip map route', () => {
  test('renders one ordered journey with GLOBAL sequential numbering (1 → N), not per-day', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await preacceptConsent(page);
    await page.addInitScript((it) => {
      localStorage.setItem('moodtrip_saved_itinerary', JSON.stringify(it));
    }, ITINERARY);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Bản đồ hành trình' })).toBeVisible({ timeout: 25_000 });
    await page.getByRole('heading', { name: 'Bản đồ hành trình' }).scrollIntoViewIfNeeded();

    // Legend states the journey explicitly: departure (1) → final stop (N).
    await expect(page.getByText('Xuất phát (1)')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Điểm cuối (5)')).toBeVisible();

    // Markers carry the GLOBAL order 1..5 across both days (would be [1,1,2,2,3] if per-day numbering
    // regressed). Read numeric labels off the maplibre markers.
    const nums = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.maplibregl-marker'))
        .map((m) => (m.textContent || '').trim())
        .filter((t) => /^\d+$/.test(t))
        .map(Number)
        .sort((a, b) => a - b),
    );
    expect(nums).toEqual([1, 2, 3, 4, 5]);

    await page.waitForTimeout(2000); // let OSRM snap if reachable
    await page.locator('[aria-label="Bản đồ chuyến đi"]').screenshot({ path: 'renders/route-map.png' });
  });
});
