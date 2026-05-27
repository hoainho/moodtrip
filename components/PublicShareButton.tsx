import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ItineraryPlan, FormData } from '../types';
import { ensurePublicTrip } from '../services/publicShare';
import { useAuth } from '../services/useAuth';

interface PublicShareButtonProps {
  itinerary: ItineraryPlan;
  formInput?: Partial<FormData>;
  onRequestSignIn: () => void;
}

type State = 'idle' | 'sharing' | 'shared' | 'error';

export function PublicShareButton({ itinerary, formInput, onRequestSignIn }: PublicShareButtonProps) {
  const { user } = useAuth();
  const [state, setState] = useState<State>('idle');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleShare() {
    if (!user) {
      onRequestSignIn();
      return;
    }
    setState('sharing');
    setErrorMsg(null);
    try {
      const existingId = typeof itinerary.id === 'string' ? itinerary.id : undefined;
      const result = await ensurePublicTrip(user.id, itinerary, formInput ?? {}, existingId);
      setShareUrl(result.url);
      setState('shared');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể chia sẻ');
      setState('error');
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      void 0;
    }
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        onClick={handleShare}
        disabled={state === 'sharing'}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-teal-500/30 text-teal-300 text-sm font-medium disabled:opacity-60"
      >
        {state === 'sharing' ? 'Đang tạo link…' : '🔗 Chia sẻ công khai'}
      </button>

      <AnimatePresence>
        {state === 'shared' && shareUrl && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-white/5 border border-teal-500/30 p-3 text-xs text-slate-300"
          >
            <p className="mb-2">Lịch trình đã được công khai. Ai có link đều xem được:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-2 py-1.5 bg-slate-900 rounded text-teal-200 text-xs"
              />
              <button onClick={handleCopy} className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs rounded">
                Copy
              </button>
            </div>
          </motion.div>
        )}
        {state === 'error' && errorMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 text-xs">
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
