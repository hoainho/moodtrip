import { beforeEach, describe, expect, it } from 'vitest';
import { getSundayWindow, readStreak, recordDream } from '../sundayDream';

beforeEach(() => {
  localStorage.clear();
});

describe('getSundayWindow', () => {
  it('reports closed on a Monday', () => {
    const monday = new Date('2026-05-25T10:00:00');
    const w = getSundayWindow(monday);
    expect(w.isOpen).toBe(false);
  });

  it('reports open on Sunday after 16:00 local', () => {
    const sundayLate = new Date('2026-05-31T17:30:00');
    const w = getSundayWindow(sundayLate);
    expect(w.isOpen).toBe(true);
  });

  it('reports closed on Sunday morning', () => {
    const sundayEarly = new Date('2026-05-31T08:00:00');
    const w = getSundayWindow(sundayEarly);
    expect(w.isOpen).toBe(false);
  });
});

describe('recordDream + readStreak', () => {
  it('increments streak when dreams happen on consecutive Sundays', () => {
    const firstSunday = new Date('2026-05-24T17:00:00');
    const secondSunday = new Date('2026-05-31T17:00:00');
    recordDream(firstSunday);
    expect(readStreak().count).toBe(1);
    recordDream(secondSunday);
    expect(readStreak().count).toBe(2);
  });

  it('does not increment when the same Sunday is recorded twice', () => {
    const sunday = new Date('2026-05-31T17:00:00');
    recordDream(sunday);
    recordDream(sunday);
    expect(readStreak().count).toBe(1);
  });

  it('resets streak when a Sunday is skipped', () => {
    const oldSunday = new Date('2026-05-17T17:00:00');
    const newSunday = new Date('2026-05-31T17:00:00');
    recordDream(oldSunday);
    recordDream(newSunday);
    expect(readStreak().count).toBe(1);
  });

  it('ignores dreams outside Sunday window', () => {
    const monday = new Date('2026-05-25T17:00:00');
    recordDream(monday);
    expect(readStreak().count).toBe(0);
  });
});
