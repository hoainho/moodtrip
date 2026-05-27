import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';
import { listOwnedTrips, type TripRecord } from './tripsApi';
import { loadPreferences, type PreferenceProfile } from './preferencesApi';
import { CONSENT_VERSION, readLocalConsent } from './consent';

export const EXPORT_FORMAT_VERSION = '2026-05-26-v1';

export interface DataExportArchive {
  formatVersion: string;
  generatedAt: string;
  user: {
    id: string;
    email: string | null;
    createdAt: string | null;
  };
  preferences: PreferenceProfile | null;
  trips: TripRecord[];
  consent: {
    version: string;
    localScopes: string[];
    acceptedAt: number | null;
  };
  meta: {
    tripCount: number;
    note: string;
  };
}

export async function buildDataExport(user: User): Promise<DataExportArchive> {
  const [trips, preferences] = await Promise.all([
    listOwnedTrips(user.id, 1000),
    loadPreferences(user.id),
  ]);

  const localConsent = readLocalConsent();

  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    generatedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
    },
    preferences,
    trips,
    consent: {
      version: CONSENT_VERSION,
      localScopes: localConsent?.scopes ?? [],
      acceptedAt: localConsent?.acceptedAt ?? null,
    },
    meta: {
      tripCount: trips.length,
      note: 'MoodTrip data export — Nghị định 13/2023/NĐ-CP Article 11 (right to data portability).',
    },
  };
}

export function downloadArchive(archive: DataExportArchive): void {
  const json = JSON.stringify(archive, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moodtrip-export-${archive.user.id.slice(0, 8)}-${archive.generatedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface DeletionRequest {
  ok: boolean;
  error: string | null;
}

export async function requestAccountDeletionViaEdgeFunction(): Promise<DeletionRequest> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) return { ok: false, error: error.message };
  if (data && typeof data === 'object' && 'ok' in (data as object)) {
    await supabase.auth.signOut();
    return { ok: true, error: null };
  }
  return { ok: false, error: 'Unexpected response' };
}
