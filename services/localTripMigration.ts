import type { ItineraryPlan } from '../types';
import { ITINERARY_LS_KEY, SAVED_ITINERARIES_LS_KEY } from '../constants';
import { getSupabase } from './supabaseClient';
import type { Database, Json } from '../src/types/database';

type TripInsert = Database['public']['Tables']['trips']['Insert'];

const MIGRATION_DONE_LS_KEY = 'moodtrip_local_migration_done_v1';

export interface PendingMigration {
  current: ItineraryPlan | null;
  saved: ItineraryPlan[];
  totalCount: number;
}

export function readLocalTrips(): PendingMigration {
  const current = safeRead<ItineraryPlan>(ITINERARY_LS_KEY);
  const saved = safeRead<ItineraryPlan[]>(SAVED_ITINERARIES_LS_KEY) ?? [];
  return {
    current,
    saved,
    totalCount: (current ? 1 : 0) + saved.length,
  };
}

export function migrationAlreadyDone(userId: string): boolean {
  try {
    const raw = localStorage.getItem(MIGRATION_DONE_LS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { userId: string };
    return parsed.userId === userId;
  } catch {
    return false;
  }
}

export function markMigrationDone(userId: string): void {
  try {
    localStorage.setItem(MIGRATION_DONE_LS_KEY, JSON.stringify({ userId, ts: Date.now() }));
  } catch {
    void 0;
  }
}

export interface MigrationResult {
  imported: number;
  failed: number;
  errors: string[];
}

export async function migrateLocalTrips(userId: string): Promise<MigrationResult> {
  const supabase = getSupabase();
  if (!supabase) return { imported: 0, failed: 0, errors: ['Supabase not configured'] };

  const local = readLocalTrips();
  const trips: ItineraryPlan[] = [
    ...(local.current ? [local.current] : []),
    ...local.saved,
  ];

  const result: MigrationResult = { imported: 0, failed: 0, errors: [] };
  const seen = new Set<string>();

  for (const trip of trips) {
    const dedupeKey = `${trip.destination}::${trip.id ?? ''}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const row: TripInsert = {
      owner_id: userId,
      destination: trip.destination,
      trip_mode: 'long',
      form_input: { migrated_from_local: true } satisfies Json,
      skeleton: trip as unknown as Json,
      is_public: false,
    };
    const { error } = await supabase.from('trips').insert(row);

    if (error) {
      result.failed += 1;
      result.errors.push(`${trip.destination}: ${error.message}`);
    } else {
      result.imported += 1;
    }
  }

  if (result.failed === 0) {
    markMigrationDone(userId);
  }
  return result;
}

export function clearLocalTripsAfterMigration(): void {
  try {
    localStorage.removeItem(ITINERARY_LS_KEY);
    localStorage.removeItem(SAVED_ITINERARIES_LS_KEY);
  } catch {
    void 0;
  }
}

function safeRead<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
