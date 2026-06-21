import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOsrmUrl, fetchRoadRoute } from '../routing';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildOsrmUrl', () => {
  it('encodes waypoints as lng,lat pairs joined by ";" (OSRM order, not lat,lng)', () => {
    const url = buildOsrmUrl([
      { lat: 16.07, lng: 108.22 },
      { lat: 16.0, lng: 108.25 },
    ]);
    expect(url).toContain('/driving/108.22,16.07;108.25,16');
    expect(url).toContain('overview=full');
    expect(url).toContain('geometries=geojson');
  });
});

describe('fetchRoadRoute', () => {
  it('returns the road geometry coordinates on success', async () => {
    const coords: [number, number][] = [
      [108.22, 16.07],
      [108.23, 16.05],
      [108.25, 16.0],
    ];
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ code: 'Ok', routes: [{ geometry: { coordinates: coords } }] }),
    })) as unknown as typeof fetch);

    const out = await fetchRoadRoute([
      { lat: 16.07, lng: 108.22 },
      { lat: 16.0, lng: 108.25 },
    ]);
    expect(out).toEqual(coords);
  });

  it('returns null when fewer than 2 points', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f as unknown as typeof fetch);
    expect(await fetchRoadRoute([{ lat: 16, lng: 108 }])).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it('returns null on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch);
    const out = await fetchRoadRoute([
      { lat: 21.05, lng: 105.8 },
      { lat: 21.0, lng: 105.85 },
    ]);
    expect(out).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }) as unknown as typeof fetch);
    const out = await fetchRoadRoute([
      { lat: 10.77, lng: 106.7 },
      { lat: 10.78, lng: 106.72 },
    ]);
    expect(out).toBeNull();
  });
});
