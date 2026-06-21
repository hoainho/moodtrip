interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface PhotonFeature {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: { name?: string; city?: string; country?: string; state?: string };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

interface CacheEntry {
  lat: number;
  lng: number;
  display: string;
  ts: number;
  approximate?: boolean;
}

const CACHE_LS_KEY = 'moodtrip_geocoder_cache_v2';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PHOTON_BASE = 'https://photon.komoot.io/api/';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_RATE_LIMIT_MS = 1100;

let lastNominatimTs = 0;

export interface GeocodeResult {
  lat: number;
  lng: number;
  display: string;
  approximate?: boolean;
}

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

function cacheResult(key: string, result: GeocodeResult): GeocodeResult {
  const fresh = readCache();
  fresh[key] = { ...result, ts: Date.now() };
  writeCache(fresh);
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const COUNTRY_NOISE_RE = /,?\s*(việt\s*nam|vietnam|vn)\s*$/i;
const PROVINCE_PREFIX_RE = /^(tỉnh|thành\s+phố|tp\.?|huyện|quận|phường|xã)\s+/i;
const PAREN_RE = /\s*[\(（][^)）]*[\)）]\s*/g;
const SEPARATOR_RE = /\s+[-–—:|·]\s+/g;
const LEADING_NUMBER_RE = /^\d+[\.\)]\s+/;
const STOP_PREFIXES = [
  'thưởng thức', 'ăn ', 'ăn sáng', 'ăn trưa', 'ăn tối', 'uống', 'nghỉ',
  'check-in', 'tham quan', 'khám phá', 'dạo', 'đi ', 'di chuyển', 'mua sắm',
  'ghé thăm', 'trải nghiệm', 'cà phê sáng',
];

function cleanDestination(destination: string): string {
  return destination
    .replace(COUNTRY_NOISE_RE, '')
    .split(',')
    .map((part) => part.replace(PROVINCE_PREFIX_RE, '').trim())
    .filter(Boolean)
    .join(', ')
    .trim();
}

function cleanVenue(venue: string): string {
  let v = venue
    .replace(PAREN_RE, ' ')
    .replace(LEADING_NUMBER_RE, '')
    .trim();

  // "A -> B" / "A → B": geocode the arrival end, never the unparseable whole arrow string.
  const arrowParts = v.split(/\s*(?:->|–>|—>|=>|→)\s*/).map((s) => s.trim()).filter(Boolean);
  if (arrowParts.length >= 2) v = arrowParts[arrowParts.length - 1];

  const lowerV = v.toLowerCase();
  for (const prefix of STOP_PREFIXES) {
    if (lowerV.startsWith(prefix)) {
      const afterPrefix = v.slice(prefix.length).trim();
      const sepMatch = afterPrefix.match(/^(?:với|tại|ở|đến)\s+/i);
      const tail = sepMatch ? afterPrefix.slice(sepMatch[0].length).trim() : afterPrefix;
      if (tail) v = tail;
      break;
    }
  }

  const sepIdx = v.search(SEPARATOR_RE);
  if (sepIdx > 0) {
    const before = v.slice(0, sepIdx).trim();
    const after = v.slice(sepIdx).replace(SEPARATOR_RE, '').trim();
    v = after.length > before.length ? after : before;
  }

  return v.replace(/\s+/g, ' ').trim();
}

function buildQueryCandidates(venue: string, destination: string): string[] {
  const cleanDest = cleanDestination(destination);
  const cleanV = cleanVenue(venue);
  const rawV = venue.trim();
  const destFirstToken = cleanDest.split(',')[0]?.trim() ?? cleanDest;
  const candidates = [
    `${cleanV} ${destFirstToken}`,
    `${cleanV} ${cleanDest}`,
    `${cleanV}, ${cleanDest}`,
    cleanV,
    `${rawV} ${destFirstToken}`,
    rawV,
  ];
  return Array.from(new Set(candidates.filter(Boolean)));
}

async function tryPhoton(query: string, osmTag?: string, bias?: { lat: number; lng: number }): Promise<GeocodeResult | null> {
  const tagParam = osmTag ? `&osm_tag=${encodeURIComponent(osmTag)}` : '';
  // Photon only supports lang = default|de|en|fr (lang=vi → HTTP 400 broke every lookup). The optional
  // lat/lon bias (the trip's destination centre) disambiguates same-named places (e.g. "Nam Du").
  const biasParam = bias ? `&lat=${bias.lat}&lon=${bias.lng}` : '';
  const url = `${PHOTON_BASE}?q=${encodeURIComponent(query)}&limit=1&lang=en${tagParam}${biasParam}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as PhotonResponse;
    const first = data.features?.[0];
    if (!first) return null;
    const [lng, lat] = first.geometry.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const name = first.properties.name ?? '';
    const city = first.properties.city ?? '';
    const country = first.properties.country ?? '';
    const display = [name, city, country].filter(Boolean).join(', ');
    return { lat, lng, display };
  } catch (err) {
    console.warn('[geocoder] photon failed', err);
    return null;
  }
}

async function tryNominatim(query: string): Promise<GeocodeResult | null> {
  const now = Date.now();
  const wait = lastNominatimTs + NOMINATIM_RATE_LIMIT_MS - now;
  if (wait > 0) await sleep(wait);
  lastNominatimTs = Date.now();

  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=vn&addressdetails=0`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'vi,en' } });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult[];
    const first = data[0];
    if (!first) return null;
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, display: first.display_name };
  } catch (err) {
    console.warn('[geocoder] nominatim failed', err);
    return null;
  }
}

const AMENITY_HINT_RE = /(cafe|c[àa]\s*ph[êe]|qu[áa]n|nh[àa]\s*h[àa]ng|nem|b[áa]nh|l[ẩa]u|ph[ởo]|c[ơo]m|tr[àa]\s*sữa|bar|pub|club|kem)/i;
const TOURISM_HINT_RE = /(ch[ợo]|đ[ềe]n|ch[ùu]a|nh[àa]\s*th[ờo]|b[ảa]o\s*t[àa]ng|c[ôo]ng\s*vi[êe]n|h[ồo]|th[áa]c|n[úu]i|b[ãa]i\s*bi[ểe]n|v[ưu]?ờn|tr[ưu]?ờng)/i;
const ACCOMMODATION_HINT_RE = /(homestay|hostel|kh[áa]ch\s*s[ạa]n|hotel|villa|resort|nh[àa]\s*ngh[ỉi])/i;

function osmTagForVenue(venue: string): string | undefined {
  if (AMENITY_HINT_RE.test(venue)) return 'amenity';
  if (ACCOMMODATION_HINT_RE.test(venue)) return 'tourism';
  if (TOURISM_HINT_RE.test(venue)) return 'tourism';
  return undefined;
}

/** Vietnam bounding box (incl. offshore islands) — used to reject foreign/wrong geocode matches. */
export function inVietnamBbox(p: { lat: number; lng: number }): boolean {
  return p.lat >= 8 && p.lat <= 24 && p.lng >= 102 && p.lng <= 118;
}

/** Great-circle distance in km between two lat/lng points. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

export async function geocode(
  venue: string,
  destination: string,
  bias?: { lat: number; lng: number },
): Promise<GeocodeResult | null> {
  const trimmed = venue.trim();
  if (!trimmed) return null;

  const key = cacheKey(trimmed, destination);
  const cache = readCache();
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return {
      lat: cached.lat,
      lng: cached.lng,
      display: cached.display,
      approximate: cached.approximate,
    };
  }

  const queries = buildQueryCandidates(trimmed, destination);
  const osmTag = osmTagForVenue(trimmed);

  if (osmTag) {
    for (const q of queries.slice(0, 3)) {
      const result = await tryPhoton(q, osmTag, bias);
      if (result) return cacheResult(key, result);
    }
  }

  for (const q of queries) {
    const result = await tryPhoton(q, undefined, bias);
    if (result) return cacheResult(key, result);
  }

  for (const q of queries) {
    const result = await tryNominatim(q);
    if (result) return cacheResult(key, result);
  }

  return null;
}

export async function geocodeDestination(destination: string): Promise<GeocodeResult | null> {
  const cleaned = cleanDestination(destination);
  if (!cleaned) return null;

  const key = `__destination__|${cleaned.toLowerCase()}`;
  const cache = readCache();
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { lat: cached.lat, lng: cached.lng, display: cached.display };
  }

  const result = (await tryPhoton(cleaned)) ?? (await tryNominatim(cleaned));
  return result ? cacheResult(key, result) : null;
}

export async function geocodeBatch(
  items: Array<{ venue: string; destination: string; bias?: { lat: number; lng: number } }>,
  onProgress?: (done: number, total: number) => void,
  fallbackBias?: { lat: number; lng: number },
): Promise<Map<string, GeocodeResult | null>> {
  const results = new Map<string, GeocodeResult | null>();
  let done = 0;
  const unique: Array<{ venue: string; destination: string; bias?: { lat: number; lng: number }; key: string }> = [];
  const seen = new Set<string>();
  for (const item of items) {
    const k = cacheKey(item.venue, item.destination);
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push({ ...item, key: k });
  }

  const CONCURRENCY = 4;
  let cursor = 0;
  async function worker() {
    while (cursor < unique.length) {
      const idx = cursor++;
      const item = unique[idx];
      const r = await geocode(item.venue, item.destination, item.bias ?? fallbackBias);
      results.set(item.key, r);
      done++;
      onProgress?.(done, unique.length);
    }
  }
  const workers = Array.from({ length: Math.min(CONCURRENCY, unique.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export function jitterAround(
  center: { lat: number; lng: number },
  index: number,
  radius = 0.006,
): { lat: number; lng: number } {
  // Sequential outward spiral: consecutive fallback points (in schedule order) sit next to each
  // other, so the connecting line reads as a clean ordered path instead of a crossing "sunflower".
  const angle = index * 0.6; // ~34° step
  const r = radius * (1 + index * 0.16);
  return {
    lat: center.lat + Math.sin(angle) * r,
    lng: center.lng + Math.cos(angle) * r,
  };
}

/**
 * Decide a stop's final coordinate from its geocode hit, anchored to the region it belongs to.
 * This is the guard against cross-region mis-geocodes (e.g. a Cà Mau venue that Nominatim places in
 * HCM, ~250 km away): the hit is accepted ONLY when it lands near the region the stop belongs to;
 * otherwise we keep the stop in-region with a small jitter around the anchor (flagged approximate).
 *
 *  - `acceptAnchor`  hit accepted only if within `radiusKm` of this. `undefined` ⇒ accept any in-VN
 *      hit — used for the trip's departure/origin point, which is intentionally far from the
 *      destination, so there is no tight anchor to test it against.
 *  - `fallbackAnchor`  when the hit is missing or rejected, jitter around this anchor instead so the
 *      stop still renders in the correct area rather than vanishing or scattering cross-country.
 */
export function placeGeocodeHit(
  hit: { lat: number; lng: number } | null | undefined,
  acceptAnchor: { lat: number; lng: number } | undefined,
  fallbackAnchor: { lat: number; lng: number } | undefined,
  radiusKm: number,
  jitterIndex: number,
): { lat: number; lng: number; approximate?: boolean } | null {
  const hitOk = !!hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng) && inVietnamBbox(hit);
  if (hitOk && (!acceptAnchor || haversineKm(hit, acceptAnchor) <= radiusKm)) {
    return { lat: hit.lat, lng: hit.lng };
  }
  if (fallbackAnchor) {
    const j = jitterAround(fallbackAnchor, jitterIndex);
    return { lat: j.lat, lng: j.lng, approximate: true };
  }
  // No anchor to fall back to: keep an in-VN hit (better than dropping the stop), flagged approximate.
  return hitOk ? { lat: hit.lat, lng: hit.lng, approximate: true } : null;
}
