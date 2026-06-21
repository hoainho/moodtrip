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

/* ---- Life Tree growth ---------------------------------------------------------------------------
   The central Life Tree grows with the traveller's trip count and reaches its full form at 10 trips.
   Growth is auto-distributed across named stages so each early trip visibly levels the tree up. */
export const TREE_MAX_TRIPS = 10;

export interface TreeStage {
  /** Minimum trip count to reach this stage. */
  min: number;
  label: string;
}

// Stages are front-loaded (more levels early) so the first few trips feel rewarding.
export const TREE_STAGES: TreeStage[] = [
  { min: 0, label: 'Hạt mầm' },
  { min: 1, label: 'Mầm non' },
  { min: 3, label: 'Cây non' },
  { min: 5, label: 'Vươn cao' },
  { min: 8, label: 'Sum suê' },
  { min: TREE_MAX_TRIPS, label: 'Cổ thụ' },
];

export interface TreeGrowth {
  level: number;        // 0..maxLevel (index into TREE_STAGES)
  maxLevel: number;
  label: string;        // current stage label
  trips: number;        // actual (floored, clamped >=0) trip count
  progress: number;     // 0..1 toward TREE_MAX_TRIPS
  toMax: number;        // trips remaining to reach full growth (0 once reached)
  atMax: boolean;
  nextLabel: string | null;
  nextAt: number | null; // trip count at which the next stage unlocks
}

export function treeGrowth(tripCount: number): TreeGrowth {
  const trips = Math.max(0, Math.floor(tripCount || 0));
  let level = 0;
  for (let i = 0; i < TREE_STAGES.length; i++) {
    if (trips >= TREE_STAGES[i]!.min) level = i;
  }
  const next = level < TREE_STAGES.length - 1 ? TREE_STAGES[level + 1]! : null;
  return {
    level,
    maxLevel: TREE_STAGES.length - 1,
    label: TREE_STAGES[level]!.label,
    trips,
    progress: Math.min(1, trips / TREE_MAX_TRIPS),
    toMax: Math.max(0, TREE_MAX_TRIPS - trips),
    atMax: trips >= TREE_MAX_TRIPS,
    nextLabel: next ? next.label : null,
    nextAt: next ? next.min : null,
  };
}
