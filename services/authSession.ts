import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

export interface AuthSnapshot {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const listeners = new Set<(snap: AuthSnapshot) => void>();
let currentSnapshot: AuthSnapshot = { user: null, session: null, loading: true };
let initialized = false;

function emit(snap: AuthSnapshot): void {
  currentSnapshot = snap;
  for (const listener of listeners) listener(snap);
}

async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;
  const supabase = getSupabase();
  if (!supabase) {
    emit({ user: null, session: null, loading: false });
    return;
  }
  const { data } = await supabase.auth.getSession();
  emit({ user: data.session?.user ?? null, session: data.session, loading: false });
  supabase.auth.onAuthStateChange((_event, session) => {
    emit({ user: session?.user ?? null, session, loading: false });
  });
}

export function subscribeAuth(listener: (snap: AuthSnapshot) => void): () => void {
  listeners.add(listener);
  listener(currentSnapshot);
  void ensureInitialized();
  return () => listeners.delete(listener);
}

export function getCurrentSnapshot(): AuthSnapshot {
  return currentSnapshot;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  await ensureInitialized();
  return currentSnapshot.session?.access_token ?? null;
}

export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase not configured') };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  return { error };
}

export async function signInWithOAuth(provider: 'google' | 'apple'): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase not configured') };
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  return { error };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function requestAccountDeletion(): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase not configured') };
  const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) return { error };
  if (data && typeof data === 'object' && 'ok' in (data as object)) {
    await supabase.auth.signOut();
    return { error: null };
  }
  return { error: new Error('Deletion did not confirm') };
}
