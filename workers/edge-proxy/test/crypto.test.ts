import { describe, it, expect } from 'vitest';
import { hashIp, sha256Hex, randomNonce } from '../src/crypto';

describe('sha256Hex', () => {
  it('matches known SHA-256 of "abc"', async () => {
    const out = await sha256Hex('abc');
    expect(out).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('hashIp', () => {
  it('is deterministic for same ip+salt', async () => {
    const a = await hashIp('203.0.113.7', 'salt-A');
    const b = await hashIp('203.0.113.7', 'salt-A');
    expect(a).toBe(b);
  });

  it('changes with salt rotation', async () => {
    const a = await hashIp('203.0.113.7', 'salt-A');
    const b = await hashIp('203.0.113.7', 'salt-B');
    expect(a).not.toBe(b);
  });

  it('outputs 32 hex chars', async () => {
    const a = await hashIp('203.0.113.7', 'salt-A');
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('randomNonce', () => {
  it('returns unique values', () => {
    const a = randomNonce();
    const b = randomNonce();
    expect(a).not.toBe(b);
  });

  it('respects byte length parameter', () => {
    expect(randomNonce(4)).toMatch(/^[0-9a-f]{8}$/);
    expect(randomNonce(16)).toMatch(/^[0-9a-f]{32}$/);
  });
});
