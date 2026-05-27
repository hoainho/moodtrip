import { describe, expect, it } from 'vitest';
import {
  MILESTONES,
  buildWorldStats,
  currentMilestone,
  nextMilestone,
} from '../personalWorld';
import type { TripRecord } from '../tripsApi';

function makeTrip(overrides: Partial<TripRecord> = {}): TripRecord {
  return {
    id: 't' + Math.random(),
    ownerId: 'u1',
    destination: 'Đà Lạt',
    tripMode: 'long',
    itinerary: { destination: 'Đà Lạt', overview: '', timeline: [], food: [], accommodation: [], tips: [] },
    formInput: { moods: ['relax'] },
    isPublic: false,
    shareSlug: null,
    parentRemixId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('buildWorldStats', () => {
  it('counts trips, unique destinations, and regions visited', () => {
    const stats = buildWorldStats([
      makeTrip({ destination: 'Đà Lạt' }),
      makeTrip({ destination: 'Đà Lạt' }),
      makeTrip({ destination: 'Hà Nội' }),
      makeTrip({ destination: 'Cần Thơ' }),
    ]);
    expect(stats.tripCount).toBe(4);
    expect(stats.uniqueDestinations).toBe(3);
    expect(stats.regionsVisited.has('highlands')).toBe(true);
    expect(stats.regionsVisited.has('north')).toBe(true);
    expect(stats.regionsVisited.has('mekong')).toBe(true);
  });

  it('aggregates top moods across trips', () => {
    const stats = buildWorldStats([
      makeTrip({ formInput: { moods: ['relax', 'nature'] } }),
      makeTrip({ formInput: { moods: ['relax'] } }),
      makeTrip({ formInput: { moods: ['adventure'] } }),
    ]);
    expect(stats.topMoodTags[0]).toBe('relax');
  });

  it('returns null oldestTripDays for empty trips', () => {
    const stats = buildWorldStats([]);
    expect(stats.tripCount).toBe(0);
    expect(stats.oldestTripDays).toBeNull();
  });

  it('classifies destination as unknown if no regex matches', () => {
    const stats = buildWorldStats([makeTrip({ destination: 'Tokyo' })]);
    expect(stats.regionsVisited.has('unknown')).toBe(true);
  });
});

describe('milestones', () => {
  it('currentMilestone returns highest reached', () => {
    expect(currentMilestone(0)).toBeNull();
    expect(currentMilestone(1)?.label).toBe('Lá thứ nhất');
    expect(currentMilestone(5)?.label).toBe('Bụi tre');
    expect(currentMilestone(25)?.label).toBe('Rừng riêng');
  });

  it('nextMilestone returns the next unreached', () => {
    expect(nextMilestone(0)?.threshold).toBe(1);
    expect(nextMilestone(3)?.threshold).toBe(5);
    expect(nextMilestone(20)).toBeNull();
  });

  it('milestones are in ascending threshold order', () => {
    for (let i = 1; i < MILESTONES.length; i++) {
      const prev = MILESTONES[i - 1]!;
      const cur = MILESTONES[i]!;
      expect(cur.threshold).toBeGreaterThan(prev.threshold);
    }
  });
});
