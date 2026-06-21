import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import LogoImage from '@/logo.png';

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // Ref guard so skip can never fire onComplete twice
  const hasExitedRef = useRef(false);

  // Reduced-motion: skip the animation and complete near-immediately
  useEffect(() => {
    const mq =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    if (mq?.matches) {
      const t = setTimeout(() => {
        if (!hasExitedRef.current) {
          hasExitedRef.current = true;
          onCompleteRef.current();
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, []);

  // Skip handler — shared by button and keyboard listener
  const skip = () => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    setIsExiting(true);
  };

  // Keyboard listener: Escape or Enter skips
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        skip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // When progress hits 100, start exit animation then call onComplete
  // Using a ref-based guard that survives StrictMode double-invocation
  useEffect(() => {
    if (progress < 100) return;
    if (isExiting) return;

    setIsExiting(true);
  }, [progress, isExiting]);

  // Separate effect for the actual completion callback
  // This fires when isExiting becomes true and stays true
  useEffect(() => {
    if (!isExiting) return;

    const timer = setTimeout(() => {
      if (!hasExitedRef.current) {
        hasExitedRef.current = true;
      }
      onCompleteRef.current();
    }, 800);

    return () => clearTimeout(timer);
  }, [isExiting]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #0f172a 0%, #0a0e1a 70%)',
      }}
      animate={isExiting ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[80px]" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 rounded-full bg-teal-500/20 blur-2xl animate-pulse-glow" style={{ margin: '-20px' }} />
        <img src={LogoImage} alt="MoodTrip" className="w-28 h-28 relative z-10 drop-shadow-2xl" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-5xl md:text-6xl font-extrabold mb-3 text-gradient-nature tracking-tight"
      >
        MoodTrip
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="text-slate-400 text-lg mb-12 tracking-wide"
      >
        Để cảm xúc dẫn đường
      </motion.p>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: '16rem' }}
        transition={{ delay: 1, duration: 0.4 }}
        className="relative"
      >
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #0d9488, #06b6d4, #22c55e)',
              width: `${progress}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-slate-400 text-sm mt-3"
        >
          {progress < 30 && 'Đang khởi tạo...'}
          {progress >= 30 && progress < 60 && 'Đang tải hiệu ứng 3D...'}
          {progress >= 60 && progress < 90 && 'Chuẩn bị trải nghiệm...'}
          {progress >= 90 && 'Sẵn sàng!'}
        </motion.p>
      </motion.div>

      {/* Skip button — bottom-center, unobtrusive */}
      <button
        onClick={skip}
        aria-label="Bỏ qua màn hình giới thiệu"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 min-h-[44px] px-4 text-slate-400 text-sm hover:text-slate-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 rounded"
      >
        Bỏ qua
      </button>
    </motion.div>
  );
};
