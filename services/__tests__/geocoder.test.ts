import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geocode, inVietnamBbox, haversineKm } from '../geocoder';

describe('inVietnamBbox', () => {
  it('accepts real Vietnamese points (incl. multi-city + islands)', () => {
    expect(inVietnamBbox({ lat: 10.7737, lng: 106.7166 })).toBe(true); // Hồ Chí Minh
    expect(inVietnamBbox({ lat: 10.3644, lng: 104.4435 })).toBe(true); // Mũi Nai, Hà Tiên
    expect(inVietnamBbox({ lat: 9.9949, lng: 105.0917 })).toBe(true);  // Rạch Giá
    expect(inVietnamBbox({ lat: 9.68, lng: 104.36 })).toBe(true);      // Nam Du
    expect(inVietnamBbox({ lat: 21.0285, lng: 105.8542 })).toBe(true); // Hà Nội
  });
  it('rejects foreign points', () => {
    expect(inVietnamBbox({ lat: 48.8566, lng: 2.3522 })).toBe(false);  // Paris
    expect(inVietnamBbox({ lat: 13.7563, lng: 100.5018 })).toBe(false); // Bangkok
    expect(inVietnamBbox({ lat: 1.3521, lng: 103.8198 })).toBe(false);  // Singapore (below lat 8)
  });
});

describe('haversineKm', () => {
  const KIEN_GIANG = { lat: 9.767, lng: 104.473 };
  it('measures regional multi-city distances as a few hundred km', () => {
    // Real Kiên Giang-trip venues sit close to the destination centre.
    expect(haversineKm(KIEN_GIANG, { lat: 10.378, lng: 104.489 })).toBeLessThan(120); // Hà Tiên
    expect(haversineKm(KIEN_GIANG, { lat: 10.018, lng: 105.092 })).toBeLessThan(120); // Rạch Giá
    expect(haversineKm(KIEN_GIANG, { lat: 10.741, lng: 106.619 })).toBeLessThan(450); // HCM (~260 km)
  });
  it('flags cross-country mis-geocodes as far beyond the trip radius', () => {
    // "Khách sạn River Hà Tiên" mis-resolving to Hà Nội / Quảng Ninh — must exceed 450 km.
    expect(haversineKm(KIEN_GIANG, { lat: 21.028, lng: 105.858 })).toBeGreaterThan(450); // Hà Nội
    expect(haversineKm(KIEN_GIANG, { lat: 20.951, lng: 107.084 })).toBeGreaterThan(450); // Quảng Ninh
  });
});

describe('geocode Photon request', () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* ignore */ }
  });
  afterEach(() => vi.restoreAllMocks());

  it('uses lang=en (never the unsupported lang=vi) and applies the bias', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(String(url));
      return {
        ok: true,
        json: async () => ({
          features: [{ geometry: { coordinates: [108.2279, 16.0612] }, properties: { name: 'Cầu Rồng', city: 'Đà Nẵng', country: 'Vietnam' } }],
        }),
      };
    }) as unknown as typeof fetch);

    const r = await geocode('Cầu Rồng', 'Đà Nẵng', { lat: 16.05, lng: 108.2 });
    expect(r).toMatchObject({ lat: 16.0612, lng: 108.2279 });

    const photonUrl = urls.find((u) => u.includes('photon.komoot.io'));
    expect(photonUrl).toBeDefined();
    expect(photonUrl).toContain('lang=en');
    expect(photonUrl).not.toContain('lang=vi');
    expect(photonUrl).toContain('lat=16.05');
    expect(photonUrl).toContain('lon=108.2');
  });
});
