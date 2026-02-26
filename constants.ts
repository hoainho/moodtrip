import React from 'react';
import type { Mood } from './types';
import { IconRelax, IconExplore, IconNature, IconHeart, IconFlame, IconLandmark } from './components/icons';

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
