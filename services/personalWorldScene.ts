import type { PersonalWorldStats } from './personalWorld';
import type { TripRecord } from './tripsApi';

export type MonumentKind =
  | 'mountain'
  | 'palm'
  | 'pagoda'
  | 'lantern'
  | 'paddyField'
  | 'cafeTable'
  | 'riverBoat'
  | 'lighthouse'
  | 'tree';

export interface Monument {
  id: string;
  kind: MonumentKind;
  position: [number, number, number];
  scale: number;
  rotation: number;
  destinationLabel: string;
}

const REGION_TO_KIND: Record<string, MonumentKind[]> = {
  north: ['pagoda', 'lantern', 'tree'],
  central: ['lantern', 'pagoda', 'cafeTable'],
  south: ['palm', 'lighthouse', 'cafeTable'],
  mekong: ['riverBoat', 'paddyField', 'palm'],
  highlands: ['mountain', 'paddyField', 'tree'],
  unknown: ['tree'],
};

const REGION_KEYWORDS: Array<[keyof typeof REGION_TO_KIND, RegExp]> = [
  ['north', /(hà nội|sapa|hạ long|ninh bình|hải phòng|nam định|hà giang|cao bằng)/i],
  ['central', /(huế|hue|đà nẵng|da nang|hội an|hoi an|quảng nam|quảng bình|nha trang)/i],
  ['south', /(sài gòn|sai gon|hồ chí minh|tphcm|tp\.hcm|vũng tàu|phú quốc)/i],
  ['mekong', /(cần thơ|can tho|bến tre|tiền giang|cà mau|an giang|miền tây|sóc trăng)/i],
  ['highlands', /(đà lạt|da lat|pleiku|kontum|buôn ma thuột)/i],
];

function classifyRegion(destination: string): keyof typeof REGION_TO_KIND {
  for (const [region, re] of REGION_KEYWORDS) if (re.test(destination)) return region;
  return 'unknown';
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickFromHash<T>(arr: T[], seed: number): T {
  const idx = seed % arr.length;
  return arr[idx] as T;
}

function placeOnDisk(seed: number, radius = 6): [number, number, number] {
  const angle = ((seed % 360) / 360) * Math.PI * 2;
  const r = (((seed * 17) % 100) / 100) * radius;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  return [x, 0, z];
}

export function buildMonuments(trips: TripRecord[]): Monument[] {
  const seen = new Set<string>();
  const monuments: Monument[] = [];
  for (const trip of trips) {
    const key = trip.destination.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const seed = hashString(`${trip.id}:${trip.destination}`);
    const region = classifyRegion(trip.destination);
    const kindPool = REGION_TO_KIND[region] ?? REGION_TO_KIND.unknown;
    if (!kindPool) continue;
    const kind = pickFromHash(kindPool, seed);
    const position = placeOnDisk(seed);
    const scale = 0.85 + ((seed % 30) / 100);
    const rotation = ((seed % 1000) / 1000) * Math.PI * 2;
    monuments.push({
      id: trip.id,
      kind,
      position,
      scale,
      rotation,
      destinationLabel: trip.destination,
    });
  }
  return monuments;
}

export interface WorldSceneState {
  monuments: Monument[];
  totalTrips: number;
  uniqueDestinations: number;
  ringRadius: number;
}

export function buildSceneState(trips: TripRecord[], stats: PersonalWorldStats): WorldSceneState {
  const monuments = buildMonuments(trips);
  const ringRadius = Math.min(8, 4 + monuments.length * 0.2);
  return {
    monuments,
    totalTrips: stats.tripCount,
    uniqueDestinations: stats.uniqueDestinations,
    ringRadius,
  };
}
