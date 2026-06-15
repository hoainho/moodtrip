// Road-following routing via the public OSRM demo server. Returns the real road geometry between
// ordered waypoints so the trip map can draw an accurate route instead of a straight line.
// Fails soft (returns null) — callers fall back to a straight line.

export interface LatLng {
  lat: number;
  lng: number;
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving/';
const MAX_WAYPOINTS = 25; // OSRM demo limit

interface OsrmResponse {
  code?: string;
  routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
}

/** Builds the OSRM URL. Coordinates are `lng,lat` pairs joined by `;` (OSRM order, NOT lat,lng). */
export function buildOsrmUrl(points: LatLng[]): string {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  return `${OSRM_BASE}${coords}?overview=full&geometries=geojson`;
}

const cache = new Map<string, [number, number][] | null>();

function cacheKey(points: LatLng[]): string {
  return points.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join('|');
}

/**
 * Fetches the road geometry connecting `points` in order.
 * @returns array of `[lng, lat]` positions for the route line, or `null` on any failure / <2 points.
 */
export async function fetchRoadRoute(points: LatLng[]): Promise<[number, number][] | null> {
  if (!Array.isArray(points) || points.length < 2) return null;
  const pts = points.slice(0, MAX_WAYPOINTS);

  const key = cacheKey(pts);
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const res = await fetch(buildOsrmUrl(pts), { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as OsrmResponse;
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      cache.set(key, null);
      return null;
    }
    cache.set(key, coords);
    return coords;
  } catch (err) {
    console.warn('[routing] OSRM request failed', err);
    cache.set(key, null);
    return null;
  }
}
