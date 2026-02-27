import React, { useState } from 'react';
import { Logo } from './Logo';
import { IconMapPin, IconSparkles, IconGlobe, IconCompass } from './icons';
import type { ItineraryPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  onStart: () => void;
  savedItineraries: ItineraryPlan[];
  onLoadItinerary: (itinerary: ItineraryPlan) => void;
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

export const Hero: React.FC<HeroProps> = ({ onStart, savedItineraries, onLoadItinerary, onGoHome, onGoToRelease, onGoToTips, onGoToAbout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Mẹo du lịch', onClick: onGoToTips },
    { label: 'Giới thiệu', onClick: onGoToAbout },
    { label: 'Phiên bản', onClick: onGoToRelease },
  ];

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen text-white overflow-hidden"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'white',
        overflow: 'hidden',
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
      <div className="relative z-10 text-center px-8 max-w-3xl bg-black/10 backdrop-blur-[2px] rounded-3xl py-12">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight text-white text-shadow-lg"
        >
          Không biết đi đâu?
        </motion.h1>
        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-gradient-aurora leading-tight text-shadow-md"
        >
          Hãy để cảm xúc dẫn đường!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed text-shadow-sm"
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
            onClick={onStart}
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(13, 148, 136, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 gradient-nature text-white font-bold rounded-full text-lg shadow-lg shadow-teal-500/30 transition-all duration-300"
          >
            Khám phá ngay
          </motion.button>

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
      
      {/* Saved itineraries marquee */}
      {savedItineraries && savedItineraries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-0 left-0 w-full z-10 pb-8 flex flex-col items-center"
        >
          <h3 className="text-center text-slate-400 text-sm font-medium mb-4 tracking-wider uppercase">Lịch sử chuyến đi</h3>
          <div className="w-full max-w-7xl marquee-wrapper">
            <div className="marquee space-x-4">
              {[...savedItineraries, ...savedItineraries].map((trip, index) => {
                const gradient = gradientClasses[index % gradientClasses.length];
                return (
                  <motion.div 
                    key={`${trip.id}-${index}`}
                    onClick={() => onLoadItinerary(trip)}
                    whileHover={{ scale: 1.05, y: -3 }}
                    className={`flex items-center space-x-3 px-5 py-3 rounded-xl cursor-pointer glass border border-white/10 bg-gradient-to-br ${gradient} bg-opacity-20`}
                  >
                    <IconMapPin className="w-4 h-4 text-white/70" />
                    <span className="font-semibold text-sm whitespace-nowrap text-white">{trip.destination}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
