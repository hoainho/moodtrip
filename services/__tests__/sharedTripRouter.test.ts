import { describe, expect, it } from 'vitest';
import { buildOgImageUrl, buildShareUrl, parseCurrentRoute } from '../sharedTripRouter';

describe('parseCurrentRoute', () => {
  it('returns "app" when at root', () => {
    window.history.replaceState({}, '', '/');
    expect(parseCurrentRoute()).toEqual({ kind: 'app' });
  });

  it('returns "shared-trip" with extracted slug for /t/abc123', () => {
    window.history.replaceState({}, '', '/t/abc123');
    expect(parseCurrentRoute()).toEqual({ kind: 'shared-trip', slug: 'abc123' });
  });

  it('accepts trailing slash', () => {
    window.history.replaceState({}, '', '/t/abc123/');
    expect(parseCurrentRoute()).toEqual({ kind: 'shared-trip', slug: 'abc123' });
  });

  it('rejects too-short slugs', () => {
    window.history.replaceState({}, '', '/t/ab');
    expect(parseCurrentRoute()).toEqual({ kind: 'app' });
  });

  it('rejects too-long slugs', () => {
    window.history.replaceState({}, '', '/t/a1b2c3d4e5f6g7h8i9');
    expect(parseCurrentRoute()).toEqual({ kind: 'app' });
  });
});

describe('buildShareUrl', () => {
  it('joins origin and slug', () => {
    expect(buildShareUrl('abc123', 'https://example.test')).toBe('https://example.test/t/abc123');
  });
});

describe('buildOgImageUrl', () => {
  it('uses worker base when provided', () => {
    expect(buildOgImageUrl('abc123', 'https://api.test')).toBe('https://api.test/v1/og/abc123');
  });
});
