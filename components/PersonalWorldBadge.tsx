import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { listOwnedTrips } from '../services/tripsApi';
import {
  buildWorldStats,
  currentMilestone,
  nextMilestone,
  type PersonalWorldStats,
} from '../services/personalWorld';
import { useAuth } from '../services/useAuth';

export function PersonalWorldBadge() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PersonalWorldStats | null>(null);

  useEffect(() => {
    if (!user) {
      setStats(null);
      return;
    }
    let cancelled = false;
    listOwnedTrips(user.id, 100).then((trips) => {
      if (cancelled) return;
      setStats(buildWorldStats(trips));
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || !stats) return null;

  const current = currentMilestone(stats.tripCount);
  const next = nextMilestone(stats.tripCount);
  const progressTowardsNext = next
    ? Math.min(1, stats.tripCount / next.threshold)
    : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass-dark border border-teal-500/20 p-4 max-w-md mx-auto"
    >
      <p className="text-teal-300 text-xs uppercase tracking-wider mb-2">Thế giới MoodTrip của bạn</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{current ? '🌳' : '🌱'}</div>
        <div>
          <p className="text-white font-bold text-base">
            {current?.label ?? 'Chưa có chuyến nào'}
          </p>
          <p className="text-slate-400 text-xs">{current?.description ?? 'Hãy tạo chuyến đầu tiên'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3 text-xs">
        <Stat label="Chuyến" value={stats.tripCount} />
        <Stat label="Điểm đến" value={stats.uniqueDestinations} />
        <Stat label="Vùng miền" value={stats.regionsVisited.size} />
      </div>

      {next && (
        <>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressTowardsNext * 100}%` }}
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-400"
            />
          </div>
          <p className="text-slate-500 text-xs mt-1.5">
            {next.threshold - stats.tripCount} chuyến nữa đến {next.label}
          </p>
        </>
      )}
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/5 py-2">
      <p className="text-white font-bold text-base">{value}</p>
      <p className="text-slate-500 text-[10px] mt-0.5">{label}</p>
    </div>
  );
}
