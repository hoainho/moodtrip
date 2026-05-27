import type { ItineraryPlan, FormData } from '../types';
import { getSupabase } from './supabaseClient';
import type { Database, Json } from '../src/types/database';

type TripRow = Database['public']['Tables']['trips']['Row'];
type TripInsert = Database['public']['Tables']['trips']['Insert'];
type TripUpdate = Database['public']['Tables']['trips']['Update'];

export interface TripRecord {
  id: string;
  ownerId: string;
  destination: string;
  tripMode: 'long' | 'short';
  itinerary: ItineraryPlan;
  formInput: Partial<FormData> | null;
  isPublic: boolean;
  shareSlug: string | null;
  parentRemixId: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToRecord(row: TripRow): TripRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    destination: row.destination,
    tripMode: row.trip_mode,
    itinerary: row.skeleton as unknown as ItineraryPlan,
    formInput: (row.form_input as unknown as Partial<FormData> | null) ?? null,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
    parentRemixId: row.parent_remix_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SLUG_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789';

export function generateShareSlug(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    const b = bytes[i];
    if (b === undefined) continue;
    out += SLUG_ALPHABET[b % SLUG_ALPHABET.length];
  }
  return out;
}

export async function saveTrip(
  ownerId: string,
  itinerary: ItineraryPlan,
  formInput: Partial<FormData>,
  opts: { tripMode?: 'long' | 'short'; isPublic?: boolean; parentRemixId?: string | null } = {},
): Promise<TripRecord> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const row: TripInsert = {
    owner_id: ownerId,
    destination: itinerary.destination,
    trip_mode: opts.tripMode ?? 'long',
    form_input: formInput as unknown as Json,
    skeleton: itinerary as unknown as Json,
    is_public: opts.isPublic ?? false,
    parent_remix_id: opts.parentRemixId ?? null,
    share_slug: opts.isPublic ? generateShareSlug() : null,
  };

  const { data, error } = await supabase.from('trips').insert(row).select().single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to save trip');
  return rowToRecord(data);
}

export async function listOwnedTrips(ownerId: string, limit = 50): Promise<TripRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(rowToRecord);
}

export async function getTripBySlug(slug: string): Promise<TripRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .maybeSingle();
  if (error || !data) return null;
  return rowToRecord(data);
}

export async function togglePublic(tripId: string, makePublic: boolean): Promise<TripRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const update: TripUpdate = {
    is_public: makePublic,
    share_slug: makePublic ? generateShareSlug() : null,
  };
  const { data, error } = await supabase
    .from('trips')
    .update(update)
    .eq('id', tripId)
    .select()
    .single();
  if (error || !data) return null;
  return rowToRecord(data);
}

export async function deleteTrip(tripId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  return !error;
}

export async function forkTrip(parentSlug: string, newOwnerId: string): Promise<TripRecord | null> {
  const parent = await getTripBySlug(parentSlug);
  if (!parent) return null;
  return saveTrip(newOwnerId, parent.itinerary, parent.formInput ?? {}, {
    tripMode: parent.tripMode,
    isPublic: false,
    parentRemixId: parent.id,
  });
}
