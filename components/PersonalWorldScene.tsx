import { Suspense, lazy, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/useAuth';
import { listOwnedTrips, type TripRecord } from '../services/tripsApi';
import {
  buildWorldStats,
  currentMilestone,
  nextMilestone,
  tripRecordsFromItineraries,
  REGION_LABELS,
  MOOD_LABELS,
} from '../services/personalWorld';
import { buildSceneState } from '../services/personalWorldScene';
import { SceneErrorBoundary, isWebGLAvailable } from './three/sceneHelpers';
import { IconSprout } from './icons';
import type { ItineraryPlan } from '../types';

const LazySceneCanvas = lazy(() => import('./three/PersonalWorldCanvas'));

function SceneFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center text-center text-slate-400 px-6">
      <div>
        <IconSprout className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
        <p className="text-white text-base font-semibold mb-1">Không thể hiển thị 3D</p>
        <p className="text-sm">Thiết bị của bạn chưa hỗ trợ WebGL, nhưng dữ liệu chuyến đi vẫn ở bên trái.</p>
      </div>
    </div>
  );
}

interface PersonalWorldSceneProps {
  open: boolean;
  onClose: () => void;
  localTrips?: ItineraryPlan[];
}

export function PersonalWorldScene({ open, onClose, localTrips }: PersonalWorldSceneProps) {
  const { user } = useAuth();
  const [remoteTrips, setRemoteTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [webglOk] = useState(isWebGLAvailable);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    if (!open) setContextLost(false);
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    listOwnedTrips(user.id, 200)
      .then((rows) => {
        if (!cancelled) setRemoteTrips(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  if (!open) return null;

  const trips: TripRecord[] = user
    ? remoteTrips
    : tripRecordsFromItineraries(localTrips ?? []);

  const stats = buildWorldStats(trips);
  const scene = buildSceneState(trips, stats);
  const milestone = currentMilestone(stats.tripCount);
  const next = nextMilestone(stats.tripCount);

  const regionKeys = Array.from(stats.regionsVisited).filter(
    (r) => r !== 'unknown' || stats.regionsVisited.size === 1,
  );
  const topMoods = stats.topMoodTags.slice(0, 4);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
      >
        <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-3">
          <div className="glass-dark rounded-2xl border border-white/10 p-4 max-w-sm overflow-y-auto max-h-[calc(100vh-6rem)]">
            <p className="text-teal-300 text-xs uppercase tracking-wider mb-1">Thế giới của bạn</p>
            <h2 className="text-white text-xl font-bold">
              {milestone?.label ?? 'Vùng đất mới'}
            </h2>
            {milestone && (
              <p className="text-slate-400 text-xs mt-0.5 mb-2">{milestone.description}</p>
            )}

            <p className="text-slate-300 text-xs mt-1">
              <span className="text-white font-semibold">{stats.tripCount}</span> chuyến
              {' · '}
              <span className="text-white font-semibold">{stats.uniqueDestinations}</span> điểm đến
              {' · '}
              <span className="text-white font-semibold">{scene.monuments.length}</span> công trình
            </p>

            {stats.oldestTripDays !== null && stats.oldestTripDays > 0 && (
              <p className="text-slate-400 text-xs mt-1">
                Đồng hành <span className="text-teal-300 font-semibold">{stats.oldestTripDays}</span> ngày
              </p>
            )}

            {regionKeys.length > 0 && (
              <div className="mt-3">
                <p className="text-slate-500 text-xs mb-1.5 uppercase tracking-wide">Vùng đã đến</p>
                <div className="flex flex-wrap gap-1.5">
                  {regionKeys.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded-full text-xs bg-teal-900/60 text-teal-200 border border-teal-700/40"
                    >
                      {REGION_LABELS[r] ?? r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {topMoods.length > 0 && (
              <div className="mt-3">
                <p className="text-slate-500 text-xs mb-1.5 uppercase tracking-wide">Phong cách hay đi</p>
                <div className="flex flex-wrap gap-1.5">
                  {topMoods.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-full text-xs bg-amber-900/60 text-amber-200 border border-amber-700/40"
                    >
                      {MOOD_LABELS[m] ?? m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {next && (
              <div className="mt-3">
                <p className="text-slate-500 text-xs mb-1 uppercase tracking-wide">Tiếp theo</p>
                <p className="text-slate-300 text-xs mb-1.5">
                  Còn{' '}
                  <span className="text-yellow-300 font-semibold">
                    {next.threshold - stats.tripCount}
                  </span>{' '}
                  chuyến đến{' '}
                  <span className="text-white font-semibold">{next.label}</span>
                </p>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all"
                    style={{
                      width: `${Math.min(100, (stats.tripCount / next.threshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass-dark border border-white/10 text-white hover:bg-white/5 shrink-0"
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
                <IconSprout className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                <p className="text-white text-base font-semibold mb-1">Thế giới còn trống</p>
                <p className="text-sm">
                  Tạo chuyến đi đầu tiên — một công trình sẽ xuất hiện ở đây sau mỗi chuyến.
                </p>
              </div>
            </div>
          ) : !webglOk || contextLost ? (
            <SceneFallback />
          ) : (
            <SceneErrorBoundary fallback={<SceneFallback />}>
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-400">Đang tải 3D…</div>}>
                <LazySceneCanvas
                  monuments={scene.monuments}
                  ringRadius={scene.ringRadius}
                  tripCount={stats.tripCount}
                  onContextLost={() => setContextLost(true)}
                />
              </Suspense>
            </SceneErrorBoundary>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
