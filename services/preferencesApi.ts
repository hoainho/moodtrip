import type { Mood, ShortTripMood } from '../types';
import { getSupabase } from './supabaseClient';
import type { Database } from '../src/types/database';

type PreferencesRow = Database['public']['Tables']['preferences']['Row'];
type PreferencesUpdate = Database['public']['Tables']['preferences']['Update'];

export interface PreferenceProfile {
  preferredMoods: Mood[];
  preferredShortMoods: ShortTripMood[];
  defaultBudget: number | null;
  defaultStartLocation: string | null;
  dietaryNotes: string | null;
  mobilityNotes: string | null;
  language: string;
  regionDialect: string | null;
}

function rowToProfile(row: PreferencesRow): PreferenceProfile {
  return {
    preferredMoods: row.preferred_moods as Mood[],
    preferredShortMoods: row.preferred_short_moods as ShortTripMood[],
    defaultBudget: row.default_budget,
    defaultStartLocation: row.default_start_location,
    dietaryNotes: row.dietary_notes,
    mobilityNotes: row.mobility_notes,
    language: row.language,
    regionDialect: row.region_dialect,
  };
}

export async function loadPreferences(userId: string): Promise<PreferenceProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data);
}

export async function setRegionDialect(userId: string, dialect: string | null): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('preferences').update({ region_dialect: dialect }).eq('user_id', userId);
}

export async function savePreferencesFromTrip(
  userId: string,
  input: {
    moods?: Mood[];
    shortMoods?: ShortTripMood[];
    budget?: number;
    startLocation?: string;
  },
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const existing = await loadPreferences(userId);
  const mergedMoods = mergeMoods(existing?.preferredMoods ?? [], input.moods ?? []);
  const mergedShortMoods = mergeMoods(existing?.preferredShortMoods ?? [], input.shortMoods ?? []);

  const update: PreferencesUpdate = {
    preferred_moods: mergedMoods as string[],
    preferred_short_moods: mergedShortMoods as string[],
    default_budget: input.budget ?? existing?.defaultBudget ?? null,
    default_start_location: input.startLocation ?? existing?.defaultStartLocation ?? null,
  };

  await supabase.from('preferences').update(update).eq('user_id', userId);
}

function mergeMoods<T extends string>(existing: T[], incoming: T[]): T[] {
  const seen = new Set<T>(existing);
  for (const m of incoming) seen.add(m);
  return Array.from(seen).slice(0, 6);
}
