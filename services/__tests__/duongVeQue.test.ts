import { describe, expect, it } from 'vitest';
import {
  PROVINCE_LANDMARKS,
  buildQuePersonalNote,
  buildQueSeed,
  listProvinces,
} from '../duongVeQue';

describe('PROVINCE_LANDMARKS', () => {
  it('covers a minimum spread across 5 regions', () => {
    const regions = new Set(PROVINCE_LANDMARKS.map((p) => p.region));
    expect(regions.has('north')).toBe(true);
    expect(regions.has('central')).toBe(true);
    expect(regions.has('south')).toBe(true);
    expect(regions.has('mekong')).toBe(true);
    expect(regions.has('highlands')).toBe(true);
  });

  it('every province has at least one emotional prompt and one dish', () => {
    for (const p of PROVINCE_LANDMARKS) {
      expect(p.emotionalPrompts.length).toBeGreaterThanOrEqual(1);
      expect(p.signatureDishes.length).toBeGreaterThanOrEqual(1);
      expect(p.signatureLandmarks.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('buildQueSeed', () => {
  it('builds a seed for a known province', () => {
    const seed = buildQueSeed('Huế');
    expect(seed).not.toBeNull();
    expect(seed?.province).toBe('Huế');
    expect(seed?.region).toBe('central');
    expect(seed?.prompt.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    expect(buildQueSeed('hà nội')).not.toBeNull();
  });

  it('returns null for unknown province', () => {
    expect(buildQueSeed('Paris')).toBeNull();
  });
});

describe('buildQuePersonalNote', () => {
  it('mentions the province and emotional prompt', () => {
    const seed = buildQueSeed('Đà Lạt')!;
    const note = buildQuePersonalNote(seed);
    expect(note).toContain('Đà Lạt');
    expect(note).toContain(seed.prompt);
  });

  it('lists at most 3 landmarks', () => {
    const seed = buildQueSeed('Hà Nội')!;
    const note = buildQuePersonalNote(seed);
    const landmarkBlock = note.split('Ưu tiên ghé:')[1] ?? '';
    const landmarks = landmarkBlock.split('.')[0]?.split(',').length ?? 0;
    expect(landmarks).toBeLessThanOrEqual(3);
  });
});

describe('listProvinces', () => {
  it('returns all provinces in seed', () => {
    expect(listProvinces().length).toBe(PROVINCE_LANDMARKS.length);
  });
});
