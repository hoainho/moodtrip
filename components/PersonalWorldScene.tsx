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
import { buildSceneState, treeGrowth, TREE_MAX_TRIPS } from '../services/personalWorldScene';
import { SceneErrorBoundary, isWebGLAvailable } from './three/sceneHelpers';
import { IconSprout, IconMapPin, IconX } from './icons';
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
  onOpenTrip?: (itinerary: ItineraryPlan) => void;
}

export function PersonalWorldScene({ open, onClose, localTrips, onOpenTrip }: PersonalWorldSceneProps) {
  const { user } = useAuth();
  const [remoteTrips, setRemoteTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [webglOk] = useState(isWebGLAvailable);
  const [contextLost, setContextLost] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setContextLost(false); setSelectedId(null); }
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
  const selectedTrip = selectedId && selectedId !== '__tree__' ? trips.find((t) => t.id === selectedId) ?? null : null;
  const tree = selectedId === '__tree__' ? treeGrowth(stats.tripCount) : null;

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
                  onSelectMonument={(id) => setSelectedId(id || null)}
                  selectedMonumentId={selectedId}
                />
              </Suspense>
            </SceneErrorBoundary>
          )}
        </div>

        {/* Trip tooltip — appears when a monument is tapped; shows details + opens the trip */}
        <AnimatePresence>
          {selectedTrip && (() => {
            const it = selectedTrip.itinerary;
            const days = it.timeline?.length ?? 0;
            const acts = it.timeline?.reduce((s, d) => s + (d.schedule?.length ?? 0), 0) ?? 0;
            return (
              <motion.div
                key={selectedTrip.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(92vw,22rem)]"
              >
                <div className="glass-dark rounded-2xl border border-white/15 p-4 shadow-2xl shadow-black/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <IconMapPin className="w-4 h-4 flex-shrink-0 text-teal-300" />
                      <h3 className="font-bold text-white truncate">{selectedTrip.destination}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedId(null)}
                      aria-label="Đóng"
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {(days > 0 || acts > 0) && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-slate-300">
                      {days > 0 && <span className="px-2 py-0.5 rounded-full bg-white/[0.07]">{days} ngày</span>}
                      {acts > 0 && <span className="px-2 py-0.5 rounded-full bg-white/[0.07]">{acts} hoạt động</span>}
                    </div>
                  )}
                  {it.overview && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{it.overview}</p>
                  )}
                  <button
                    onClick={() => { onOpenTrip?.(it); onClose(); }}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-xl bg-teal-400 text-teal-950 text-sm font-bold hover:bg-teal-300 transition-colors"
                  >
                    Mở chuyến đi →
                  </button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Life-tree growth tooltip — tap the central tree to see how close it is to full growth (10 trips). */}
        <AnimatePresence>
          {tree && (
            <motion.div
              key="tree"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(92vw,22rem)]"
            >
              <div className="glass-dark rounded-2xl border border-white/15 p-4 shadow-2xl shadow-black/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconSprout className="w-5 h-5 flex-shrink-0 text-emerald-300" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-emerald-300/80">Cây thế giới</p>
                      <h3 className="font-bold text-white truncate">{tree.label}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    aria-label="Đóng"
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Cấp <span className="text-white font-semibold">{tree.level + 1}</span>/<span className="text-white font-semibold">{tree.maxLevel + 1}</span>
                  {' · '}
                  <span className="text-white font-semibold">{tree.trips}</span>/{TREE_MAX_TRIPS} chuyến đi
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all"
                    style={{ width: `${Math.round(tree.progress * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {tree.atMax
                    ? 'Cây đã trưởng thành tối đa — cổ thụ xanh tốt giữa thế giới của bạn 🌳'
                    : `Còn ${tree.toMax} chuyến nữa để cây đạt mức tối đa${tree.nextLabel ? ` · sắp lên “${tree.nextLabel}”` : ''}.`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
