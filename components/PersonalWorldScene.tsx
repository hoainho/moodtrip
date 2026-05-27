import { Suspense, lazy, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/useAuth';
import { listOwnedTrips, type TripRecord } from '../services/tripsApi';
import { buildWorldStats, currentMilestone } from '../services/personalWorld';
import { buildSceneState } from '../services/personalWorldScene';

const LazySceneCanvas = lazy(() => import('./three/PersonalWorldCanvas'));

interface PersonalWorldSceneProps {
  open: boolean;
  onClose: () => void;
}

export function PersonalWorldScene({ open, onClose }: PersonalWorldSceneProps) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    listOwnedTrips(user.id, 200)
      .then((rows) => {
        if (!cancelled) setTrips(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  if (!open) return null;

  const stats = buildWorldStats(trips);
  const scene = buildSceneState(trips, stats);
  const milestone = currentMilestone(stats.tripCount);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
      >
        <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between">
          <div className="glass-dark rounded-2xl border border-white/10 p-4 max-w-md">
            <p className="text-teal-300 text-xs uppercase tracking-wider mb-1">Thế giới của bạn</p>
            <h2 className="text-white text-xl font-bold">
              {milestone?.label ?? 'Vùng đất mới'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {stats.tripCount} chuyến · {stats.uniqueDestinations} điểm đến · {scene.monuments.length} công trình
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass-dark border border-white/10 text-white hover:bg-white/5"
          >
            Đóng
          </button>
        </div>

        <div className="w-full h-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              Đang dựng thế giới của bạn…
            </div>
          ) : scene.monuments.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-center text-slate-400 px-6">
              <div>
                <p className="text-3xl mb-2">🌱</p>
                <p className="text-white text-base font-medium mb-1">Thế giới còn trống</p>
                <p className="text-sm">
                  Tạo chuyến đi đầu tiên — một công trình sẽ xuất hiện ở đây sau mỗi chuyến.
                </p>
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-400">Đang tải 3D…</div>}>
              <LazySceneCanvas monuments={scene.monuments} ringRadius={scene.ringRadius} />
            </Suspense>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
