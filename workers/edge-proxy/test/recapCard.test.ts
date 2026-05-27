import { describe, it, expect } from 'vitest';
import { buildRecapCardJsx } from '../src/recapCard';

describe('buildRecapCardJsx', () => {
  it('builds a Satori-compatible tree with destination + overview', () => {
    const card = buildRecapCardJsx({
      destination: 'Đà Lạt',
      overview: 'Chuyến đi của những buổi sáng mây mù',
      days: 3,
      topActivities: ['Cà phê 6am', 'Hồ Tuyền Lâm', 'Chợ đêm', 'Train station'],
    });
    const json = JSON.stringify(card);
    expect(json).toContain('Đà Lạt');
    expect(json).toContain('3 ngày');
    expect(json).toContain('Cà phê 6am');
  });

  it('truncates overview at 140 chars', () => {
    const longOverview = 'a'.repeat(300);
    const card = buildRecapCardJsx({
      destination: 'X',
      overview: longOverview,
      days: 1,
      topActivities: [],
    });
    const json = JSON.stringify(card);
    expect(json).toContain('…');
    expect(json).not.toContain('a'.repeat(200));
  });

  it('caps topActivities at 4', () => {
    const card = buildRecapCardJsx({
      destination: 'X',
      overview: 'y',
      days: 1,
      topActivities: ['1', '2', '3', '4', '5', '6'],
    });
    const json = JSON.stringify(card);
    expect(json).toContain('"4"');
    expect(json).not.toContain('"5"');
    expect(json).not.toContain('"6"');
  });

  it('shows handle when provided, otherwise moodtrip.app', () => {
    const withHandle = buildRecapCardJsx({
      destination: 'X', overview: 'y', days: 1, topActivities: [], userHandle: 'linh',
    });
    expect(JSON.stringify(withHandle)).toContain('@linh');

    const noHandle = buildRecapCardJsx({
      destination: 'X', overview: 'y', days: 1, topActivities: [],
    });
    expect(JSON.stringify(noHandle)).toContain('moodtrip.app');
  });
});
