import type { Mood, ShortTripMood } from '../types';

export type ElementCard = 'núi' | 'biển' | 'sông' | 'phố' | 'rừng' | 'cao_nguyên';
export type TempoCard = 'chill' | 'wild' | 'quiet' | 'romantic' | 'curious' | 'festive';
export type CompanionCard = 'solo' | 'couple' | 'family' | 'friends' | 'work' | 'pet';

export interface CardPullResult {
  element: ElementCard;
  tempo: TempoCard;
  companion: CompanionCard;
}

export interface DeckCard<TId extends string> {
  id: TId;
  label: string;
  icon: string;
  vibe: string;
}

export const ELEMENT_CARDS: DeckCard<ElementCard>[] = [
  { id: 'núi', label: 'Núi', icon: 'mountain', vibe: 'Cao, lạnh, mây mù' },
  { id: 'biển', label: 'Biển', icon: 'wave', vibe: 'Sóng, muối, tự do' },
  { id: 'sông', label: 'Sông', icon: 'boat', vibe: 'Chậm rãi, miền Tây' },
  { id: 'phố', label: 'Phố', icon: 'building', vibe: 'Đèn, người, nhịp' },
  { id: 'rừng', label: 'Rừng', icon: 'tree', vibe: 'Ẩm, xanh, im lặng' },
  { id: 'cao_nguyên', label: 'Cao nguyên', icon: 'wheat', vibe: 'Gió, hoa, mặt trời' },
];

export const TEMPO_CARDS: DeckCard<TempoCard>[] = [
  { id: 'chill', label: 'Chill', icon: 'coffee', vibe: 'Cà phê và nghe gió' },
  { id: 'wild', label: 'Hoang dã', icon: 'flame', vibe: 'Leo, lội, phá' },
  { id: 'quiet', label: 'Yên tĩnh', icon: 'book', vibe: 'Một mình một góc' },
  { id: 'romantic', label: 'Lãng mạn', icon: 'heart', vibe: 'Hoàng hôn, tay nắm tay' },
  { id: 'curious', label: 'Tò mò', icon: 'telescope', vibe: 'Hỏi và khám phá' },
  { id: 'festive', label: 'Náo nhiệt', icon: 'sparkles', vibe: 'Lễ hội, đám đông' },
];

export const COMPANION_CARDS: DeckCard<CompanionCard>[] = [
  { id: 'solo', label: 'Một mình', icon: 'user', vibe: 'Solo journey' },
  { id: 'couple', label: 'Cặp đôi', icon: 'userHeart', vibe: 'Hai người' },
  { id: 'family', label: 'Gia đình', icon: 'users', vibe: 'Có người lớn nhỏ' },
  { id: 'friends', label: 'Bạn bè', icon: 'glassCheers', vibe: 'Nhóm rảnh rỗi' },
  { id: 'work', label: 'Công tác', icon: 'briefcase', vibe: 'Tranh thủ một góc' },
  { id: 'pet', label: 'Thú cưng', icon: 'paw', vibe: 'Pet-friendly' },
];

export function shuffleAndPull(seed?: () => number): CardPullResult {
  const rand = seed ?? Math.random;
  const pick = <T,>(arr: T[]): T => {
    const idx = Math.floor(rand() * arr.length);
    return arr[idx] as T;
  };
  return {
    element: pick(ELEMENT_CARDS).id,
    tempo: pick(TEMPO_CARDS).id,
    companion: pick(COMPANION_CARDS).id,
  };
}

export function pullToMoods(pull: CardPullResult): { moods: Mood[]; shortMoods: ShortTripMood[] } {
  const moods = new Set<Mood>();
  const shortMoods = new Set<ShortTripMood>();

  switch (pull.element) {
    case 'núi':
    case 'rừng':
    case 'cao_nguyên':
      moods.add('nature');
      moods.add('adventure');
      break;
    case 'biển':
      moods.add('relax');
      moods.add('nature');
      break;
    case 'sông':
      moods.add('cultural');
      moods.add('relax');
      break;
    case 'phố':
      moods.add('explore');
      shortMoods.add('cafe');
      shortMoods.add('food_tour');
      break;
  }

  switch (pull.tempo) {
    case 'chill':
      moods.add('relax');
      shortMoods.add('chill');
      break;
    case 'wild':
      moods.add('adventure');
      shortMoods.add('fun');
      break;
    case 'quiet':
      moods.add('relax');
      break;
    case 'romantic':
      moods.add('romantic');
      shortMoods.add('date');
      break;
    case 'curious':
      moods.add('explore');
      moods.add('cultural');
      break;
    case 'festive':
      shortMoods.add('nightlife');
      shortMoods.add('fun');
      break;
  }

  return {
    moods: Array.from(moods).slice(0, 3),
    shortMoods: Array.from(shortMoods).slice(0, 3),
  };
}

export function buildPullNarrative(pull: CardPullResult): string {
  const el = ELEMENT_CARDS.find((c) => c.id === pull.element);
  const tp = TEMPO_CARDS.find((c) => c.id === pull.tempo);
  const co = COMPANION_CARDS.find((c) => c.id === pull.companion);
  return `${el?.label ?? pull.element} · ${tp?.label ?? pull.tempo} · ${co?.label ?? pull.companion}`;
}
