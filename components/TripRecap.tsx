import React from 'react';
import type { ItineraryPlan } from '../types';
import { motion } from 'motion/react';
import { IconX, IconHeart, IconMapPin, IconFood } from './icons';

interface TripRecapProps {
  itinerary: ItineraryPlan;
  onClose: () => void;
}

export const TripRecap: React.FC<TripRecapProps> = ({ itinerary, onClose }) => {
  const dayCount = itinerary.timeline.length;
  const foodCount = itinerary.food.length;
  const topFoods = itinerary.food.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[400px] z-10"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all border border-white/10"
        >
          <IconX className="w-4 h-4" />
        </button>

        {/* Recap card */}
        <div
          id="trip-recap-card"
          className="gradient-ocean rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10"
        >
          {/* Top accent line */}
          <div className="h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-green-400" />

          <div className="p-8">
            {/* Destination */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-full bg-white/10 flex-shrink-0 mt-1">
                <IconMapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Chuyến đi tới</p>
                <h2 className="text-3xl font-extrabold text-white leading-tight">{itinerary.destination}</h2>
              </div>
            </div>

            {/* Overview */}
            <p className="text-sm text-white/70 leading-relaxed mb-6 line-clamp-2">{itinerary.overview}</p>

            {/* Stats */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-white/10 rounded-2xl p-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-white">{dayCount}</p>
                <p className="text-xs text-white/50 font-medium">ngày</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-2xl p-4 text-center border border-white/5">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <IconFood className="w-4 h-4 text-white/70" />
                  <p className="text-2xl font-bold text-white">{foodCount}</p>
                </div>
                <p className="text-xs text-white/50 font-medium">món ngon</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-2xl p-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-white">{itinerary.tips.length}</p>
                <p className="text-xs text-white/50 font-medium">mẹo hay</p>
              </div>
            </div>

            {/* Food highlights */}
            {topFoods.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Ẩm thực nổi bật</p>
                <div className="flex flex-wrap gap-2">
                  {topFoods.map((food, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/5"
                    >
                      <IconFood className="w-3 h-3" />
                      {food.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Budget if available */}
            {itinerary.budget_summary && (
              <div className="bg-white/10 rounded-xl px-4 py-3 mb-6 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/50 font-medium">Chi phí ước tính</span>
                <span className="text-sm font-bold text-teal-300">{itinerary.budget_summary.total_estimated}</span>
              </div>
            )}

            {/* Branding */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-xs text-white/30 font-medium flex items-center justify-center gap-1">
                Made with <IconHeart className="w-3 h-3 text-red-400/60" /> by MoodTrip
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
