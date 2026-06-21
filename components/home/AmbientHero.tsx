import React, { useRef, useEffect } from 'react';
import { useMoodTheme } from '../../hooks/useMoodTheme';

/**
 * Living-ambient backdrop for the landing hero: a breathing aurora + drifting fireflies that
 * subtly parallax to the cursor. Purely decorative (aria-hidden) and sits BEHIND the hero's text
 * scrim so it never hurts readability. Colors are pulled from the mood theme (--mood-accent), so it
 * shares the app's palette. All motion is GPU-only (transform/opacity) and frozen under
 * prefers-reduced-motion (see index.css). Firefly layout is deterministic (sin-hash, not Math.random)
 * so @visual baselines stay stable.
 */
const FIREFLIES = Array.from({ length: 28 }, (_, i) => {
  const fract = (x: number) => x - Math.floor(x);
  const a = fract(Math.sin(i * 12.9898) * 43758.5453);
  const b = fract(Math.sin(i * 78.233) * 12543.123);
  const c = fract(Math.sin(i * 39.425) * 19349.21);
  return {
    left: a * 100,
    top: b * 100,
    size: 2 + c * 3,
    delay: b * 8,
    baseDur: 9 + a * 10,
  };
});

export const AmbientHero: React.FC = () => {
  const theme = useMoodTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)');
    if (reduce.matches || coarse.matches) return; // no cursor parallax on touch / reduced-motion

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const px = (e.clientX / window.innerWidth - 0.5) * 2;
        const py = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty('--px', px.toFixed(3));
        el.style.setProperty('--py', py.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Faster drift when the mood is more energetic.
  const speed = 0.55 + theme.energy * 0.9;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="ambient-hero"
      style={{ ['--px' as string]: 0, ['--py' as string]: 0 }}
    >
      <div
        className="ambient-blob ambient-blob--a"
        style={{ background: `radial-gradient(circle at center, ${theme.accent}, transparent 70%)` }}
      />
      <div className="ambient-blob ambient-blob--b" />
      <div
        className="ambient-blob ambient-blob--c"
        style={{ background: `radial-gradient(circle at center, ${theme.accentSoft}, transparent 72%)` }}
      />
      <div className="ambient-fireflies">
        {FIREFLIES.map((f, i) => (
          <span
            key={i}
            className="firefly"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              animationDelay: `${f.delay}s`,
              animationDuration: `${(f.baseDur / speed).toFixed(2)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
