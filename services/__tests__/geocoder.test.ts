import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { geocode, inVietnamBbox, haversineKm, placeGeocodeHit } from '../geocoder';

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

describe('placeGeocodeHit (cross-region rejection)', () => {
  const CA_MAU = { lat: 9.1769, lng: 105.1524 };
  const HCM = { lat: 10.7769, lng: 106.7009 };
  const R = 110;
  const dist = (p: { lat: number; lng: number } | null, q: { lat: number; lng: number }) =>
    haversineKm(p as { lat: number; lng: number }, q);

  it('accepts a hit within the region radius of its anchor (precise)', () => {
    const r = placeGeocodeHit({ lat: 9.18, lng: 105.16 }, CA_MAU, CA_MAU, R, 0);
    expect(r).toMatchObject({ lat: 9.18, lng: 105.16 });
    expect(r?.approximate).toBeUndefined();
  });

  it('REJECTS a Cà Mau venue mis-geocoded to HCM (~250 km) and jitters back into the Cà Mau region', () => {
    const r = placeGeocodeHit(HCM, CA_MAU, CA_MAU, R, 0);
    expect(r?.approximate).toBe(true);
    expect(dist(r, CA_MAU)).toBeLessThan(5); // stayed in-region
    expect(dist(r, HCM)).toBeGreaterThan(200); // NOT in HCM
  });

  it('accepts ANY in-Vietnam hit for the departure/origin (no accept anchor) — point 1 may be far from the destination', () => {
    const r = placeGeocodeHit(HCM, undefined, CA_MAU, R, 0);
    expect(r).toMatchObject({ lat: HCM.lat, lng: HCM.lng });
    expect(r?.approximate).toBeUndefined();
  });

  it('rejects a foreign hit even with no accept anchor, falling back in-region', () => {
    const r = placeGeocodeHit({ lat: 48.8566, lng: 2.3522 }, undefined, CA_MAU, R, 0); // Paris
    expect(r?.approximate).toBe(true);
    expect(dist(r, CA_MAU)).toBeLessThan(5);
  });

  it('jitters around the fallback anchor when there is no hit', () => {
    const r = placeGeocodeHit(null, CA_MAU, CA_MAU, R, 2);
    expect(r?.approximate).toBe(true);
    expect(dist(r, CA_MAU)).toBeLessThan(5);
  });

  it('returns null only when there is neither a usable hit nor a fallback anchor', () => {
    expect(placeGeocodeHit(null, undefined, undefined, R, 0)).toBeNull();
  });
});
