import type { Env, Claims, Tier } from './types';
import { isAnonClaims } from './jwt';

export function tierOf(claims: Claims): Tier {
  if (isAnonClaims(claims)) return 'anonymous';
  if ((claims as { tier?: string }).tier === 'paid') return 'paid';
  return 'free';
}

export function dailyLimitFor(env: Env, tier: Tier): number {
  switch (tier) {
    case 'anonymous':
      return Number(env.ANON_DAILY_LIMIT);
    case 'free':
      return Number(env.FREE_DAILY_LIMIT);
    case 'paid':
      return Number(env.PAID_DAILY_LIMIT);
  }
}

export function utcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function secondsUntilUtcMidnight(now: Date = new Date()): number {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.ceil((next.getTime() - now.getTime()) / 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
}

export async function consumeQuota(env: Env, claims: Claims): Promise<RateLimitResult> {
  const tier = tierOf(claims);
  const limit = dailyLimitFor(env, tier);
  const date = utcDateKey();
  const key = `q:${date}:${claims.sub}`;
  const ttl = secondsUntilUtcMidnight();

  const currentRaw = await env.RATE_LIMIT.get(key);
  const current = currentRaw ? Number(currentRaw) : 0;

  if (current >= limit) {
    return { allowed: false, remaining: 0, limit, resetSeconds: ttl };
  }

  const next = current + 1;
  await env.RATE_LIMIT.put(key, String(next), { expirationTtl: ttl });

  return { allowed: true, remaining: limit - next, limit, resetSeconds: ttl };
}
