import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSundayWindow, readStreak, recordDream } from '../services/sundayDream';

interface SundayDreamBannerProps {
  onAcceptDream: () => void;
}

const DISMISSED_LS_KEY = 'moodtrip_sunday_dream_dismissed_v1';

export function SundayDreamBanner({ onAcceptDream }: SundayDreamBannerProps) {
  const [visible, setVisible] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const window = getSundayWindow();
    if (!window.isOpen) return;
    try {
      const dismissedAt = localStorage.getItem(DISMISSED_LS_KEY);
      if (dismissedAt) {
        const last = Number(dismissedAt);
        const now = Date.now();
        if (now - last < 6 * 3600 * 1000) return;
      }
    } catch {
      void 0;
    }
    setStreak(readStreak().count);
    setVisible(true);
  }, []);

  if (!visible) return null;

  function handleAccept() {
    const updated = recordDream();
    setStreak(updated.count);
    setVisible(false);
    onAcceptDream();
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="fixed bottom-24 right-4 z-30 max-w-xs p-4 rounded-2xl glass-dark border border-purple-500/30 shadow-2xl"
        role="dialog"
        aria-label="Chiều chủ nhật dream"
      >
        <p className="text-white font-medium mb-1">☕ Chiều chủ nhật</p>
        <p className="text-slate-400 text-xs mb-3 leading-relaxed">
          Pha một ly cà phê. Mình mơ một chuyến đi nhé?
          {streak > 0 && (
            <span className="block mt-1 text-purple-300">
              🔥 Chuỗi {streak} chủ nhật liên tiếp
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg"
          >
            Mơ ngay
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
