import { describe, expect, it } from 'vitest';
import { buildMonuments, buildSceneState } from '../personalWorldScene';
import { buildWorldStats } from '../personalWorld';
import type { TripRecord } from '../tripsApi';

function makeTrip(destination: string, id = `t-${Math.random()}`): TripRecord {
  return {
    id,
    ownerId: 'u1',
    destination,
    tripMode: 'long',
    itinerary: { destination, overview: '', timeline: [], food: [], accommodation: [], tips: [] },
    formInput: null,
    isPublic: false,
    shareSlug: null,
    parentRemixId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('buildMonuments', () => {
  it('returns one monument per unique destination', () => {
    const monuments = buildMonuments([
      makeTrip('Đà Lạt', 't1'),
      makeTrip('Đà Lạt', 't2'),
      makeTrip('Hà Nội', 't3'),
      makeTrip('Cần Thơ', 't4'),
    ]);
    expect(monuments.length).toBe(3);
    expect(new Set(monuments.map((m) => m.destinationLabel.toLowerCase())).size).toBe(3);
  });

  it('classifies regions to kind pools deterministically', () => {
    const monuments = buildMonuments([
      makeTrip('Đà Lạt', 'fixed-1'),
      makeTrip('Hà Nội', 'fixed-2'),
      makeTrip('Cần Thơ', 'fixed-3'),
    ]);
    const byDest = Object.fromEntries(monuments.map((m) => [m.destinationLabel, m]));
    expect(['mountain', 'paddyField', 'tree']).toContain(byDest['Đà Lạt']!.kind);
    expect(['pagoda', 'lantern', 'tree']).toContain(byDest['Hà Nội']!.kind);
    expect(['riverBoat', 'paddyField', 'palm']).toContain(byDest['Cần Thơ']!.kind);
  });

  it('positions every monument within disk radius 6', () => {
    const monuments = buildMonuments(Array.from({ length: 30 }, (_, i) => makeTrip(`Place ${i}`, `id-${i}`)));
    for (const m of monuments) {
      const r = Math.hypot(m.position[0], m.position[2]);
      expect(r).toBeLessThanOrEqual(6.01);
    }
  });

  it('produces stable output for stable input', () => {
    const trips = [makeTrip('Đà Lạt', 'stable-1'), makeTrip('Huế', 'stable-2')];
    const a = buildMonuments(trips);
    const b = buildMonuments(trips);
    expect(a).toEqual(b);
  });
});

describe('buildSceneState', () => {
  it('grows ring radius with monument count, capped at 8', () => {
    const small = buildMonuments([makeTrip('A', 'a')]);
    const huge = buildMonuments(Array.from({ length: 50 }, (_, i) => makeTrip(`P${i}`, `id-${i}`)));
    const statsSmall = buildWorldStats([makeTrip('A', 'a')]);
    const statsHuge = buildWorldStats(Array.from({ length: 50 }, (_, i) => makeTrip(`P${i}`, `id-${i}`)));
    const sceneSmall = buildSceneState([makeTrip('A', 'a')], statsSmall);
    const sceneHuge = buildSceneState(
      Array.from({ length: 50 }, (_, i) => makeTrip(`P${i}`, `id-${i}`)),
      statsHuge,
    );
    expect(sceneSmall.ringRadius).toBeGreaterThan(0);
    expect(sceneHuge.ringRadius).toBeLessThanOrEqual(8);
    expect(huge.length).toBeGreaterThan(small.length);
  });
});
