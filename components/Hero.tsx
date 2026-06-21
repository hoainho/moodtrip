import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { IconMapPin, IconSparkles, IconGlobe, IconCompass, IconX } from './icons';
import type { ItineraryPlan } from '../types';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { hapticLight, hapticSelection } from '../services/haptics';
import { TripComparison } from './TripComparison';
import { AmbientHero } from './home/AmbientHero';

// S4 — kinetic mood typography: a single emotion word that morphs, hinting the app is mood-led.
const KINETIC_MOODS = ['chữa lành', 'phiêu lưu', 'lãng mạn', 'tự do', 'bình yên', 'rực rỡ', 'tò mò'];

const KineticMood: React.FC = () => {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((p) => (p + 1) % KINETIC_MOODS.length), 2400);
    return () => clearInterval(t);
  }, [reduce]);
  return (
    <span className="relative inline-flex min-w-[6.5ch] justify-center font-extrabold" style={{ color: 'var(--mood-accent)' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {KINETIC_MOODS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

interface HeroProps {
  onStart: () => void;
  savedItineraries: ItineraryPlan[];
  onLoadItinerary: (itinerary: ItineraryPlan) => void;
  onDeleteItinerary: (id: string | number) => void;
  onGoHome: () => void;
  onGoToRelease: () => void;
  onGoToTips: () => void;
  onGoToAbout: () => void;
}

const gradientClasses = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-teal-500 to-cyan-500',
    'from-amber-400 to-orange-500',
    'from-lime-400 to-green-500',
    'from-sky-400 to-blue-500',
];

export const Hero: React.FC<HeroProps> = ({ onStart, savedItineraries, onLoadItinerary, onDeleteItinerary, onGoHome, onGoToRelease, onGoToTips, onGoToAbout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const prefersReduced = useReducedMotion();

  // Escape key closes menu and restores focus to hamburger
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Move focus to first menu item when menu opens
  useEffect(() => {
    if (mobileMenuOpen) {
      firstMenuItemRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  const navItems = [
    { label: 'Mẹo du lịch', onClick: onGoToTips },
    { label: 'Giới thiệu', onClick: onGoToAbout },
    { label: 'Phiên bản', onClick: onGoToRelease },
  ];

  return (
    <div
      className="relative flex flex-col items-center h-[100svh] overflow-hidden text-white pt-20 pb-3"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100svh',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      {/* Living ambient backdrop (S2) — aurora + fireflies, behind the readability scrim. */}
      <AmbientHero />

      {/* One smooth, full-bleed readability gradient over the whole hero — edgeless and uniform
          (no boxed per-text scrim), so the 3D scene blends consistently top-to-bottom. */}
      <div className="hero-scrim" aria-hidden="true" />

      {/* Top bar */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
        <Logo className="text-white" onClick={onGoHome} />
      </div>

      {/* Desktop nav */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10 flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <motion.button
              key={item.label}
              onClick={item.onClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 glass text-white/80 text-sm font-medium rounded-full hover:bg-white/10 transition-colors border border-white/10"
            >
              {item.label}
            </motion.button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <motion.button
          ref={hamburgerRef}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          whileTap={{ scale: 0.9 }}
          className="md:hidden p-2.5 glass rounded-full border border-white/10"
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="hero-mobile-menu"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </motion.button>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-20 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              id="hero-mobile-menu"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-16 right-4 z-30 glass-dark rounded-2xl p-2 min-w-[180px] border border-white/10 md:hidden shadow-2xl shadow-black/40"
            >
              {navItems.map((item, i) => (
                <button
                  key={item.label}
                  ref={i === 0 ? firstMenuItemRef : undefined}
                  onClick={() => { item.onClick(); setMobileMenuOpen(false); hamburgerRef.current?.focus(); }}
                  className="w-full text-left px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Splash content fills the space ABOVE the history strip and stays vertically centered, so the
          home reads as one fixed screen. Readability comes from the full-bleed `.hero-scrim` behind. */}
      <div className="flex-1 flex flex-col items-center w-full min-h-0 overflow-y-auto scrollbar-none">
        <div className="relative z-10 text-center px-4 sm:px-8 max-w-3xl py-4 sm:py-6 my-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight text-white text-shadow-lg"
        >
          Không biết đi đâu?
        </motion.h1>
        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold mb-4 sm:mb-6 text-gradient-aurora leading-tight text-shadow-md"
        >
          Hãy để cảm xúc dẫn đường!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="text-lg sm:text-xl text-white/90 mb-3 sm:mb-5 font-medium text-shadow-sm flex items-center justify-center gap-2 flex-wrap"
        >
          <span>Hôm nay mình muốn</span>
          <KineticMood />
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-sm sm:text-lg text-slate-300/90 mb-4 sm:mb-6 max-w-xl mx-auto leading-relaxed text-shadow-sm"
        >
          Khám phá thế giới theo cách của bạn. AI sẽ tạo hành trình du lịch hoàn hảo dựa trên tâm trạng và sở thích của bạn.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.button
            onClick={() => { hapticLight(); onStart(); }}
            whileHover={{ scale: 1.05, boxShadow: '0 12px 44px var(--mood-accent-soft)' }}
            whileTap={{ scale: 0.95 }}
            style={{ background: 'var(--mood-accent)', color: '#0a0e1a' }}
            className="px-10 py-4 font-bold rounded-full text-lg shadow-lg shadow-black/20 transition-all duration-300"
          >
            Khám phá ngay
          </motion.button>

          {savedItineraries.length >= 2 && (
            <motion.button
              onClick={() => setShowComparison(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 glass text-white/80 font-medium rounded-full text-sm border border-white/10 hover:bg-white/10 transition-colors"
            >
              So sánh chuyến đi
            </motion.button>
          )}

        </motion.div>

        {/* Value chips — drift gently like they're floating, scattered at different heights so they
            don't read as a rigid row, but stay within the hero frame. Frozen under reduced-motion. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-5 sm:mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-6"
        >
          {[
            { icon: <IconSparkles className="w-4 h-4 text-amber-300" />, label: 'AI-Powered', off: 'sm:-translate-y-3' },
            { icon: <IconGlobe className="w-4 h-4 text-cyan-300" />, label: '3D Experience', off: 'sm:translate-y-4' },
            { icon: <IconCompass className="w-4 h-4 text-emerald-300" />, label: '100+ Điểm đến', off: 'sm:-translate-y-1' },
          ].map((chip, i) => (
            <motion.div
              key={chip.label}
              animate={prefersReduced ? undefined : { y: [0, -9, 0], rotate: [0, i % 2 ? 1.5 : -1.5, 0] }}
              transition={prefersReduced ? undefined : { duration: 3.6 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
              className={`glass px-4 py-2 rounded-full text-sm text-white/85 flex items-center gap-2 shadow-lg shadow-black/20 ${chip.off}`}
            >
              {chip.icon} {chip.label}
            </motion.div>
          ))}
        </motion.div>
        </div>
      </div>

      {/* Trip Gallery — horizontal scroll strip pinned to the bottom of the fixed home screen */}
      {savedItineraries && savedItineraries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="relative w-full z-10 px-4 pb-5 flex-shrink-0"
        >
          <div className="text-center mb-3">
            <h3 className="text-base sm:text-lg font-bold text-white">Hành trình đã lưu</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Vuốt ngang để xem · chạm để mở lại</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-3 overflow-x-auto snap-x scrollbar-thin pb-2 px-1 -mx-1">
              {savedItineraries.map((trip, index) => {
                const gradient = gradientClasses[index % gradientClasses.length];
                const days = trip.timeline?.length ?? 0;
                const acts = trip.timeline?.reduce((s, d) => s + (d.schedule?.length ?? 0), 0) ?? 0;
                return (
                  <motion.div
                    key={trip.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + index * 0.08 }}
                    whileHover={{ y: -5 }}
                    onClick={() => { hapticSelection(); onLoadItinerary(trip); }}
                    className="relative group cursor-pointer w-[150px] sm:w-64 flex-shrink-0 snap-start rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-[color:var(--mood-accent)]/40 transition-all shadow-lg shadow-black/20"
                  >
                    {/* Memory color spine */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
                    <button
                      onClick={(e) => { e.stopPropagation(); if (trip.id) onDeleteItinerary(trip.id); }}
                      aria-label="Xóa lịch trình"
                      className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-sm border border-white/15 text-white/70 hover:text-white hover:bg-red-500/70 hover:border-red-400/40 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 pr-7 sm:pr-8">
                        <IconMapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--mood-accent)' }} />
                        <span className="font-bold text-sm text-white truncate">{trip.destination}</span>
                      </div>
                      {(days > 0 || acts > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-medium text-slate-300">
                          {days > 0 && <span className="px-2 py-0.5 rounded-full bg-white/[0.06]">{days} ngày</span>}
                          {acts > 0 && <span className="px-2 py-0.5 rounded-full bg-white/[0.06]">{acts} hoạt động</span>}
                        </div>
                      )}
                      {trip.overview && (
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 line-clamp-1 sm:line-clamp-2 leading-relaxed">{trip.overview}</p>
                      )}
                      <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--mood-accent)' }}>
                        Mở lại →
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
      {showComparison && (
        <TripComparison
          itineraries={savedItineraries}
          onClose={() => setShowComparison(false)}
        />
      )}

    </div>
  );
};
