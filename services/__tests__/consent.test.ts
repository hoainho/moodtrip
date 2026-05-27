import { beforeEach, describe, expect, it } from 'vitest';
import { CONSENT_VERSION, hasConsented, readLocalConsent, recordConsent } from '../consent';

beforeEach(() => {
  localStorage.clear();
});

describe('readLocalConsent', () => {
  it('returns null when no consent stored', () => {
    expect(readLocalConsent()).toBeNull();
  });

  it('returns stored consent for current version', async () => {
    await recordConsent(['storage_local']);
    const stored = readLocalConsent();
    expect(stored?.version).toBe(CONSENT_VERSION);
    expect(stored?.scopes).toEqual(['storage_local']);
  });

  it('returns null when stored version mismatches current', () => {
    localStorage.setItem(
      'moodtrip_consent_v1',
      JSON.stringify({ version: 'old-version', scopes: ['storage_local'], acceptedAt: Date.now() }),
    );
    expect(readLocalConsent()).toBeNull();
  });

  it('returns null for malformed stored JSON', () => {
    localStorage.setItem('moodtrip_consent_v1', '{not valid');
    expect(readLocalConsent()).toBeNull();
  });
});

describe('hasConsented', () => {
  it('returns true only for granted scopes', async () => {
    await recordConsent(['ai_generation_cross_border']);
    expect(hasConsented('ai_generation_cross_border')).toBe(true);
    expect(hasConsented('analytics_anonymous')).toBe(false);
  });
});
