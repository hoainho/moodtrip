import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { MoodInput } from '../types';

/**
 * The "emotion → atmosphere" engine. A MoodInput is reduced to a small theme of scalars
 * (warmth/energy) + derived colors that drive the whole app's accent, the living-ambient home,
 * and the 3D scene's light/particles. deriveMoodTheme is a PURE function (no Date/random) so it is
 * trivially unit-testable and safe under SSR/strict-mode.
 */
export interface MoodTheme {
  /** 0..1 cool→warm — picks accent hue + 3D light temperature. */
  warmth: number;
  /** 0..1 calm→energetic — particle speed, motion amplitude, bloom. */
  energy: number;
  /** Accent color (hsl string) consumed via --mood-accent. */
  accent: string;
  /** Low-alpha accent for soft fills/glows (--mood-accent-soft). */
  accentSoft: string;
  /** 3D scene key-light color. */
  lightColor: string;
  /** Firefly / particle speed multiplier (~0.4..2). */
  particleSpeed: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Vietnamese keyword cues. Kept small + high-signal; matched as substrings (accent-insensitive enough
// for vi). Includes the NEGATIVE emotional spectrum so the ambient/accent reacts when a user expresses
// it: low/sad/drained feelings read as cool & muted; agitation (bực/tức) as energetic.
const WARM_WORDS = ['chữa lành', 'chậm', 'nghỉ', 'thư giãn', 'thư thái', 'bình yên', 'tĩnh', 'lãng mạn', 'ngọt', 'an yên', 'dưỡng', 'chill', 'nhẹ nhàng', 'ấm', 'hẹn hò'];
const ENERGY_WORDS = ['phiêu lưu', 'khám phá', 'sôi động', 'mạo hiểm', 'năng động', 'trekking', 'leo', 'nhộn nhịp', 'vui chơi', 'nightlife', 'bùng nổ', 'thử thách', 'hoạt động', 'food tour', 'bực', 'tức', 'cáu', 'phơi phới'];
const COOL_WORDS = ['biển', 'nước', 'sông', 'mưa', 'lạnh', 'mát', 'xanh', 'rừng', 'thiên nhiên', 'núi', 'buồn', 'cô đơn', 'trống rỗng', 'chán', 'căng thẳng', 'mệt', 'áp lực', 'lạc lõng'];

export const BALANCED_THEME: MoodTheme = {
  warmth: 0.5,
  energy: 0.5,
  accent: 'hsl(38, 92%, 55%)',
  accentSoft: 'hsla(38, 92%, 55%, 0.16)',
  lightColor: '#ffd9a0',
  particleSpeed: 1,
};

const countHits = (text: string, words: string[]) => words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);

export function deriveMoodTheme(mood?: MoodInput | null): MoodTheme {
  if (!mood) return BALANCED_THEME;
  const text = `${mood.text || ''} ${(mood.seeds || []).join(' ')}`.toLowerCase();
  if (!text.trim()) return BALANCED_THEME;

  const warm = countHits(text, WARM_WORDS);
  const cool = countHits(text, COOL_WORDS);
  const energetic = countHits(text, ENERGY_WORDS);
  const intensity = typeof mood.intensity === 'number' ? clamp01(mood.intensity) : 0.5;

  // Both axes sit at neutral 0.5 when there's no signal, then intensity amplifies the deviation
  // symmetrically (0.5..1.5x) — energy and warmth must share the same base so the slider behaves
  // consistently on each (warm/healing words gently lower energy; energetic words raise it).
  let warmth = 0.5 + (warm - cool) * 0.16;
  let energy = 0.5 + energetic * 0.18 - warm * 0.05;
  const amp = 0.5 + intensity;
  warmth = clamp01(0.5 + (clamp01(warmth) - 0.5) * amp);
  energy = clamp01(0.5 + (clamp01(energy) - 0.5) * amp);

  // Hue: warm→amber (~32°), cool→sky (~200°). Saturation/lightness tuned to read on the dark UI.
  const hue = Math.round(lerp(200, 32, warmth));
  const sat = Math.round(lerp(78, 92, warmth));
  const light = 56;
  const accent = `hsl(${hue}, ${sat}%, ${light}%)`;
  const accentSoft = `hsla(${hue}, ${sat}%, ${light}%, ${(0.12 + energy * 0.1).toFixed(3)})`;
  // 3D key light leans warm amber or cool moonlight.
  const lightColor = warmth >= 0.5 ? '#ffd9a0' : '#bcd4ff';
  const particleSpeed = +(0.5 + energy * 1.5).toFixed(3);

  return { warmth, energy, accent, accentSoft, lightColor, particleSpeed };
}

// Intensifier words push the *strength* of the emotion up (e.g. "rất mệt", "cháy hết mình").
const INTENSIFIERS = ['rất', 'cực', 'siêu', 'thật', 'lắm', 'vô cùng', 'cháy', 'hết mình', 'điên', 'mãnh liệt', 'quá', 'thèm', 'khao khát'];

/**
 * Estimate how *strongly* the user feels (0..1) from their words — used to auto-drive the intensity
 * slider as they type. More emotion words + intensifiers → stronger. Pure + testable. Empty → 0.5.
 */
export function estimateMoodIntensity(text: string, seeds: string[] = []): number {
  const t = `${text || ''} ${seeds.join(' ')}`.toLowerCase();
  if (!t.trim()) return 0.5;
  const emotionHits = countHits(t, WARM_WORDS) + countHits(t, COOL_WORDS) + countHits(t, ENERGY_WORDS);
  const intens = countHits(t, INTENSIFIERS);
  return clamp01(0.4 + emotionHits * 0.12 + intens * 0.15);
}

interface MoodThemeContextValue {
  theme: MoodTheme;
  /** TripForm pushes the live MoodInput here as the user types (debounced internally). */
  setMoodSignal: (mood: MoodInput | null) => void;
}

const MoodThemeContext = createContext<MoodThemeContextValue>({
  theme: BALANCED_THEME,
  setMoodSignal: () => {},
});

/** Write the theme to :root as CSS custom properties so plain CSS/Tailwind can transition smoothly. */
function applyThemeVars(theme: MoodTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--mood-accent', theme.accent);
  root.style.setProperty('--mood-accent-soft', theme.accentSoft);
  root.style.setProperty('--mood-warmth', String(theme.warmth));
  root.style.setProperty('--mood-energy', String(theme.energy));
}

export const MoodThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<MoodTheme>(BALANCED_THEME);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const setMoodSignal = useCallback((mood: MoodInput | null) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = deriveMoodTheme(mood);
      // Batch the DOM write into a frame to avoid layout thrash while typing.
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => applyThemeVars(next));
      setTheme(next);
    }, 250);
  }, []);

  useEffect(() => {
    applyThemeVars(BALANCED_THEME);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const value = useMemo(() => ({ theme, setMoodSignal }), [theme, setMoodSignal]);
  return <MoodThemeContext.Provider value={value}>{children}</MoodThemeContext.Provider>;
};

/** Read the current mood theme (3D scene, ambient layers). */
export function useMoodTheme(): MoodTheme {
  return useContext(MoodThemeContext).theme;
}

/** Push a live MoodInput signal (TripForm). */
export function useSetMoodSignal(): (mood: MoodInput | null) => void {
  return useContext(MoodThemeContext).setMoodSignal;
}
