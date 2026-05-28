import React from 'react';
import { motion } from 'motion/react';
import { IconLayoutList, IconFilm, IconLayoutGrid } from './icons';

export type TripViewMode = 'timeline' | 'storyboard' | 'compact';

interface TripViewModeToggleProps {
  mode: TripViewMode;
  onChange: (mode: TripViewMode) => void;
}

const MODES: Array<{
  id: TripViewMode;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  hint: string;
}> = [
  { id: 'timeline', label: 'Lịch trình', Icon: IconLayoutList, hint: 'Theo giờ' },
  { id: 'storyboard', label: 'Storyboard', Icon: IconFilm, hint: 'Phóng to' },
  { id: 'compact', label: 'Gọn', Icon: IconLayoutGrid, hint: 'Cho điện thoại' },
];

export const TripViewModeToggle: React.FC<TripViewModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
      {MODES.map((m) => {
        const active = m.id === mode;
        const Icon = m.Icon;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            aria-label={`${m.label} — ${m.hint}`}
            aria-pressed={active}
            className="relative inline-flex items-center min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            title={m.hint}
          >
            {active && (
              <motion.span
                layoutId="trip-view-mode-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border border-teal-400/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className={`relative inline-flex items-center gap-1.5 ${active ? 'text-teal-200' : 'text-slate-400 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{m.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
