import React, { useState } from 'react';
import { Logo } from './Logo';
import { IconMapPin, IconSparkles, IconGlobe, IconCompass, IconX } from './icons';
import type { ItineraryPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { hapticLight, hapticSelection } from '../services/haptics';
import { TripComparison } from './TripComparison';

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

  const navItems = [
    { label: 'Mẹo du lịch', onClick: onGoToTips },
    { label: 'Giới thiệu', onClick: onGoToAbout },
    { label: 'Phiên bản', onClick: onGoToRelease },
  ];

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen text-white"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'white',
        overflowX: 'hidden',
      }}
    >
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
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          whileTap={{ scale: 0.9 }}
          className="md:hidden p-2.5 glass rounded-full border border-white/10"
          aria-label="Menu"
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
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-16 right-4 z-30 glass-dark rounded-2xl p-2 min-w-[180px] border border-white/10 md:hidden shadow-2xl shadow-black/40"
            >
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.onClick(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feature badges */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="absolute top-28 left-8 hidden lg:block"
      >
        <div className="glass px-4 py-2 rounded-full text-sm text-white/70 animate-float flex items-center gap-2" style={{ animationDelay: '0s' }}>
          <IconSparkles className="w-4 h-4 text-teal-400" /> AI-Powered
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute top-40 right-12 hidden lg:block"
      >
        <div className="glass px-4 py-2 rounded-full text-sm text-white/70 animate-float flex items-center gap-2" style={{ animationDelay: '2s' }}>
          <IconGlobe className="w-4 h-4 text-cyan-400" /> 3D Experience
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-36 left-12 hidden lg:block"
      >
        <div className="glass px-4 py-2 rounded-full text-sm text-white/70 animate-float flex items-center gap-2" style={{ animationDelay: '4s' }}>
          <IconCompass className="w-4 h-4 text-green-400" /> 100+ Điểm đến
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 sm:px-8 max-w-3xl bg-black/10 backdrop-blur-[2px] rounded-3xl py-8 sm:py-12 mt-16 sm:mt-0 mb-24 sm:mb-0">
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
          className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 text-gradient-aurora leading-tight text-shadow-md"
        >
          Hãy để cảm xúc dẫn đường!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-base sm:text-lg text-slate-300 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed text-shadow-sm"
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
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(13, 148, 136, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 gradient-nature text-white font-bold rounded-full text-lg shadow-lg shadow-teal-500/30 transition-all duration-300"
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

          {savedItineraries.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-slate-500 text-sm cursor-pointer hover:text-teal-400 transition-colors"
            >
              hoặc xem lịch sử chuyến đi ↓
            </motion.p>
          )}
        </motion.div>
      </div>
      
      {/* Trip Gallery */}
      {savedItineraries && savedItineraries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-0 left-0 w-full z-10 pb-4 sm:pb-8 px-4"
        >
          <h3 className="text-center text-slate-400 text-xs sm:text-sm font-medium mb-3 tracking-wider uppercase">Lịch sử chuyến đi</h3>
          <div className="max-w-3xl mx-auto max-h-[35vh] overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {savedItineraries.map((trip, index) => {
                const gradient = gradientClasses[index % gradientClasses.length];
                return (
                  <motion.div
                    key={trip.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + index * 0.08 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    onClick={() => { hapticSelection(); onLoadItinerary(trip); }}
                    className={`relative group cursor-pointer glass rounded-2xl p-4 border border-white/10 bg-gradient-to-br ${gradient} bg-opacity-20 transition-all`}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); if (trip.id) onDeleteItinerary(trip.id); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/30 text-white/50 hover:text-white hover:bg-red-500/50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2">
                      <IconMapPin className="w-4 h-4 text-white/70 flex-shrink-0" />
                      <span className="font-semibold text-sm text-white truncate">{trip.destination}</span>
                    </div>
                    {trip.overview && (
                      <p className="text-xs text-white/50 mt-1.5 line-clamp-2">{trip.overview}</p>
                    )}
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
