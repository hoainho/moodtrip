interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface CacheEntry {
  lat: number;
  lng: number;
  display: string;
  ts: number;
}

const CACHE_LS_KEY = 'moodtrip_geocoder_cache_v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1100;

let lastRequestTs = 0;

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>): void {
  try {
    localStorage.setItem(CACHE_LS_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('[geocoder] cache write failed', err);
  }
}

function cacheKey(query: string, destination: string): string {
  return `${query.toLowerCase().trim()}|${destination.toLowerCase().trim()}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  display: string;
}

export async function geocode(venue: string, destination: string): Promise<GeocodeResult | null> {
  const trimmed = venue.trim();
  if (!trimmed) return null;
  const key = cacheKey(trimmed, destination);
  const cache = readCache();
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { lat: cached.lat, lng: cached.lng, display: cached.display };
  }

  const now = Date.now();
  const wait = lastRequestTs + RATE_LIMIT_MS - now;
  if (wait > 0) await sleep(wait);
  lastRequestTs = Date.now();

  const query = `${trimmed}, ${destination}, Vietnam`;
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=vn&addressdetails=0`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'vi,en',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult[];
    const first = data[0];
    if (!first) return null;
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const fresh = readCache();
    fresh[key] = { lat, lng, display: first.display_name, ts: Date.now() };
    writeCache(fresh);
    return { lat, lng, display: first.display_name };
  } catch (err) {
    console.warn('[geocoder] request failed', err);
    return null;
  }
}

export async function geocodeBatch(
  items: Array<{ venue: string; destination: string }>,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, GeocodeResult | null>> {
  const results = new Map<string, GeocodeResult | null>();
  let done = 0;
  for (const item of items) {
    const key = cacheKey(item.venue, item.destination);
    if (results.has(key)) {
      done++;
      onProgress?.(done, items.length);
      continue;
    }
    const r = await geocode(item.venue, item.destination);
    results.set(key, r);
    done++;
    onProgress?.(done, items.length);
  }
  return results;
}
