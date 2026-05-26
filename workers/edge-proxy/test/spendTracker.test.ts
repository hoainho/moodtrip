import { describe, it, expect } from 'vitest';
import { estimateCostUsd } from '../src/spendTracker';
import type { Env } from '../src/types';

const env = {
  GEMINI_FLASH_INPUT_USD_PER_MTOK: '0.30',
  GEMINI_FLASH_OUTPUT_USD_PER_MTOK: '2.50',
  GEMINI_FLASH_LITE_INPUT_USD_PER_MTOK: '0.05',
  GEMINI_FLASH_LITE_OUTPUT_USD_PER_MTOK: '0.40',
} as Env;

describe('estimateCostUsd', () => {
  it('matches Oracle math for a typical Flash call (1650 in / 3000 out)', () => {
    const cost = estimateCostUsd(env, 'flash', 1650, 3000);
    expect(cost).toBeCloseTo(0.0079950, 6);
  });

  it('is materially cheaper on flash-lite', () => {
    const flash = estimateCostUsd(env, 'flash', 1650, 3000);
    const lite = estimateCostUsd(env, 'flash-lite', 1650, 3000);
    expect(lite).toBeLessThan(flash / 5);
  });

  it('returns 0 for zero tokens', () => {
    expect(estimateCostUsd(env, 'flash', 0, 0)).toBe(0);
  });

  it('scales linearly with output tokens', () => {
    const a = estimateCostUsd(env, 'flash', 1000, 1000);
    const b = estimateCostUsd(env, 'flash', 1000, 2000);
    expect(b - a).toBeCloseTo(2500 / 1_000_000, 9);
  });
});
