import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { IconSmartphone } from './icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_LS_KEY = 'moodtrip_pwa_install_dismissed_v1';
const DISMISSED_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const installBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const dismissedAt = readDismissedAt();
    if (dismissedAt && Date.now() - dismissedAt < DISMISSED_TTL_MS) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    if (visible) {
      const t = window.setTimeout(() => installBtnRef.current?.focus(), 400);
      return () => window.clearTimeout(t);
    }
  }, [visible]);

  useEscapeKey(visible, () => handleDismiss());

  if (!visible || !deferred) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  }

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISSED_LS_KEY, String(Date.now()));
    } catch (err) {
      console.warn('[pwa] localStorage unavailable', err);
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        role="dialog"
        aria-label="Cài đặt ứng dụng MoodTrip"
        aria-modal="false"
        className="fixed left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-[42] p-4 rounded-2xl glass-dark border border-teal-500/30 shadow-2xl"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <p className="text-white text-sm font-semibold mb-1 inline-flex items-center gap-2">
          <IconSmartphone className="w-4 h-4 text-teal-300" />
          Cài MoodTrip vào màn hình chính
        </p>
        <p className="text-slate-300 text-sm mb-3 leading-relaxed">
          Mở nhanh, xem offline khi đang đi đường.
        </p>
        <div className="flex gap-2">
          <button
            ref={installBtnRef}
            type="button"
            onClick={handleInstall}
            className="flex-1 min-h-[44px] px-3 py-3 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Cài đặt
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[44px] px-3 py-3 text-slate-300 hover:text-white hover:bg-white/5 text-sm rounded-lg transition-colors"
          >
            Để sau
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function readDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(DISMISSED_LS_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}
