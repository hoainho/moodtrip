import { describe, expect, it } from 'vitest';
import {
  COMPANION_CARDS,
  ELEMENT_CARDS,
  TEMPO_CARDS,
  buildPullNarrative,
  pullToMoods,
  shuffleAndPull,
} from '../cardPullDeck';

describe('shuffleAndPull', () => {
  it('returns one card per slot', () => {
    const pull = shuffleAndPull();
    expect(ELEMENT_CARDS.some((c) => c.id === pull.element)).toBe(true);
    expect(TEMPO_CARDS.some((c) => c.id === pull.tempo)).toBe(true);
    expect(COMPANION_CARDS.some((c) => c.id === pull.companion)).toBe(true);
  });

  it('is uniformly distributed across 5,000 trials within tolerance', () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 5000; i++) {
      const pull = shuffleAndPull();
      counts.set(pull.element, (counts.get(pull.element) ?? 0) + 1);
    }
    const expectedPerCard = 5000 / ELEMENT_CARDS.length;
    for (const card of ELEMENT_CARDS) {
      const observed = counts.get(card.id) ?? 0;
      expect(observed).toBeGreaterThan(expectedPerCard * 0.7);
      expect(observed).toBeLessThan(expectedPerCard * 1.3);
    }
  });

  it('respects custom seed for deterministic tests', () => {
    const seed = () => 0;
    const a = shuffleAndPull(seed);
    const b = shuffleAndPull(seed);
    expect(a).toEqual(b);
  });
});

describe('pullToMoods', () => {
  it('maps núi + chill + solo to nature/relax + chill', () => {
    const result = pullToMoods({ element: 'núi', tempo: 'chill', companion: 'solo' });
    expect(result.moods).toContain('nature');
    expect(result.moods).toContain('relax');
    expect(result.shortMoods).toContain('chill');
  });

  it('maps phố + festive + friends to explore + nightlife', () => {
    const result = pullToMoods({ element: 'phố', tempo: 'festive', companion: 'friends' });
    expect(result.moods).toContain('explore');
    expect(result.shortMoods).toContain('nightlife');
  });

  it('maps biển + romantic + couple to relax/nature + date', () => {
    const result = pullToMoods({ element: 'biển', tempo: 'romantic', companion: 'couple' });
    expect(result.moods).toContain('romantic');
    expect(result.moods).toContain('relax');
    expect(result.shortMoods).toContain('date');
  });

  it('caps moods at 3 entries each', () => {
    const result = pullToMoods({ element: 'phố', tempo: 'curious', companion: 'family' });
    expect(result.moods.length).toBeLessThanOrEqual(3);
    expect(result.shortMoods.length).toBeLessThanOrEqual(3);
  });
});

describe('buildPullNarrative', () => {
  it('returns a Vietnamese 3-segment narrative', () => {
    const text = buildPullNarrative({ element: 'núi', tempo: 'chill', companion: 'solo' });
    expect(text).toContain('Núi');
    expect(text).toContain('Chill');
    expect(text).toContain('Một mình');
  });
});
