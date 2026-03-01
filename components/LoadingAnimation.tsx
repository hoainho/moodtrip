import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const messages = [
  "Đang vẽ bản đồ...",
  "Hỏi ý kiến thổ địa...",
  "Đóng gói hành lý...",
  "Kiểm tra khách sạn...",
  "Kiểm tra thời tiết...",
  "Tìm quán ăn ngon...",
];

function SkeletonBlock({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`bg-white/[0.06] rounded-xl animate-pulse ${className}`}
    />
  );
}

function SkeletonTimeline({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white/[0.04] rounded-3xl p-5 border border-white/5"
    >
      {/* Day header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-full bg-white/[0.08] animate-pulse" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-5 w-48" />
        </div>
      </div>

      {/* Timeline items */}
      <div className="relative pl-5 space-y-4">
        <div className="absolute left-0 top-0 h-full w-0.5 bg-white/[0.06]" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative pl-4">
            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white/[0.1] animate-pulse" />
            <SkeletonBlock className="h-4 w-16 mb-2" delay={delay + i * 0.05} />
            <SkeletonBlock className="h-3 w-full max-w-[280px] mb-1" delay={delay + i * 0.05 + 0.02} />
            <SkeletonBlock className="h-3 w-32" delay={delay + i * 0.05 + 0.04} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export const LoadingAnimation: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-teal-500/5 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-cyan-500/5 blur-[80px]" />
      </div>

      {/* Skeleton header */}
      <div className="sticky top-0 z-30 bg-[rgba(10,14,26,0.8)] backdrop-blur-[30px] border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <SkeletonBlock className="h-6 w-24" />
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-6 w-10" />
        </div>
      </div>

      {/* Skeleton content */}
      <div className="flex-1 overflow-hidden relative z-10">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          {/* Overview banner skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-white/[0.04] to-white/[0.02] rounded-2xl p-8 text-center border border-white/5"
          >
            <SkeletonBlock className="h-7 w-64 mx-auto mb-4" />
            <SkeletonBlock className="h-4 w-full max-w-lg mx-auto mb-2" />
            <SkeletonBlock className="h-4 w-3/4 max-w-md mx-auto" />
          </motion.div>

          {/* Section tabs skeleton */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex gap-2 overflow-hidden"
          >
            {[20, 16, 16, 12, 16, 20].map((w, i) => (
              <SkeletonBlock key={i} className={`h-9 rounded-full flex-shrink-0`} style={{ width: `${w * 4}px` } as React.CSSProperties} delay={0.2 + i * 0.03} />
            ))}
          </motion.div>

          {/* Day cards skeleton */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-6">
              <SkeletonTimeline delay={0.3} />
              <SkeletonTimeline delay={0.5} />
            </div>

            {/* Info cards skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="bg-white/[0.04] rounded-3xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.08] animate-pulse" />
                <SkeletonBlock className="h-5 w-36" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                    <SkeletonBlock className="h-4 w-32 mb-2" />
                    <SkeletonBlock className="h-3 w-full max-w-[200px]" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="bg-white/[0.04] rounded-3xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.08] animate-pulse" />
                <SkeletonBlock className="h-5 w-40" />
              </div>
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2 p-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/[0.1] mt-1.5 flex-shrink-0" />
                    <SkeletonBlock className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom status area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative z-20 py-6 flex flex-col items-center"
      >
        <AnimatePresence mode="wait">
          <motion.h2
            key={messageIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-semibold text-white mb-3 text-shadow-md"
          >
            {messages[messageIndex]}
          </motion.h2>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-slate-300 text-shadow-sm mb-4"
        >
          Chuyến đi của bạn sắp sẵn sàng rồi!
        </motion.p>

        {/* Progress indicator */}
        <motion.div
          className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #0d9488, #06b6d4, #22c55e)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
