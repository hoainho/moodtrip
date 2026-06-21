import { describe, expect, it } from 'vitest';
import { deriveMoodTheme, BALANCED_THEME, estimateMoodIntensity } from '../../hooks/useMoodTheme';

describe('deriveMoodTheme — emotion → atmosphere (pure)', () => {
  it('returns the balanced theme for null / empty input', () => {
    expect(deriveMoodTheme(null)).toEqual(BALANCED_THEME);
    expect(deriveMoodTheme({ text: '   ', seeds: [], intensity: 0.5 })).toEqual(BALANCED_THEME);
  });

  it('warm/healing language pushes warmth up', () => {
    const t = deriveMoodTheme({ text: 'mình muốn chữa lành, chậm rãi nghỉ dưỡng', seeds: [], intensity: 0.5 });
    expect(t.warmth).toBeGreaterThan(0.5);
  });

  it('cool/nature language pushes warmth down', () => {
    const t = deriveMoodTheme({ text: 'gần biển, mưa lạnh, rừng núi mát mẻ', seeds: [], intensity: 0.5 });
    expect(t.warmth).toBeLessThan(0.5);
  });

  it('adventurous language raises energy + particle speed', () => {
    const calm = deriveMoodTheme({ text: 'chữa lành tĩnh lặng', seeds: [], intensity: 0.5 });
    const wild = deriveMoodTheme({ text: 'phiêu lưu, khám phá, mạo hiểm sôi động', seeds: [], intensity: 0.5 });
    expect(wild.energy).toBeGreaterThan(calm.energy);
    expect(wild.particleSpeed).toBeGreaterThan(calm.particleSpeed);
  });

  it('intensity amplifies the deviation from neutral (warmth axis)', () => {
    const soft = deriveMoodTheme({ text: 'chữa lành', seeds: [], intensity: 0.1 });
    const strong = deriveMoodTheme({ text: 'chữa lành', seeds: [], intensity: 0.95 });
    expect(strong.warmth).toBeGreaterThan(soft.warmth);
  });

  it('intensity amplifies the energy axis too (symmetric with warmth)', () => {
    const soft = deriveMoodTheme({ text: 'phiêu lưu khám phá', seeds: [], intensity: 0.1 });
    const strong = deriveMoodTheme({ text: 'phiêu lưu khám phá', seeds: [], intensity: 0.95 });
    expect(strong.energy).toBeGreaterThan(soft.energy);
  });

  it('picks up emotion from seeds too, and emits a valid accent + clamped scalars', () => {
    const t = deriveMoodTheme({ text: '', seeds: ['phiêu lưu', 'gần thiên nhiên'], intensity: 0.7 });
    expect(t.accent).toMatch(/^hsl\(/);
    expect(t.warmth).toBeGreaterThanOrEqual(0);
    expect(t.warmth).toBeLessThanOrEqual(1);
    expect(t.energy).toBeGreaterThanOrEqual(0);
    expect(t.energy).toBeLessThanOrEqual(1);
  });

  it('negative/low feelings (buồn, mệt, cô đơn) read cooler than neutral', () => {
    const t = deriveMoodTheme({ text: 'đang buồn, mệt mỏi, cô đơn', seeds: [], intensity: 0.5 });
    expect(t.warmth).toBeLessThan(0.5);
  });

  it('agitation (bực bội, tức) reads more energetic than a sad baseline', () => {
    const sad = deriveMoodTheme({ text: 'đang buồn', seeds: [], intensity: 0.5 });
    const agitated = deriveMoodTheme({ text: 'bực bội, tức giận', seeds: [], intensity: 0.5 });
    expect(agitated.energy).toBeGreaterThan(sad.energy);
  });
});

describe('estimateMoodIntensity — drives the slider from words', () => {
  it('is neutral for empty input', () => {
    expect(estimateMoodIntensity('', [])).toBe(0.5);
  });
  it('rises with negative emotion words + intensifiers', () => {
    expect(estimateMoodIntensity('rất buồn và căng thẳng', [])).toBeGreaterThan(0.5);
  });
  it('counts emotion seeds too (incl. the new negative ones)', () => {
    expect(estimateMoodIntensity('', ['Đang buồn', 'Bực bội, áp lực'])).toBeGreaterThan(0.5);
  });
});
