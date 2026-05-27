import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

type Meta = { env?: Record<string, string> };

const url = (typeof import.meta !== 'undefined' && (import.meta as Meta).env?.VITE_SUPABASE_URL) || '';
const anonKey =
  (typeof import.meta !== 'undefined' && (import.meta as Meta).env?.VITE_SUPABASE_ANON_KEY) || '';

let cached: SupabaseClient<Database> | null = null;
let warned = false;

export function getSupabase(): SupabaseClient<Database> | null {
  if (cached) return cached;
  if (!url || !anonKey) {
    if (!warned) {
      console.warn(
        '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing; auth + persistence disabled.',
      );
      warned = true;
    }
    return null;
  }
  cached = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'moodtrip_supabase_session_v1',
    },
    global: {
      headers: { 'x-moodtrip-client': 'web' },
    },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}
