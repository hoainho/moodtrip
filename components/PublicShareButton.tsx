import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ItineraryPlan, FormData } from '../types';
import { generateShareUrl } from '../services/shareService';
import { IconShare, IconCopy, IconCheck } from './icons';

interface PublicShareButtonProps {
  itinerary: ItineraryPlan;
  formInput?: Partial<FormData>;
}

type State = 'idle' | 'sharing' | 'shared' | 'error';

export function PublicShareButton({ itinerary }: PublicShareButtonProps) {
  const [state, setState] = useState<State>('idle');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setState('sharing');
    setErrorMsg(null);
    try {
      const url = await generateShareUrl(itinerary);
      setShareUrl(url);
      setState('shared');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tạo link chia sẻ');
      setState('error');
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('[share] clipboard unavailable', err);
    }
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={handleShare}
        disabled={state === 'sharing'}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-teal-500/30 text-teal-300 text-sm font-semibold disabled:opacity-60 transition-colors"
      >
        <IconShare className="w-4 h-4" />
        {state === 'sharing' ? 'Đang tạo link…' : 'Chia sẻ chuyến đi'}
      </button>

      <AnimatePresence>
        {state === 'shared' && shareUrl && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-white/5 border border-teal-500/30 p-3 text-xs text-slate-300"
          >
            <p className="mb-2">Link chia sẻ (ai có link cũng xem được, không cần đăng ký):</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 min-w-0 px-2 py-2 bg-slate-900 rounded text-teal-200 text-xs"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded transition-colors"
              >
                {copied ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
                {copied ? 'Đã copy' : 'Copy'}
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
