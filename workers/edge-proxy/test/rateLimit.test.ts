import { describe, it, expect } from 'vitest';
import {
  utcDateKey,
  secondsUntilUtcMidnight,
  tierOf,
  dailyLimitFor,
} from '../src/rateLimit';
import type { Env, Claims, AnonClaims, SupabaseClaims } from '../src/types';

function fakeEnv(overrides: Partial<Env> = {}): Env {
  return {
    ANON_DAILY_LIMIT: '1',
    FREE_DAILY_LIMIT: '3',
    PAID_DAILY_LIMIT: '50',
    ...overrides,
  } as Env;
}

describe('utcDateKey', () => {
  it('returns YYYY-MM-DD for a given date', () => {
    expect(utcDateKey(new Date('2026-05-26T10:30:00Z'))).toBe('2026-05-26');
  });

  it('uses UTC, not local time', () => {
    expect(utcDateKey(new Date('2026-05-26T23:59:59Z'))).toBe('2026-05-26');
    expect(utcDateKey(new Date('2026-05-27T00:00:01Z'))).toBe('2026-05-27');
  });
});

describe('secondsUntilUtcMidnight', () => {
  it('returns positive number under 24h', () => {
    const s = secondsUntilUtcMidnight(new Date('2026-05-26T10:00:00Z'));
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(86400);
  });

  it('returns ~1 second just before midnight', () => {
    const s = secondsUntilUtcMidnight(new Date('2026-05-26T23:59:59Z'));
    expect(s).toBeLessThanOrEqual(2);
  });
});

describe('tierOf', () => {
  it('detects anonymous tier', () => {
    const c: AnonClaims = {
      sub: 'anon:x',
      tier: 'anonymous',
      ipHash: 'h',
      iat: 0,
      exp: 0,
      iss: 'i',
      aud: 'a',
    };
    expect(tierOf(c as Claims)).toBe('anonymous');
  });

  it('defaults to free for Supabase claims without tier', () => {
    const c: SupabaseClaims = {
      sub: 'user-1',
      role: 'authenticated',
      iat: 0,
      exp: 0,
      iss: 'i',
      aud: 'authenticated',
    };
    expect(tierOf(c as Claims)).toBe('free');
  });

  it('detects paid tier', () => {
    const c: SupabaseClaims = {
      sub: 'user-2',
      role: 'authenticated',
      tier: 'paid',
      iat: 0,
      exp: 0,
      iss: 'i',
      aud: 'authenticated',
    };
    expect(tierOf(c as Claims)).toBe('paid');
  });
});

describe('dailyLimitFor', () => {
  it('maps each tier to its env value', () => {
    const env = fakeEnv();
    expect(dailyLimitFor(env, 'anonymous')).toBe(1);
    expect(dailyLimitFor(env, 'free')).toBe(3);
    expect(dailyLimitFor(env, 'paid')).toBe(50);
  });
});
