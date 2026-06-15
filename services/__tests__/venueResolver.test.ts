import { describe, expect, it } from 'vitest';
import { buildTiktokQuery, computeBounds, resolveVenues, dayLocality } from '../venueResolver';
import type { ItineraryPlan } from '../../types';

const sampleItinerary: ItineraryPlan = {
  destination: 'Đà Lạt',
  overview: 'x',
  timeline: [
    {
      day: 'Ngày 1',
      title: 'Khám phá',
      schedule: [
        {
          time: '08:00',
          activity: 'Cà phê',
          venue: 'Tiệm cà phê 6am',
          google_maps_link: 'https://maps.google.com/?q=11.9404,108.4583',
        },
        {
          time: '14:00',
          activity: 'Hồ Tuyền Lâm',
          venue: 'Hồ Tuyền Lâm',
          google_maps_link: 'https://maps.google.com/maps/place/Lake/@11.8761,108.4147,15z',
        },
        {
          time: '19:00',
          activity: 'Chợ đêm',
        },
      ],
    },
  ],
  food: [],
  accommodation: [],
  tips: [],
};

describe('resolveVenues', () => {
  it('extracts coords from ?q= style URLs', () => {
    const venues = resolveVenues(sampleItinerary);
    expect(venues[0]?.lat).toBeCloseTo(11.9404, 4);
    expect(venues[0]?.lng).toBeCloseTo(108.4583, 4);
  });

  it('extracts coords from @lat,lng style URLs', () => {
    const venues = resolveVenues(sampleItinerary);
    expect(venues[1]?.lat).toBeCloseTo(11.8761, 4);
    expect(venues[1]?.lng).toBeCloseTo(108.4147, 4);
  });

  it('leaves lat/lng undefined when no maps link', () => {
    const venues = resolveVenues(sampleItinerary);
    expect(venues[2]?.lat).toBeUndefined();
    expect(venues[2]?.lng).toBeUndefined();
  });

  it('attaches tiktok search URL to every venue', () => {
    const venues = resolveVenues(sampleItinerary);
    for (const v of venues) {
      expect(v.tiktokQuery).toContain('tiktok.com/search');
      expect(v.tiktokQuery).toContain(encodeURIComponent('Đà Lạt'));
    }
  });

  it('tags venues with day number', () => {
    const venues = resolveVenues(sampleItinerary);
    expect(venues.every((v) => v.day === 1)).toBe(true);
  });
});

describe('computeBounds', () => {
  it('returns null when no located venues', () => {
    expect(computeBounds([])).toBeNull();
  });

  it('computes center as midpoint of N/S and E/W extremes', () => {
    const bounds = computeBounds([
      { name: 'a', day: 1, time: '08', lat: 10, lng: 100 },
      { name: 'b', day: 1, time: '09', lat: 12, lng: 102 },
    ]);
    expect(bounds?.center.lat).toBe(11);
    expect(bounds?.center.lng).toBe(101);
  });
});

describe('dayLocality', () => {
  it('extracts the locality before a tagline separator', () => {
    expect(dayLocality('Hà Tiên - Chốn non nước hữu tình')).toBe('Hà Tiên');
    expect(dayLocality('Quần đảo Nam Du – Biển xanh gọi mời')).toBe('Quần đảo Nam Du');
    expect(dayLocality('Rạch Giá: về lại đất liền')).toBe('Rạch Giá');
  });
  it('strips a leading "Ngày N" prefix', () => {
    expect(dayLocality('Ngày 1: Đà Lạt mộng mơ')).toBe('Đà Lạt mộng mơ');
    expect(dayLocality('Ngày 2 - Hội An')).toBe('Hội An');
  });
  it('returns the whole title when there is no separator', () => {
    expect(dayLocality('Hà Nội')).toBe('Hà Nội');
  });
  it('returns null for empty/missing titles', () => {
    expect(dayLocality(undefined)).toBeNull();
    expect(dayLocality('')).toBeNull();
    expect(dayLocality('  ')).toBeNull();
  });
});

describe('buildTiktokQuery', () => {
  it('builds URL-encoded search', () => {
    const q = buildTiktokQuery('Cà phê 6am', 'Đà Lạt');
    expect(q).toContain('tiktok.com/search?q=');
    expect(q).toContain(encodeURIComponent('Cà phê 6am'));
  });

  it('strips quotes from venue name', () => {
    const q = buildTiktokQuery('"Cafe"', 'X');
    expect(q).not.toContain(encodeURIComponent('"'));
  });
});
