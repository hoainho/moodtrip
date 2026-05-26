import { describe, it, expect } from 'vitest';
import { mintAnonToken, verifyToken, isAnonClaims } from '../src/jwt';
import type { Env } from '../src/types';

const env = {
  JWT_SIGNING_SECRET: 'a-test-jwt-secret-that-is-at-least-32-bytes-long-xx',
  SUPABASE_JWT_SECRET: 'a-test-supa-secret-that-is-at-least-32-bytes-long-xx',
  JWT_ISSUER: 'moodtrip-edge-proxy',
  JWT_AUDIENCE: 'moodtrip-app',
} as Env;

describe('mintAnonToken + verifyToken', () => {
  it('round-trips an anonymous token', async () => {
    const { token, expiresIn } = await mintAnonToken(env, 'iphash-abcd');
    expect(expiresIn).toBe(15 * 60);
    const claims = await verifyToken(env, token);
    expect(isAnonClaims(claims)).toBe(true);
    if (isAnonClaims(claims)) {
      expect(claims.tier).toBe('anonymous');
      expect(claims.ipHash).toBe('iphash-abcd');
      expect(claims.iss).toBe('moodtrip-edge-proxy');
      expect(claims.aud).toBe('moodtrip-app');
    }
  });

  it('rejects tampered tokens', async () => {
    const { token } = await mintAnonToken(env, 'iphash-abcd');
    const tampered = token.slice(0, -2) + 'AA';
    await expect(verifyToken(env, tampered)).rejects.toThrow();
  });

  it('rejects empty token', async () => {
    await expect(verifyToken(env, '')).rejects.toThrow();
  });
});
