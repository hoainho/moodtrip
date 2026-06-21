import { describe, expect, it } from 'vitest';
import { seasonForMonth, seasonalMoodGroup, seedsToMoods, MOOD_SEED_GROUPS } from '../../constants';

describe('seasonForMonth — even 3-month seasons, rotates with the quarter', () => {
  it('maps each 0-based month to the right season', () => {
    expect([0, 1].map(seasonForMonth)).toEqual(['winter', 'winter']); // Jan, Feb
    expect([2, 3, 4].map(seasonForMonth)).toEqual(['spring', 'spring', 'spring']); // Mar–May
    expect([5, 6, 7].map(seasonForMonth)).toEqual(['summer', 'summer', 'summer']); // Jun–Aug
    expect([8, 9, 10].map(seasonForMonth)).toEqual(['autumn', 'autumn', 'autumn']); // Sep–Nov
    expect(seasonForMonth(11)).toBe('winter'); // Dec
  });
  it('covers all 12 months (no gap)', () => {
    expect(Array.from({ length: 12 }, (_, m) => seasonForMonth(m)).filter(Boolean)).toHaveLength(12);
  });
});

describe('seasonalMoodGroup — title + seeds actually change by season', () => {
  it('labels the current season and swaps its seeds', () => {
    expect(seasonalMoodGroup(2).title).toBe('Hợp mùa xuân này'); // Mar
    expect(seasonalMoodGroup(5).title).toBe('Hợp mùa hè này'); // Jun
    expect(seasonalMoodGroup(8).title).toBe('Hợp mùa thu này'); // Sep
    expect(seasonalMoodGroup(11).title).toBe('Hợp mùa đông này'); // Dec
    expect(seasonalMoodGroup(5).seeds).not.toEqual(seasonalMoodGroup(11).seeds);
  });
});

describe('emotion seeds cover the NEGATIVE spectrum (buồn / chán / bực / căng thẳng / cô đơn)', () => {
  it('exposes a "Cảm xúc hôm nay" group with negative feelings', () => {
    const grp = MOOD_SEED_GROUPS.find((g) => g.title === 'Cảm xúc hôm nay');
    expect(grp).toBeDefined();
    const labels = grp!.seeds.map((s) => s.label);
    expect(labels).toEqual(
      expect.arrayContaining(['Đang buồn', 'Căng thẳng, mệt mỏi', 'Chán, cần đổi gió', 'Bực bội, áp lực', 'Cô đơn']),
    );
  });

  it('maps each negative feeling to a HELPFUL trip taxonomy', () => {
    expect(seedsToMoods(['Đang buồn'])).toContain('relax'); // sad → soothe
    expect(seedsToMoods(['Căng thẳng, mệt mỏi'])).toEqual(expect.arrayContaining(['relax', 'nature'])); // stressed → decompress
    expect(seedsToMoods(['Chán, cần đổi gió'])).toEqual(expect.arrayContaining(['explore', 'adventure'])); // bored → novelty
    expect(seedsToMoods(['Bực bội, áp lực'])).toEqual(expect.arrayContaining(['adventure', 'nature'])); // frustrated → release/calm
  });
});
