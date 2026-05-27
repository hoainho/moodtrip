import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decorateAffiliateUrl,
  isAllowedAffiliateUrl,
  newClickId,
  recordAffiliateClickIntent,
} from '../affiliate';
import { recordConsent } from '../consent';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('isAllowedAffiliateUrl', () => {
  it('accepts traveloka.com over https', () => {
    expect(isAllowedAffiliateUrl('traveloka', 'https://www.traveloka.com/hotel/abc')).toBe(true);
  });

  it('rejects non-https', () => {
    expect(isAllowedAffiliateUrl('traveloka', 'http://traveloka.com/x')).toBe(false);
  });

  it('rejects unknown domain', () => {
    expect(isAllowedAffiliateUrl('klook', 'https://evil.com/?ref=klook')).toBe(false);
  });

  it('rejects javascript: URLs', () => {
    expect(isAllowedAffiliateUrl('traveloka', 'javascript:alert(1)')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isAllowedAffiliateUrl('agoda', 'not a url')).toBe(false);
  });
});

describe('decorateAffiliateUrl', () => {
  it('adds aid + sub_id for Traveloka', () => {
    const url = decorateAffiliateUrl(
      { partner: 'traveloka', url: 'https://www.traveloka.com/x', context: {} },
      'click-abc',
    );
    const u = new URL(url);
    expect(u.searchParams.get('aid')).toBe('MOODTRIP_TVL');
    expect(u.searchParams.get('sub_id')).toBe('click-abc');
  });

  it('adds cid + tag for Agoda', () => {
    const url = decorateAffiliateUrl(
      { partner: 'agoda', url: 'https://www.agoda.com/x', context: {} },
      'cid-1',
    );
    const u = new URL(url);
    expect(u.searchParams.get('cid')).toBe('MOODTRIPAG');
    expect(u.searchParams.get('tag')).toBe('cid-1');
  });

  it('preserves pre-existing query params', () => {
    const url = decorateAffiliateUrl(
      { partner: 'klook', url: 'https://www.klook.com/x?source=foo', context: {} },
      'c',
    );
    const u = new URL(url);
    expect(u.searchParams.get('source')).toBe('foo');
    expect(u.searchParams.get('aid')).toBe('MOODTRIPKK');
  });
});

describe('newClickId', () => {
  it('returns 16 hex chars', () => {
    expect(newClickId()).toMatch(/^[0-9a-f]{16}$/);
  });
  it('produces unique values', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(newClickId());
    expect(set.size).toBeGreaterThan(995);
  });
});

describe('recordAffiliateClickIntent', () => {
  it('blocks unsafe URLs before requiring consent', async () => {
    const result = await recordAffiliateClickIntent(
      { partner: 'traveloka', url: 'https://evil.example.com/x', context: {} },
      { requireConsent: false },
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('BLOCKED_DOMAIN');
  });

  it('asks for consent when required and not yet given', async () => {
    const result = await recordAffiliateClickIntent(
      { partner: 'klook', url: 'https://www.klook.com/x', context: {} },
      { requireConsent: true },
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('CONSENT_REQUIRED');
  });

  it('allows click after consent recorded', async () => {
    await recordConsent(['ai_generation_cross_border']);
    const result = await recordAffiliateClickIntent(
      { partner: 'klook', url: 'https://www.klook.com/x', context: { tripId: 't1' } },
      { requireConsent: true },
    );
    expect(result.ok).toBe(true);
    expect(result.redirectUrl).toContain('aid=MOODTRIPKK');
    expect(result.clickId).toMatch(/^[0-9a-f]{16}$/);
  });
});
