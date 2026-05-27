import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

interface CardPullOnboardingProps {
  onComplete: (result: { moods: Mood[]; shortMoods: ShortTripMood[]; narrative: string }) => void;
  onUseTraditionalForm: () => void;
}

const SHAKE_THRESHOLD = 12;

export function CardPullOnboarding({ onComplete, onUseTraditionalForm }: CardPullOnboardingProps) {
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
    setTimeout(() => {
      const result = shuffleAndPull();
      setPull(result);
      setShaking(false);
      hapticSuccess();
    }, 450);
  }

  function handleAccept() {
    if (!pull) return;
    const moods = pullToMoods(pull);
    onComplete({ ...moods, narrative: buildPullNarrative(pull) });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
    >
      <header className="text-center mb-8 max-w-md">
        <p className="text-teal-400 text-xs uppercase tracking-wider mb-2">Rút quẻ du lịch</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
          Hôm nay bạn muốn đi đâu?
        </h1>
        <p className="text-slate-400 text-sm">
          Lắc điện thoại — hoặc nhấn nút bên dưới — để Mơ rút 3 lá bài cho chuyến đi của bạn.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 w-full max-w-md">
        <CardSlot
          label="Nguyên tố"
          card={pull ? ELEMENT_CARDS.find((c) => c.id === pull.element) : null}
          shaking={shaking}
        />
        <CardSlot
          label="Nhịp"
          card={pull ? TEMPO_CARDS.find((c) => c.id === pull.tempo) : null}
          shaking={shaking}
        />
        <CardSlot
          label="Bạn đi cùng"
          card={pull ? COMPANION_CARDS.find((c) => c.id === pull.companion) : null}
          shaking={shaking}
        />
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={needsMotionPermission ? requestMotionAndPull : doPull}
          disabled={shaking}
          className="w-full px-6 py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/30"
        >
          {shaking ? 'Đang rút…' : pull ? 'Rút lại' : '🎴 Rút bài'}
        </button>

        <AnimatePresence>
          {pull && !shaking && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={handleAccept}
              className="w-full px-6 py-4 bg-white/10 hover:bg-white/15 border border-teal-500/30 text-white font-semibold rounded-2xl"
            >
              Đi với quẻ này →
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={onUseTraditionalForm}
          className="w-full px-6 py-3 text-slate-400 hover:text-white text-sm"
        >
          Tôi muốn chọn thủ công thay vì rút bài
        </button>
      </div>
    </motion.div>
  );
}

interface CardSlotProps {
  label: string;
  card: { emoji: string; label: string; vibe: string } | null | undefined;
  shaking: boolean;
}

function CardSlot({ label, card, shaking }: CardSlotProps) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">{label}</p>
      <motion.div
        animate={shaking ? { rotateY: 360 } : { rotateY: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full aspect-[2/3] rounded-2xl glass-dark border border-teal-500/20 flex flex-col items-center justify-center p-2 text-center"
      >
        {card ? (
          <>
            <div className="text-4xl mb-1" aria-hidden="true">{card.emoji}</div>
            <p className="text-white font-bold text-sm">{card.label}</p>
            <p className="text-slate-400 text-[10px] mt-1">{card.vibe}</p>
          </>
        ) : (
          <div className="text-4xl text-slate-600">?</div>
        )}
      </motion.div>
    </div>
  );
}
