import { beforeEach, describe, expect, it } from 'vitest';
import { migrationAlreadyDone, markMigrationDone, readLocalTrips } from '../localTripMigration';
import { ITINERARY_LS_KEY, SAVED_ITINERARIES_LS_KEY } from '../../constants';

beforeEach(() => {
  localStorage.clear();
});

describe('readLocalTrips', () => {
  it('returns empty state when nothing in storage', () => {
    const result = readLocalTrips();
    expect(result.current).toBeNull();
    expect(result.saved).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it('reads current itinerary when present', () => {
    localStorage.setItem(
      ITINERARY_LS_KEY,
      JSON.stringify({ destination: 'Đà Lạt', overview: 'x', timeline: [], food: [], accommodation: [], tips: [] }),
    );
    const result = readLocalTrips();
    expect(result.current?.destination).toBe('Đà Lạt');
    expect(result.totalCount).toBe(1);
  });

  it('reads multiple saved itineraries plus current', () => {
    localStorage.setItem(
      ITINERARY_LS_KEY,
      JSON.stringify({ destination: 'Đà Lạt', overview: 'x', timeline: [], food: [], accommodation: [], tips: [] }),
    );
    localStorage.setItem(
      SAVED_ITINERARIES_LS_KEY,
      JSON.stringify([
        { destination: 'Huế', overview: 'x', timeline: [], food: [], accommodation: [], tips: [] },
        { destination: 'Hội An', overview: 'x', timeline: [], food: [], accommodation: [], tips: [] },
      ]),
    );
    expect(readLocalTrips().totalCount).toBe(3);
  });

  it('survives malformed JSON', () => {
    localStorage.setItem(ITINERARY_LS_KEY, '{broken');
    const result = readLocalTrips();
    expect(result.current).toBeNull();
    expect(result.totalCount).toBe(0);
  });
});

describe('migration markers', () => {
  it('round-trips for the same userId', () => {
    expect(migrationAlreadyDone('user-1')).toBe(false);
    markMigrationDone('user-1');
    expect(migrationAlreadyDone('user-1')).toBe(true);
  });

  it('does not leak between users', () => {
    markMigrationDone('user-1');
    expect(migrationAlreadyDone('user-2')).toBe(false);
  });
});
