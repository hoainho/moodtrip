import type { ItineraryPlan } from '../types';

export interface ResolvedVenue {
  name: string;
  day: number;
  time: string;
  lat?: number;
  lng?: number;
  mapsLink?: string;
  tiktokQuery?: string;
  approximate?: boolean;
}

const GOOGLE_MAPS_COORD_RE = /[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
const GOOGLE_MAPS_AT_RE = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;

function parseLatLng(url: string | undefined): { lat: number; lng: number } | null {
  if (!url) return null;
  const m1 = url.match(GOOGLE_MAPS_COORD_RE);
  if (m1 && m1[1] && m1[2]) {
    const lat = Number(m1[1]);
    const lng = Number(m1[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  const m2 = url.match(GOOGLE_MAPS_AT_RE);
  if (m2 && m2[1] && m2[2]) {
    const lat = Number(m2[1]);
    const lng = Number(m2[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

export function resolveVenues(itinerary: ItineraryPlan): ResolvedVenue[] {
  const venues: ResolvedVenue[] = [];
  itinerary.timeline.forEach((day, dayIdx) => {
    day.schedule.forEach((item) => {
      const venueName = item.venue || item.activity;
      const coords = parseLatLng(item.google_maps_link);
      venues.push({
        name: venueName,
        day: dayIdx + 1,
        time: item.time,
        lat: coords?.lat,
        lng: coords?.lng,
        mapsLink: item.google_maps_link,
        tiktokQuery: buildTiktokQuery(venueName, itinerary.destination),
      });
    });
  });
  return venues;
}

// A day title is usually "Locality – tagline" (e.g. "Hà Tiên - Chốn non nước hữu tình",
// "Quần đảo Nam Du – Biển xanh gọi mời", "Rạch Giá: về lại đất liền"), sometimes prefixed with
// "Ngày N". We extract the day's place name and geocode it as a per-day anchor so each venue is
// biased to its own town rather than one trip-wide centre.
const DAY_PREFIX_RE = /^(ngày|day)\s*\d+\s*[:.\-–—]?\s*/i;
// Split off a trailing tagline: " : tagline" (colon may have no leading space) or " - tagline".
const TAGLINE_SEP_RE = /\s*:\s+|\s+[-–—]\s+/;

export function dayLocality(title: string | undefined): string | null {
  if (!title) return null;
  const base = title.replace(DAY_PREFIX_RE, '').trim() || title.trim();
  const head = base.split(TAGLINE_SEP_RE)[0]?.trim();
  const locality = head || base;
  return locality.length >= 2 ? locality : null;
}

export function buildTiktokQuery(venueName: string, destination: string): string {
  const cleaned = venueName.replace(/["']/g, '').trim();
  const query = `${cleaned} ${destination}`.trim();
  return `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`;
}

export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
  center: { lat: number; lng: number };
}

export function computeBounds(venues: ResolvedVenue[]): MapBounds | null {
  const located = venues.filter(
    (v): v is ResolvedVenue & { lat: number; lng: number } => v.lat != null && v.lng != null,
  );
  if (located.length === 0) return null;
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;
  for (const v of located) {
    if (v.lat > north) north = v.lat;
    if (v.lat < south) south = v.lat;
    if (v.lng > east) east = v.lng;
    if (v.lng < west) west = v.lng;
  }
  return {
    west,
    south,
    east,
    north,
    center: { lat: (north + south) / 2, lng: (east + west) / 2 },
  };
}
