import React from 'react';
import type { Mood, ShortTripMood } from './types';
import { IconRelax, IconExplore, IconNature, IconHeart, IconFlame, IconLandmark, IconCoffee, IconFood, IconMoon, IconTarget } from './components/icons';

export const MOOD_OPTIONS: { id: Mood; icon: React.ReactNode; label: string }[] = [
  { id: 'relax', icon: React.createElement(IconRelax, { className: 'w-8 h-8' }), label: 'Thư giãn' },
  { id: 'explore', icon: React.createElement(IconExplore, { className: 'w-8 h-8' }), label: 'Khám phá' },
  { id: 'nature', icon: React.createElement(IconNature, { className: 'w-8 h-8' }), label: 'Thiên nhiên' },
  { id: 'romantic', icon: React.createElement(IconHeart, { className: 'w-8 h-8' }), label: 'Lãng mạn' },
  { id: 'adventure', icon: React.createElement(IconFlame, { className: 'w-8 h-8' }), label: 'Phiêu lưu' },
  { id: 'cultural', icon: React.createElement(IconLandmark, { className: 'w-8 h-8' }), label: 'Văn hóa' },
];

export const ITINERARY_LS_KEY = 'moodtrip_saved_itinerary';
export const SAVED_ITINERARIES_LS_KEY = 'moodtrip_saved_itineraries_list';

export const SHORT_TRIP_MOOD_OPTIONS: { id: ShortTripMood; icon: React.ReactNode; label: string }[] = [
  { id: 'date', icon: React.createElement(IconHeart, { className: 'w-8 h-8' }), label: 'Hẹn hò' },
  { id: 'cafe', icon: React.createElement(IconCoffee, { className: 'w-8 h-8' }), label: 'Cafe hopping' },
  { id: 'food_tour', icon: React.createElement(IconFood, { className: 'w-8 h-8' }), label: 'Ẩm thực' },
  { id: 'nightlife', icon: React.createElement(IconMoon, { className: 'w-8 h-8' }), label: 'Nightlife' },
  { id: 'fun', icon: React.createElement(IconTarget, { className: 'w-8 h-8' }), label: 'Vui chơi' },
  { id: 'chill', icon: React.createElement(IconRelax, { className: 'w-8 h-8' }), label: 'Chill' },
];
