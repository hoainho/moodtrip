import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import type { Database } from '../src/types/database';

type ConsentInsert = Database['public']['Tables']['consent_log']['Insert'];

export const CONSENT_VERSION = '2026-05-26-v1';

export const CONSENT_SCOPES = [
  'ai_generation_cross_border',
  'analytics_anonymous',
  'storage_local',
] as const;

export type ConsentScope = (typeof CONSENT_SCOPES)[number];

const CONSENT_LS_KEY = 'moodtrip_consent_v1';

interface StoredConsent {
  version: string;
  scopes: ConsentScope[];
  acceptedAt: number;
}

export function readLocalConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasConsented(scope: ConsentScope): boolean {
  const consent = readLocalConsent();
  return Boolean(consent?.scopes.includes(scope));
}

export async function recordConsent(
  scopes: ConsentScope[],
  opts: { userId?: string | null; anonymousTokenHash?: string | null } = {},
): Promise<void> {
  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    scopes,
    acceptedAt: Date.now(),
  };
  try {
    localStorage.setItem(CONSENT_LS_KEY, JSON.stringify(stored));
  } catch {
    void 0;
  }

  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const row: ConsentInsert = {
    user_id: opts.userId ?? null,
    anonymous_token_hash: opts.anonymousTokenHash ?? null,
    consent_version: CONSENT_VERSION,
    consent_scope: scopes,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 256) : null,
  };
  const { error } = await supabase.from('consent_log').insert(row);
  if (error) console.warn('[consent] failed to log to supabase', error.message);
}
