import type { Env } from './types';

export interface PublicTrip {
  id: string;
  destination: string;
  share_slug: string;
  skeleton: {
    overview?: string;
    timeline?: Array<{ schedule?: Array<{ activity?: string }> }>;
  };
}

export async function fetchPublicTripBySlug(env: Env, slug: string): Promise<PublicTrip | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  const url = `${env.SUPABASE_URL}/rest/v1/trips?share_slug=eq.${encodeURIComponent(slug)}&is_public=eq.true&select=id,destination,share_slug,skeleton&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      accept: 'application/json',
    },
    cf: { cacheTtl: 60, cacheEverything: true },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as PublicTrip[];
  return rows[0] ?? null;
}
