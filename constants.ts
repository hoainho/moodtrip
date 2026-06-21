import type { Mood, ShortTripMood, MoodInput } from './types';

export const ITINERARY_LS_KEY = 'moodtrip_saved_itinerary';
export const SAVED_ITINERARIES_LS_KEY = 'moodtrip_saved_itineraries_list';

/* ============================================================
   FLEXIBLE MOOD — emotion seeds, click-to-build (tap to compose a trip without typing).
   Seeds are grouped by the angle a traveller actually thinks in — mood, space, style — plus a
   season-aware group derived from the current month (weather/season/trend). Each seed carries the
   internal Mood(s) it derives to, so seedsToMoods() can still feed the card-pull, preferences, the
   3D personal world and persona lines. Labels are Capitalized for display.
   ============================================================ */
export interface MoodSeed {
  label: string;
  moods: Mood[];
}
export interface ShortMoodSeed {
  label: string;
  shortMoods: ShortTripMood[];
}
export interface MoodSeedGroup {
  title: string;
  seeds: MoodSeed[];
}
export interface ShortMoodSeedGroup {
  title: string;
  seeds: ShortMoodSeed[];
}

export const MOOD_SEED_GROUPS: MoodSeedGroup[] = [
  {
    // The RAW current feeling (answers "Hôm nay, lòng bạn thế nào?") — covers the negative end too
    // (buồn / chán / bực / căng thẳng / cô đơn), each mapped to the trip that helps: soothe when low,
    // novelty when bored, release/calm when frustrated. The label itself feeds the AI prompt so it
    // reads the real emotion and crafts an empathetic itinerary.
    title: 'Cảm xúc hôm nay',
    seeds: [
      { label: 'Vui phơi phới', moods: ['explore'] },
      { label: 'Đang buồn', moods: ['relax'] },
      { label: 'Căng thẳng, mệt mỏi', moods: ['relax', 'nature'] },
      { label: 'Chán, cần đổi gió', moods: ['explore', 'adventure'] },
      { label: 'Bực bội, áp lực', moods: ['adventure', 'nature'] },
      { label: 'Cô đơn', moods: ['relax', 'explore'] },
    ],
  },
  {
    title: 'Tâm trạng',
    seeds: [
      { label: 'Chữa lành', moods: ['relax'] },
      { label: 'Bình yên', moods: ['relax'] },
      { label: 'Lãng mạn', moods: ['romantic'] },
      { label: 'Phiêu lưu', moods: ['adventure'] },
      { label: 'Sôi động', moods: ['explore'] },
      { label: 'Hoài niệm', moods: ['cultural'] },
    ],
  },
  {
    title: 'Không gian',
    seeds: [
      { label: 'Gần biển', moods: ['relax', 'nature'] },
      { label: 'Núi rừng', moods: ['nature', 'adventure'] },
      { label: 'Phố thị', moods: ['explore'] },
      { label: 'Đồng quê', moods: ['relax', 'nature'] },
      { label: 'Hồ & suối', moods: ['nature'] },
    ],
  },
  {
    title: 'Kiểu đi',
    seeds: [
      { label: 'Nghỉ dưỡng', moods: ['relax'] },
      { label: 'Check-in sống ảo', moods: ['explore'] },
      { label: 'Food tour', moods: ['explore'] },
      { label: 'Cắm trại', moods: ['nature', 'adventure'] },
      { label: 'Road trip', moods: ['adventure', 'explore'] },
      { label: 'Đắm mình văn hoá', moods: ['cultural'] },
    ],
  },
];

export const SHORT_MOOD_SEED_GROUPS: ShortMoodSeedGroup[] = [
  {
    title: 'Tâm trạng',
    seeds: [
      { label: 'Chill dạo phố', shortMoods: ['chill'] },
      { label: 'Vui chơi', shortMoods: ['fun'] },
      { label: 'Hẹn hò', shortMoods: ['date'] },
    ],
  },
  {
    title: 'Kiểu đi',
    seeds: [
      { label: 'Cafe đẹp', shortMoods: ['cafe'] },
      { label: 'Food tour', shortMoods: ['food_tour'] },
      { label: 'Nightlife', shortMoods: ['nightlife'] },
    ],
  },
];

/* ---- Season-aware suggestions (weather / mùa / trend) ----------------------------------------
   The component passes the current month (new Date().getMonth(), 0-based) so the form surfaces
   season-fitting ideas at the top — "Hợp mùa hè này", etc. */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function seasonForMonth(month: number): Season {
  // 0-based month. Even meteorological seasons (3 months each) so the seasonal suggestions rotate
  // predictably with the quarter: spring Mar–May, summer Jun–Aug, autumn Sep–Nov, winter Dec–Feb.
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

const SEASON_LABEL: Record<Season, string> = {
  spring: 'mùa xuân',
  summer: 'mùa hè',
  autumn: 'mùa thu',
  winter: 'mùa đông',
};

const SEASONAL_MOOD_SEEDS: Record<Season, MoodSeed[]> = {
  spring: [
    { label: 'Mùa hoa nở', moods: ['nature', 'romantic'] },
    { label: 'Nắng dịu', moods: ['relax'] },
    { label: 'Trẩy hội xuân', moods: ['cultural', 'explore'] },
  ],
  summer: [
    { label: 'Trốn nóng', moods: ['relax', 'nature'] },
    { label: 'Biển xanh nắng vàng', moods: ['relax', 'nature'] },
    { label: 'Lặn & chèo SUP', moods: ['adventure'] },
  ],
  autumn: [
    { label: 'Mùa lúa chín', moods: ['nature', 'cultural'] },
    { label: 'Săn mây', moods: ['nature', 'adventure'] },
    { label: 'Lãng đãng thu', moods: ['romantic', 'relax'] },
  ],
  winter: [
    { label: 'Se lạnh sương sớm', moods: ['relax'] },
    { label: 'Sưởi ấm bên nhau', moods: ['romantic'] },
    { label: 'Săn tuyết & hoa đào', moods: ['nature', 'adventure'] },
  ],
};

/** Season-fitting seed group for the given month (0-based). Shown first to inspire the user. */
export function seasonalMoodGroup(month: number): MoodSeedGroup {
  const s = seasonForMonth(month);
  return { title: `Hợp ${SEASON_LABEL[s]} này`, seeds: SEASONAL_MOOD_SEEDS[s] };
}

// Flat lookups (every group + every season) so seed→taxonomy bridging works regardless of which
// chips were shown this month.
const ALL_MOOD_SEEDS: MoodSeed[] = [
  ...MOOD_SEED_GROUPS.flatMap((g) => g.seeds),
  ...Object.values(SEASONAL_MOOD_SEEDS).flat(),
];
const ALL_SHORT_SEEDS: ShortMoodSeed[] = SHORT_MOOD_SEED_GROUPS.flatMap((g) => g.seeds);

/** Bridge open seed labels → internal Mood taxonomy (deduped). */
export function seedsToMoods(labels: string[]): Mood[] {
  const set = new Set<Mood>();
  for (const label of labels) {
    ALL_MOOD_SEEDS.find((s) => s.label === label)?.moods.forEach((m) => set.add(m));
  }
  return Array.from(set);
}

/** Bridge open seed labels → internal ShortTripMood taxonomy (deduped). */
export function seedsToShortMoods(labels: string[]): ShortTripMood[] {
  const set = new Set<ShortTripMood>();
  for (const label of labels) {
    ALL_SHORT_SEEDS.find((s) => s.label === label)?.shortMoods.forEach((m) => set.add(m));
  }
  return Array.from(set);
}

/** Reverse bridge: internal moods → seed labels (for card-pull / migrating old saved trips into MoodInput). */
export function moodInputFromMoods(
  moods: Mood[] = [],
  shortMoods: ShortTripMood[] = [],
  text = '',
  intensity = 0.5,
): MoodInput {
  const seeds: string[] = [];
  for (const m of moods) {
    const seed = ALL_MOOD_SEEDS.find((s) => s.moods.includes(m));
    if (seed && !seeds.includes(seed.label)) seeds.push(seed.label);
  }
  for (const sm of shortMoods) {
    const seed = ALL_SHORT_SEEDS.find((s) => s.shortMoods.includes(sm));
    if (seed && !seeds.includes(seed.label)) seeds.push(seed.label);
  }
  return { text, seeds, intensity };
}
