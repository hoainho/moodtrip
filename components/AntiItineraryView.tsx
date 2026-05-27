import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FormData } from '../types';
import { generateAntiItinerary, type AntiItinerary } from '../services/antiItinerary';

interface AntiItineraryViewProps {
  open: boolean;
  form: FormData | null;
  onClose: () => void;
  onWantNormalPlan: () => void;
}

type State = 'loading' | 'ready' | 'error';

export function AntiItineraryView({ open, form, onClose, onWantNormalPlan }: AntiItineraryViewProps) {
  const [state, setState] = useState<State>('loading');
  const [anti, setAnti] = useState<AntiItinerary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !form) return;
    setState('loading');
    setErrorMsg(null);
    setAnti(null);
    generateAntiItinerary(form)
      .then((value) => {
        setAnti(value);
        setState('ready');
      })
      .catch((err: Error) => {
        if (err.message === 'RATE_LIMIT_EXCEEDED') {
          setErrorMsg('Hôm nay Mơ đã thì thầm đủ. Quay lại ngày mai nhé.');
        } else if (err.message === 'BUDGET_EXCEEDED') {
          setErrorMsg('Mơ đang nghỉ. Mai mình mơ tiếp nhé.');
        } else {
          setErrorMsg('Mơ không thì thầm được. Thử lại sau.');
        }
        setState('error');
      });
  }, [open, form]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6"
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-white/10 rounded-full"
        >
          Đóng
        </button>

        <div className="max-w-xl w-full text-center space-y-8">
          <p className="text-purple-300 text-xs uppercase tracking-[0.3em]">Anti-Itinerary</p>

          {state === 'loading' && (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-slate-400 text-base"
            >
              Mơ đang thì thầm…
            </motion.p>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <p className="text-rose-300">{errorMsg}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm"
              >
                Quay về
              </button>
            </div>
          )}

          {state === 'ready' && anti && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="space-y-10"
            >
              <p className="text-3xl md:text-4xl text-white font-extralight leading-snug italic">
                "{anti.vibe}"
              </p>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Hướng đi</p>
                <p className="text-xl md:text-2xl text-white font-light leading-relaxed">
                  {anti.direction}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Lời thì thầm</p>
                <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed">
                  — {anti.whisper}
                </p>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm rounded-xl"
                >
                  Tôi sẽ đi
                </button>
                <button
                  onClick={onWantNormalPlan}
                  className="px-5 py-2.5 text-slate-400 hover:text-white text-sm"
                >
                  Cho tôi một lịch trình bình thường thay thế
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
