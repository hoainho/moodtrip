import { describe, expect, it } from 'vitest';
import { generateShareSlug } from '../tripsApi';

describe('generateShareSlug', () => {
  it('returns 10 characters by default', () => {
    expect(generateShareSlug()).toHaveLength(10);
  });

  it('uses only the safe alphabet (no l, 1, 0, o)', () => {
    for (let i = 0; i < 50; i++) {
      const slug = generateShareSlug();
      expect(slug).toMatch(/^[abcdefghijkmnopqrstuvwxyz23456789]+$/);
    }
  });

  it('produces unique values across many calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(generateShareSlug());
    expect(set.size).toBeGreaterThan(995);
  });

  it('respects custom length', () => {
    expect(generateShareSlug(16)).toHaveLength(16);
  });
});
