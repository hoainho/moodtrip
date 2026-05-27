import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_LS_KEY = 'moodtrip_pwa_install_dismissed_v1';
const DISMISSED_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

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
    } catch {
      void 0;
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-4 right-4 z-40 max-w-xs p-4 rounded-2xl glass-dark border border-teal-500/30 shadow-2xl"
      >
        <p className="text-white text-sm font-medium mb-1">📱 Cài MoodTrip vào màn hình chính</p>
        <p className="text-slate-400 text-xs mb-3">
          Mở nhanh, xem offline khi đang đi đường.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg"
          >
            Cài đặt
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-slate-400 hover:text-white text-xs"
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
