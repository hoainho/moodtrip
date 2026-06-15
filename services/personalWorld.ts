import type { ItineraryPlan } from '../types';
import type { TripRecord } from './tripsApi';

export interface PersonalWorldStats {
  tripCount: number;
  uniqueDestinations: number;
  regionsVisited: Set<'north' | 'central' | 'south' | 'mekong' | 'highlands' | 'unknown'>;
  oldestTripDays: number | null;
  topMoodTags: string[];
}

const REGION_BUCKETS: Array<[PersonalWorldStats['regionsVisited'] extends Set<infer R> ? R : never, RegExp]> = [
  ['north', /(hà nội|sapa|hạ long|ninh bình|hải phòng|nam định|hà giang|cao bằng)/i],
  ['central', /(huế|hue|đà nẵng|da nang|hội an|hoi an|quảng nam|quảng bình|nha trang)/i],
  ['south', /(sài gòn|sai gon|hồ chí minh|tphcm|tp\.hcm|vũng tàu|phú quốc)/i],
  ['mekong', /(cần thơ|can tho|bến tre|tiền giang|cà mau|an giang|miền tây|sóc trăng)/i],
  ['highlands', /(đà lạt|da lat|pleiku|kontum|buôn ma thuột)/i],
];

function classifyRegion(destination: string): PersonalWorldStats['regionsVisited'] extends Set<infer R> ? R : never {
  for (const [region, re] of REGION_BUCKETS) {
    if (re.test(destination)) return region;
  }
  return 'unknown' as never;
}

export function buildWorldStats(trips: TripRecord[]): PersonalWorldStats {
  const dests = new Set<string>();
  const regions = new Set<PersonalWorldStats['regionsVisited'] extends Set<infer R> ? R : never>();
  let oldest = Date.now();
  const moodCounter = new Map<string, number>();

  for (const trip of trips) {
    dests.add(trip.destination.toLowerCase());
    regions.add(classifyRegion(trip.destination));
    const ts = new Date(trip.createdAt).getTime();
    if (Number.isFinite(ts) && ts < oldest) oldest = ts;

    const formInput = trip.formInput as { moods?: string[]; shortMoods?: string[] } | null;
    for (const m of formInput?.moods ?? []) moodCounter.set(m, (moodCounter.get(m) ?? 0) + 1);
    for (const m of formInput?.shortMoods ?? []) moodCounter.set(m, (moodCounter.get(m) ?? 0) + 1);
  }

  const topMoodTags = Array.from(moodCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([m]) => m);

  return {
    tripCount: trips.length,
    uniqueDestinations: dests.size,
    regionsVisited: regions,
    oldestTripDays: trips.length === 0 ? null : Math.floor((Date.now() - oldest) / 86400000),
    topMoodTags,
  };
}

export interface WorldMilestone {
  threshold: number;
  label: string;
  description: string;
}

export const MILESTONES: WorldMilestone[] = [
  { threshold: 1, label: 'Lá thứ nhất', description: 'Chuyến đầu tiên của bạn' },
  { threshold: 3, label: 'Cây nhỏ', description: '3 chuyến đi — vườn của bạn bắt đầu hình thành' },
  { threshold: 5, label: 'Bụi tre', description: 'Có nhịp riêng rồi nhé' },
  { threshold: 10, label: 'Vườn nhỏ', description: '10 chuyến — tay du lịch thật rồi' },
  { threshold: 20, label: 'Rừng riêng', description: 'Bạn đã có một thế giới MoodTrip riêng' },
];

export function nextMilestone(tripCount: number): WorldMilestone | null {
  return MILESTONES.find((m) => m.threshold > tripCount) ?? null;
}

export function currentMilestone(tripCount: number): WorldMilestone | null {
  const eligible = MILESTONES.filter((m) => m.threshold <= tripCount);
  return eligible[eligible.length - 1] ?? null;
}

export const REGION_LABELS: Record<string, string> = {
  north: 'Miền Bắc',
  central: 'Miền Trung',
  south: 'Miền Nam',
  mekong: 'Miền Tây',
  highlands: 'Tây Nguyên',
  unknown: 'Khác',
};

export const MOOD_LABELS: Record<string, string> = {
  relax: 'Thư giãn',
  explore: 'Khám phá',
  nature: 'Thiên nhiên',
  romantic: 'Lãng mạn',
  adventure: 'Mạo hiểm',
  cultural: 'Văn hóa',
  date: 'Hẹn hò',
  cafe: 'Cà phê',
  food_tour: 'Ẩm thực',
  nightlife: 'Về đêm',
  fun: 'Vui chơi',
  chill: 'Chill',
};

export function tripRecordsFromItineraries(items: ItineraryPlan[]): TripRecord[] {
  return items.map((it) => ({
    id: String(it.id ?? it.destination),
    ownerId: '',
    destination: it.destination,
    tripMode: 'long' as const,
    itinerary: it,
    formInput: null,
    isPublic: false,
    shareSlug: null,
    parentRemixId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}
