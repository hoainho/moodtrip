import React from 'react';
import { motion } from 'motion/react';
import type { DayPlan } from '../types';
import { IconMapPin, IconWallet, IconFire, IconSun, IconMoon, IconClock } from './icons';

interface TripDayStoryboardProps {
  day: DayPlan;
  dayIndex: number;
}

function partOfDay(time: string): 'morning' | 'noon' | 'afternoon' | 'evening' {
  const m = time.match(/(\d{1,2})/);
  if (!m) return 'morning';
  const h = parseInt(m[1], 10);
  if (h < 11) return 'morning';
  if (h < 14) return 'noon';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const PART_LABELS: Record<string, { label: string; bg: string; accent: string }> = {
  morning: { label: 'Sáng', bg: 'from-amber-300/30 via-orange-200/20 to-rose-200/10', accent: 'text-amber-200' },
  noon: { label: 'Trưa', bg: 'from-sky-300/30 via-cyan-200/20 to-teal-200/10', accent: 'text-sky-200' },
  afternoon: { label: 'Chiều', bg: 'from-violet-300/30 via-fuchsia-200/20 to-pink-200/10', accent: 'text-violet-200' },
  evening: { label: 'Tối', bg: 'from-indigo-500/40 via-purple-400/25 to-slate-700/20', accent: 'text-indigo-200' },
};

export const TripDayStoryboard: React.FC<TripDayStoryboardProps> = ({ day, dayIndex }) => {
  const isNight = day.title.toLowerCase().includes('toi') || day.title.toLowerCase().includes('dem');

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: dayIndex * 0.1 }}
      className="mb-12"
    >
      <header className="flex items-center gap-4 mb-5">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl gradient-nature flex items-center justify-center shadow-lg shadow-teal-500/20">
          {isNight ? <IconMoon className="w-7 h-7 text-white" /> : <IconSun className="w-7 h-7 text-white" />}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">{day.day}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{day.title}</h3>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {day.schedule.map((item, i) => {
          const part = partOfDay(item.time);
          const meta = PART_LABELS[part];
          return (
            <motion.article
              key={i}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:border-teal-400/30 transition-colors group"
            >
              <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${meta.bg} opacity-90`} />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.accent}`}>
                    {meta.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-xs font-bold text-white">
                    <IconClock className="w-3 h-3" /> {item.time}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2 leading-snug">{item.activity}</h4>

                {item.is_trending && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 mb-2">
                    <IconFire className="w-3 h-3" /> Trending
                    {item.trending_reason && <span className="text-orange-200/80 font-normal">· {item.trending_reason}</span>}
                  </div>
                )}

                <div className="space-y-1.5 mt-3 text-sm">
                  {item.venue && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <IconMapPin className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      {item.google_maps_link ? (
                        <a
                          href={item.google_maps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-teal-300 transition-colors font-medium truncate"
                        >
                          {item.venue}
                        </a>
                      ) : (
                        <span className="font-medium truncate">{item.venue}</span>
                      )}
                    </div>
                  )}
                  {item.estimated_cost && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <IconWallet className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span>{item.estimated_cost}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
};
