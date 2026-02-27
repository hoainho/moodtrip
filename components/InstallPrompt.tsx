import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconDownload, IconX } from './icons';
import LogoImage from '@/logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

export const InstallPrompt: React.FC = () => {
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (isIOS()) {
      const timer = setTimeout(() => {
        setIsIOSDevice(true);
        setShow(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    deferredPrompt.current = null;
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-auto sm:max-w-sm z-[60]"
        >
          <div className="glass-dark mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl border border-white/10 p-4 shadow-2xl shadow-black/40">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <IconX className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <img src={LogoImage} alt="MoodTrip" className="w-12 h-12 rounded-xl shadow-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm">Cài đặt MoodTrip</h4>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  {isIOSDevice
                    ? 'Nhấn nút Chia sẻ ⬆ rồi chọn "Thêm vào Màn hình chính"'
                    : 'Trải nghiệm tốt nhất ngay trên điện thoại'
                  }
                </p>
              </div>
            </div>

            {!isIOSDevice && (
              <motion.button
                onClick={handleInstall}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-3 py-2.5 gradient-nature text-white font-semibold text-sm rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <IconDownload className="w-4 h-4" />
                Cài đặt ngay
              </motion.button>
            )}

            {isIOSDevice && (
              <div className="mt-3 flex items-center justify-center gap-2 py-2 bg-white/5 rounded-xl">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-teal-400 text-xs font-medium">Nhấn ⬆ → "Thêm vào Màn hình chính"</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
