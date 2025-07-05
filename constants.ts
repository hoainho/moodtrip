import type { Mood } from './types';

export const MOOD_OPTIONS: { id: Mood; icon: string; label: string }[] = [
  { id: 'relax', icon: '😌', label: 'Thư giãn' },
  { id: 'explore', icon: '🤩', label: 'Khám phá' },
  { id: 'nature', icon: '⛰️', label: 'Thiên nhiên' },
  { id: 'romantic', icon: '💖', label: 'Lãng mạn' },
  { id: 'adventure', icon: '🧗', label: 'Phiêu lưu' },
  { id: 'cultural', icon: '🏛️', label: 'Văn hóa' },
];

export const API_KEY_LS_KEY = 'moodtrip_api_key';
export const ITINERARY_LS_KEY = 'moodtrip_saved_itinerary';