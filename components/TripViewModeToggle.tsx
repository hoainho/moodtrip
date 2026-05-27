import React from 'react';
import { motion } from 'motion/react';

export type TripViewMode = 'timeline' | 'storyboard' | 'compact';

interface TripViewModeToggleProps {
  mode: TripViewMode;
  onChange: (mode: TripViewMode) => void;
}

const MODES: Array<{ id: TripViewMode; label: string; icon: string; hint: string }> = [
  { id: 'timeline', label: 'Lịch trình', icon: '📋', hint: 'Theo giờ' },
  { id: 'storyboard', label: 'Storyboard', icon: '🎬', hint: 'Phóng to' },
  { id: 'compact', label: 'Gọn', icon: '📑', hint: 'Cho điện thoại' },
];

export const TripViewModeToggle: React.FC<TripViewModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className="relative px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            title={m.hint}
          >
            {active && (
              <motion.span
                layoutId="trip-view-mode-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border border-teal-400/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className={`relative flex items-center gap-1.5 ${active ? 'text-teal-200' : 'text-slate-400 hover:text-white'}`}>
              <span>{m.icon}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
