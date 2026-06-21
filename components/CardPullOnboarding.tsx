import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  COMPANION_CARDS,
  ELEMENT_CARDS,
  TEMPO_CARDS,
  buildPullNarrative,
  pullToMoods,
  shuffleAndPull,
  type CardPullResult,
} from '../services/cardPullDeck';
import { hapticSelection, hapticSuccess } from '../services/haptics';
import type { Mood, ShortTripMood } from '../types';
import {
  IconSparkles,
  IconMountain,
  IconWave,
  IconBoat,
  IconBuilding,
  IconTree,
  IconWheat,
  IconCoffee,
  IconFlame,
  IconBook,
  IconHeart,
  IconTelescope,
  IconUser,
  IconUserHeart,
  IconUsers,
  IconGlassCheers,
  IconBriefcase,
  IconPaw,
} from './icons';

interface CardPullOnboardingProps {
  onComplete: (result: { moods: Mood[]; shortMoods: ShortTripMood[]; narrative: string }) => void;
  onUseTraditionalForm: () => void;
}

type IconComp = React.FC<{ className?: string }>;

/** Maps the stable icon-key on each deck card to its drawn SVG component. */
export const CARD_ICONS: Record<string, IconComp> = {
  mountain: IconMountain,
  wave: IconWave,
  boat: IconBoat,
  building: IconBuilding,
  tree: IconTree,
  wheat: IconWheat,
  coffee: IconCoffee,
  flame: IconFlame,
  book: IconBook,
  heart: IconHeart,
  telescope: IconTelescope,
  sparkles: IconSparkles,
  user: IconUser,
  userHeart: IconUserHeart,
  users: IconUsers,
  glassCheers: IconGlassCheers,
  briefcase: IconBriefcase,
  paw: IconPaw,
};

const SHAKE_THRESHOLD = 12;
const SLOT_DELAYS = [0, 0.12, 0.24]; // staggered flip reveal, ~120ms apart

interface DeckCardLike {
  icon: string;
  label: string;
  vibe: string;
}

export function CardPullOnboarding({ onComplete, onUseTraditionalForm }: CardPullOnboardingProps) {
  const reduceMotion = useReducedMotion();
  const [pull, setPull] = useState<CardPullResult | null>(null);
  const [shaking, setShaking] = useState(false);
  const [needsMotionPermission, setNeedsMotionPermission] = useState(false);

  useEffect(() => {
    type IOSMotionEvent = typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    const iosMotion = DeviceMotionEvent as IOSMotionEvent | undefined;
    if (iosMotion && typeof iosMotion.requestPermission === 'function') {
      setNeedsMotionPermission(true);
    } else {
      attachShake();
    }
    return () => detachShake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMotion(event: DeviceMotionEvent) {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    if (magnitude > 9.8 + SHAKE_THRESHOLD) {
      doPull();
    }
  }

  function attachShake() {
    window.addEventListener('devicemotion', handleMotion);
  }

  function detachShake() {
    window.removeEventListener('devicemotion', handleMotion);
  }

  async function requestMotionAndPull() {
    type IOSMotionEvent = typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    const iosMotion = DeviceMotionEvent as IOSMotionEvent | undefined;
    if (iosMotion?.requestPermission) {
      try {
        const result = await iosMotion.requestPermission();
        if (result === 'granted') {
          setNeedsMotionPermission(false);
          attachShake();
        }
      } catch {
        void 0;
      }
    }
    doPull();
  }

  function doPull() {
    if (shaking) return;
    setShaking(true);
    hapticSelection();
    const settle = () => {
      const result = shuffleAndPull();
      setPull(result);
      setShaking(false);
      hapticSuccess();
    };
    if (reduceMotion) {
      settle();
    } else {
      setTimeout(settle, 450);
    }
  }

  function handleAccept() {
    if (!pull) return;
    const moods = pullToMoods(pull);
    onComplete({ ...moods, narrative: buildPullNarrative(pull) });
  }

  const slots: { label: string; hint: string; card: DeckCardLike | null | undefined }[] = [
    { label: 'Nguyên tố', hint: 'Cảnh bạn hợp', card: pull ? ELEMENT_CARDS.find((c) => c.id === pull.element) : null },
    { label: 'Nhịp', hint: 'Tốc độ chuyến đi', card: pull ? TEMPO_CARDS.find((c) => c.id === pull.tempo) : null },
    { label: 'Bạn đi cùng', hint: 'Ai cùng bạn', card: pull ? COMPANION_CARDS.find((c) => c.id === pull.companion) : null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 overflow-hidden"
    >
      <AmbientBackground reduceMotion={!!reduceMotion} />

      <header className="text-scrim relative z-10 text-center mb-8 max-w-md">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-teal-400 text-xs uppercase tracking-[0.3em] mb-3"
        >
          Rút quẻ du lịch
        </motion.p>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl md:text-4xl font-extrabold text-white mb-3 [text-shadow:0_2px_20px_rgba(13,148,136,0.35)]"
        >
          Hôm nay bạn muốn đi đâu?
        </motion.h1>
        <p className="text-slate-400 text-sm">
          Lắc điện thoại — hoặc nhấn nút bên dưới — để Mơ rút 3 lá bài cho chuyến đi của bạn.
        </p>
      </header>

      <div
        className="relative z-10 grid grid-cols-3 gap-3 sm:gap-4 mb-8 w-full max-w-md"
        style={{ perspective: 1200 }}
      >
        {slots.map((slot, i) => (
          <OracleCard
            key={slot.label}
            label={slot.label}
            hint={slot.hint}
            card={slot.card}
            revealed={!!pull && !shaking}
            shaking={shaking}
            delay={SLOT_DELAYS[i] ?? 0}
            reduceMotion={!!reduceMotion}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-3 w-full max-w-md">
        <motion.button
          type="button"
          onClick={needsMotionPermission ? requestMotionAndPull : doPull}
          disabled={shaking}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="group relative w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-4 text-white font-bold rounded-2xl overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed transition-shadow shadow-lg shadow-teal-500/30"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500" />
          {!reduceMotion && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg]"
              initial={{ x: '-150%' }}
              animate={{ x: '350%' }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
            />
          )}
          <span className="relative inline-flex items-center gap-2">
            {!shaking && !pull && <IconSparkles className="w-5 h-5" />}
            {shaking ? 'Đang rút…' : pull ? 'Rút lại' : 'Rút bài'}
          </span>
        </motion.button>

        <AnimatePresence>
          {pull && !shaking && (
            <motion.button
              type="button"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              onClick={handleAccept}
              className="w-full min-h-[44px] px-6 py-4 bg-white/10 hover:bg-white/15 border border-teal-500/40 hover:border-cyan-400/60 text-white font-semibold rounded-2xl backdrop-blur-sm transition-colors"
            >
              Đi với quẻ này →
            </motion.button>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onUseTraditionalForm}
          className="w-full min-h-[44px] px-6 py-3 text-slate-400 hover:text-white text-sm transition-colors"
        >
          Tôi muốn chọn thủ công thay vì rút bài
        </button>
      </div>
    </motion.div>
  );
}

interface OracleCardProps {
  label: string;
  hint: string;
  card: DeckCardLike | null | undefined;
  revealed: boolean;
  shaking: boolean;
  delay: number;
  reduceMotion: boolean;
}

function OracleCard({ label, hint, card, revealed, shaking, delay, reduceMotion }: OracleCardProps) {
  const Icon = card ? CARD_ICONS[card.icon] : undefined;
  const showFront = revealed && !!card;

  // Reduced motion: no 3D flip, no idle sway, instant swap of face content.
  if (reduceMotion) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-slate-300 text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-slate-400 text-[10px] mb-2">{hint}</p>
        <div className="w-full aspect-[2/3] rounded-2xl border border-teal-500/25 glass-dark flex flex-col items-center justify-center p-2 text-center">
          {showFront && Icon ? (
            <>
              <Icon className="w-10 h-10 text-cyan-300 mb-2" aria-hidden="true" />
              <p className="text-white font-bold text-sm">{card!.label}</p>
              <p className="text-slate-400 text-[10px] mt-1">{card!.vibe}</p>
            </>
          ) : (
            <CardBackStatic />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-slate-300 text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-slate-400 text-[10px] mb-2">{hint}</p>
      <motion.div
        className="relative w-full aspect-[2/3]"
        animate={
          shaking
            ? { y: [0, -6, 4, -3, 0], rotate: [0, -2, 2, -1, 0] }
            : showFront
              ? { y: [0, -3, 0] }
              : { y: 0, rotate: 0 }
        }
        transition={
          shaking
            ? { duration: 0.45, repeat: Infinity }
            : showFront
              ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay }
              : { duration: 0.3 }
        }
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="relative w-full h-full"
          initial={false}
          animate={{ rotateY: showFront ? 180 : 0 }}
          transition={{ duration: 0.7, delay: showFront ? delay : 0, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* BACK — branded aurora + constellation */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <GradientBorder glow={false}>
              <CardBack />
            </GradientBorder>
          </div>

          {/* FRONT — the drawn icon, label, vibe */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <GradientBorder glow={showFront}>
              <div className="relative w-full h-full rounded-2xl glass-dark flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                <Sheen active={showFront} />
                {Icon && (
                  <motion.div
                    initial={false}
                    animate={showFront ? { scale: [0.6, 1.12, 1], opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5, delay: delay + 0.35 }}
                    className="relative mb-2"
                  >
                    <span className="absolute inset-0 blur-lg bg-cyan-400/40 rounded-full" aria-hidden="true" />
                    <Icon className="relative w-10 h-10 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]" aria-hidden="true" />
                  </motion.div>
                )}
                {card && (
                  <>
                    <p className="text-white font-bold text-sm">{card.label}</p>
                    <p className="text-slate-400 text-[10px] mt-1">{card.vibe}</p>
                  </>
                )}
              </div>
            </GradientBorder>
          </div>
        </motion.div>

        {/* Particle burst on reveal */}
        <AnimatePresence>{showFront && <ParticleBurst delay={delay + 0.3} />}</AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Animated teal→cyan→sky gradient frame with optional outer glow. */
function GradientBorder({ children, glow }: { children: React.ReactNode; glow: boolean }) {
  return (
    <div
      className="relative w-full h-full rounded-2xl p-[1.5px]"
      style={{
        background:
          'linear-gradient(135deg, rgba(13,148,136,0.9), rgba(6,182,212,0.7), rgba(14,165,233,0.9))',
        boxShadow: glow
          ? '0 0 28px rgba(6,182,212,0.55), 0 0 10px rgba(13,148,136,0.4)'
          : '0 0 12px rgba(13,148,136,0.18)',
        transition: 'box-shadow 0.5s ease',
      }}
    >
      <div className="w-full h-full rounded-[14px] overflow-hidden">{children}</div>
    </div>
  );
}

/** Holographic sheen sweeping diagonally across a revealed face. */
function Sheen({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute -inset-y-2 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
      initial={{ x: '-160%' }}
      animate={{ x: '260%' }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.8 }}
    />
  );
}

/** Card back: aurora gradient + drawn constellation/sparkle motif. */
function CardBack() {
  return (
    <div className="relative w-full h-full rounded-2xl bg-[#0a0e1a] overflow-hidden flex items-center justify-center">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(120% 90% at 30% 15%, rgba(13,148,136,0.35), transparent 55%), radial-gradient(110% 80% at 75% 85%, rgba(14,165,233,0.32), transparent 55%)',
        }}
      />
      <svg
        viewBox="0 0 60 90"
        className="relative w-3/4 h-3/4 text-cyan-300/70"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M15 20 L30 14 L45 24 L38 42 L22 46 Z" opacity="0.5" />
        <path d="M30 14 L34 30 L22 46 M45 24 L34 30 L38 42" opacity="0.45" />
        {[
          [15, 20],
          [30, 14],
          [45, 24],
          [38, 42],
          [22, 46],
          [34, 30],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.4" fill="currentColor" stroke="none" />
        ))}
        <path d="M30 56 l1.6 4.8 4.8 1.6-4.8 1.6L30 70l-1.6-5.8L23.6 62l4.8-1.6z" opacity="0.85" />
        <circle cx="14" cy="64" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="47" cy="58" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="44" cy="74" r="0.7" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

/** Static back used only in reduced-motion mode (no infinite anims). */
function CardBackStatic() {
  return (
    <div className="flex flex-col items-center justify-center">
      <IconSparkles className="w-8 h-8 text-teal-400/70" aria-hidden="true" />
      <span className="mt-2 text-slate-400 text-lg" aria-hidden="true">
        ?
      </span>
    </div>
  );
}

/** Small radial particle burst emitted when a card reveals. Angles, radii, sizes and colours are
 *  jittered per particle so the burst reads as an organic spray rather than a symmetric ring. */
const BURST_COLORS = [
  { bg: 'rgb(103,232,249)', glow: 'rgba(6,182,212,0.9)' }, // cyan
  { bg: 'rgb(94,234,212)', glow: 'rgba(13,148,136,0.9)' }, // teal
  { bg: 'rgb(252,211,77)', glow: 'rgba(245,158,11,0.85)' }, // warm amber accent
];
function ParticleBurst({ delay }: { delay: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        // Deterministic pseudo-random jitter (no Math.random → stable across renders).
        const seed = (i * 1297 + 7) % 360;
        const jitter = ((i * 53) % 17) / 17 - 0.5; // -0.5..0.5
        const angle = ((i / 11) * Math.PI * 2) + jitter * 0.9;
        const radius = 28 + ((i * 37) % 26) + (i % 3) * 6;
        const color = BURST_COLORS[i % BURST_COLORS.length];
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          s: 0.45 + ((seed % 7) / 7) * 0.6,
          dur: 0.7 + ((i * 31) % 9) / 20,
          color,
        };
      }),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], x: p.x, y: p.y, scale: [0, p.s, 0] }}
          transition={{ duration: p.dur, delay, ease: 'easeOut' }}
          style={{ backgroundColor: p.color.bg, boxShadow: `0 0 6px ${p.color.glow}` }}
        />
      ))}
    </div>
  );
}

/** Drifting aurora blobs + floating particles behind the cards. */
function AmbientBackground({ reduceMotion }: { reduceMotion: boolean }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${(i * 67) % 100}%`,
        top: `${(i * 41 + 8) % 100}%`,
        d: 6 + (i % 5) * 1.6,
        delay: (i % 7) * 0.7,
      })),
    []
  );

  if (reduceMotion) {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(60% 50% at 25% 20%, rgba(13,148,136,0.25), transparent 60%), radial-gradient(55% 45% at 80% 80%, rgba(14,165,233,0.22), transparent 60%), radial-gradient(45% 40% at 70% 30%, rgba(245,158,11,0.16), transparent 60%)',
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -top-24 -left-16 w-80 h-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.4), transparent 70%)' }}
        animate={{ x: [0, 40, -10, 0], y: [0, 30, 10, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-20 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.35), transparent 70%)' }}
        animate={{ x: [0, -30, 10, 0], y: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), transparent 70%)' }}
        animate={{ x: [0, 25, -25, 0], y: [0, -25, 0, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Warm amber ambient blob — balances the cool teal/cyan palette with one warm anchor. */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.22), transparent 70%)' }}
        animate={{ x: [0, 30, -15, 0], y: [0, 18, -12, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      {dots.map((dot, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-cyan-200/40"
          style={{ left: dot.left, top: dot.top, width: dot.d, height: dot.d }}
          animate={{ y: [0, -24, 0], opacity: [0.15, 0.6, 0.15] }}
          transition={{ duration: 6 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: dot.delay }}
        />
      ))}
    </div>
  );
}
