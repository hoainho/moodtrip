import React, { useState } from 'react';
import type { ItineraryPlan } from '../types';
import { motion } from 'motion/react';
import { IconX, IconMapPin, IconFood, IconHotel, IconTip, IconReceipt } from './icons';

interface TripComparisonProps {
  itineraries: ItineraryPlan[];
  onClose: () => void;
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-lg font-bold text-white">{value}</span>
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function TripColumn({ trip, isCheaper }: { trip: ItineraryPlan; isCheaper: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-dark rounded-3xl p-5 border ${isCheaper ? 'border-green-500/30' : 'border-white/5'}`}
    >
      {isCheaper && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 mb-3">
          <IconReceipt className="w-3 h-3" />
          Tiết kiệm hơn
        </div>
      )}

      {/* Destination */}
      <div className="flex items-center gap-2 mb-3">
        <IconMapPin className="w-5 h-5 text-teal-400 flex-shrink-0" />
        <h3 className="text-xl font-bold text-white truncate">{trip.destination}</h3>
      </div>

      {/* Overview */}
      <p className="text-sm text-slate-400 mb-4 line-clamp-3 leading-relaxed">{trip.overview}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatCard
          icon={<IconMapPin className="w-3.5 h-3.5 text-teal-400" />}
          value={trip.timeline.length}
          label="ngày"
        />
        <StatCard
          icon={<IconFood className="w-3.5 h-3.5 text-orange-400" />}
          value={trip.food.length}
          label="món ăn"
        />
        <StatCard
          icon={<IconTip className="w-3.5 h-3.5 text-cyan-400" />}
          value={trip.tips.length}
          label="mẹo hay"
        />
        <StatCard
          icon={<IconHotel className="w-3.5 h-3.5 text-purple-400" />}
          value={trip.accommodation?.length ?? 0}
          label="chỗ nghỉ"
        />
      </div>

      {/* Budget */}
      {trip.budget_summary && (
        <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Chi phí</span>
          <span className="text-sm font-bold text-teal-300">{trip.budget_summary.total_estimated}</span>
        </div>
      )}
    </motion.div>
  );
}

function parseBudgetNumber(str: string): number {
  const cleaned = str.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export const TripComparison: React.FC<TripComparisonProps> = ({ itineraries, onClose }) => {
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(Math.min(1, itineraries.length - 1));

  const leftTrip = itineraries[leftIndex];
  const rightTrip = itineraries[rightIndex];

  // Determine cheaper trip
  let leftCheaper = false;
  let rightCheaper = false;
  if (leftTrip?.budget_summary && rightTrip?.budget_summary) {
    const leftBudget = parseBudgetNumber(leftTrip.budget_summary.total_estimated);
    const rightBudget = parseBudgetNumber(rightTrip.budget_summary.total_estimated);
    if (leftBudget > 0 && rightBudget > 0) {
      if (leftBudget < rightBudget) leftCheaper = true;
      else if (rightBudget < leftBudget) rightCheaper = true;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-h-screen">
        {/* Header */}
        <div className="glass-dark border-b border-white/5 px-4 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white">So sánh chuyến đi</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Selectors */}
        <div className="px-4 py-3 flex gap-3 flex-shrink-0">
          <div className="flex-1">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1 block">Chuyến 1</label>
            <select
              value={leftIndex}
              onChange={(e) => setLeftIndex(Number(e.target.value))}
              className="w-full bg-white/10 text-white border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 appearance-none cursor-pointer"
            >
              {itineraries.map((trip, i) => (
                <option key={i} value={i} className="bg-slate-900 text-white">
                  {trip.destination}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2 text-slate-500 font-bold text-sm">VS</div>
          <div className="flex-1">
            <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1 block">Chuyến 2</label>
            <select
              value={rightIndex}
              onChange={(e) => setRightIndex(Number(e.target.value))}
              className="w-full bg-white/10 text-white border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 appearance-none cursor-pointer"
            >
              {itineraries.map((trip, i) => (
                <option key={i} value={i} className="bg-slate-900 text-white">
                  {trip.destination}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            {leftTrip && <TripColumn trip={leftTrip} isCheaper={leftCheaper} />}
            {rightTrip && <TripColumn trip={rightTrip} isCheaper={rightCheaper} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
