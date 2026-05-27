const LAST_DREAM_LS_KEY = 'moodtrip_sunday_dream_last_v1';
const STREAK_LS_KEY = 'moodtrip_sunday_dream_streak_v1';

export interface SundayStreak {
  count: number;
  lastDreamDateIso: string | null;
}

export function readStreak(): SundayStreak {
  try {
    const last = localStorage.getItem(LAST_DREAM_LS_KEY);
    const countRaw = localStorage.getItem(STREAK_LS_KEY);
    return {
      count: countRaw ? Number(countRaw) : 0,
      lastDreamDateIso: last,
    };
  } catch {
    return { count: 0, lastDreamDateIso: null };
  }
}

function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function previousSundayKey(date: Date): string {
  const d = new Date(date);
  const diff = (d.getDay() + 7) % 7;
  d.setDate(d.getDate() - diff);
  return localDateKey(d);
}

export interface SundayWindow {
  isOpen: boolean;
  nextOpenAt: Date;
  windowEnd: Date;
}

export function getSundayWindow(now: Date = new Date()): SundayWindow {
  const candidate = new Date(now);
  candidate.setHours(16, 0, 0, 0);

  const dayOfWeek = candidate.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  candidate.setDate(candidate.getDate() + daysUntilSunday);

  const windowEnd = new Date(candidate);
  windowEnd.setHours(23, 59, 59, 999);

  const isOpen = now.getDay() === 0 && now.getHours() >= 16;

  if (now > windowEnd) {
    const nextSun = new Date(now);
    nextSun.setDate(nextSun.getDate() + ((7 - now.getDay()) % 7 || 7));
    nextSun.setHours(16, 0, 0, 0);
    const nextEnd = new Date(nextSun);
    nextEnd.setHours(23, 59, 59, 999);
    return { isOpen, nextOpenAt: nextSun, windowEnd: nextEnd };
  }
  return { isOpen, nextOpenAt: candidate, windowEnd };
}

export function recordDream(date: Date = new Date()): SundayStreak {
  const todayKey = localDateKey(date);
  const expectedThisSunday = previousSundayKey(date);
  const expectedLastSunday = (() => {
    const d = new Date(date);
    const diff = (d.getDay() + 7) % 7;
    d.setDate(d.getDate() - diff - 7);
    return localDateKey(d);
  })();

  if (todayKey !== expectedThisSunday) {
    const current = readStreak();
    return current;
  }

  const stored = readStreak();
  let nextCount = 1;
  if (stored.lastDreamDateIso === expectedLastSunday) {
    nextCount = stored.count + 1;
  } else if (stored.lastDreamDateIso === expectedThisSunday) {
    nextCount = stored.count;
  }

  try {
    localStorage.setItem(LAST_DREAM_LS_KEY, expectedThisSunday);
    localStorage.setItem(STREAK_LS_KEY, String(nextCount));
  } catch {
    void 0;
  }
  return { count: nextCount, lastDreamDateIso: expectedThisSunday };
}

export function isStreakActive(now: Date = new Date()): boolean {
  const stored = readStreak();
  if (!stored.lastDreamDateIso) return false;
  const expectedLastSunday = previousSundayKey(now);
  return stored.lastDreamDateIso === expectedLastSunday;
}
