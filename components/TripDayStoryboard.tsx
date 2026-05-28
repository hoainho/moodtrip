import React from 'react';
import { motion } from 'motion/react';
import type { DayPlan } from '../types';
import {
  IconMapPin,
  IconWallet,
  IconFire,
  IconSun,
  IconMoon,
  IconClock,
  IconCoffee,
  IconCloudSun,
  IconSparkles,
} from './icons';

interface TripDayStoryboardProps {
  day: DayPlan;
  dayIndex: number;
}

type PartId = 'morning' | 'noon' | 'afternoon' | 'evening';

function partOfDay(time: string): PartId {
  const m = time.match(/(\d{1,2})/);
  if (!m) return 'morning';
  const h = parseInt(m[1], 10);
  if (h < 11) return 'morning';
  if (h < 14) return 'noon';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const PART_META: Record<
  PartId,
  {
    label: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    iconColor: string;
    railColor: string;
  }
> = {
  morning: { label: 'Sáng', Icon: IconCoffee, iconColor: 'text-amber-300', railColor: 'bg-amber-400/60' },
  noon: { label: 'Trưa', Icon: IconSun, iconColor: 'text-yellow-300', railColor: 'bg-yellow-400/60' },
  afternoon: { label: 'Chiều', Icon: IconCloudSun, iconColor: 'text-orange-300', railColor: 'bg-orange-400/60' },
  evening: { label: 'Tối', Icon: IconMoon, iconColor: 'text-indigo-300', railColor: 'bg-indigo-400/60' },
};

export const TripDayStoryboard: React.FC<TripDayStoryboardProps> = ({ day, dayIndex }) => {
  const isNight = day.title.toLowerCase().includes('toi') || day.title.toLowerCase().includes('dem');

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: dayIndex * 0.08 }}
      className="mb-10"
    >
      <header className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          {isNight ? <IconMoon className="w-5 h-5 text-white" /> : <IconSun className="w-5 h-5 text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-400">{day.day}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">{day.title}</h3>
        </div>
      </header>

      <ol className="space-y-3">
        {day.schedule.map((item, i) => {
          const part = partOfDay(item.time);
          const meta = PART_META[part];
          const Icon = meta.Icon;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
              className="relative pl-4"
            >
              <span aria-hidden className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${meta.railColor}`} />

              <article className="rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/15 transition-colors">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className={`inline-flex items-center gap-1.5 ${meta.iconColor}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">{meta.label}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-white tabular-nums">
                      <IconClock className="w-3.5 h-3.5 text-slate-400" />
                      {item.time}
                    </span>
                    {item.is_trending && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/25">
                        <IconFire className="w-3 h-3" />
                        Trending
                      </span>
                    )}
                  </div>

                  <h4 className="text-base sm:text-lg font-semibold text-white leading-snug mb-2">{item.activity}</h4>

                  {item.is_trending && item.trending_reason && (
                    <p className="text-xs text-orange-300/80 mb-2 flex items-start gap-1">
                      <IconSparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{item.trending_reason}</span>
                    </p>
                  )}

                  <div className="space-y-1.5 text-sm">
                    {item.venue && (
                      <div className="flex items-start gap-2 text-slate-300">
                        <IconMapPin className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                        {item.google_maps_link ? (
                          <a
                            href={item.google_maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-teal-300 transition-colors font-medium"
                          >
                            {item.venue}
                          </a>
                        ) : (
                          <span className="font-medium">{item.venue}</span>
                        )}
                      </div>
                    )}
                    {item.estimated_cost && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <IconWallet className="w-4 h-4 text-yellow-400/80 flex-shrink-0" />
                        <span>{item.estimated_cost}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </motion.li>
          );
        })}
      </ol>
    </motion.section>
  );
};
