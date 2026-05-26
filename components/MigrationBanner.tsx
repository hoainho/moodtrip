import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/useAuth';
import {
  clearLocalTripsAfterMigration,
  migrateLocalTrips,
  migrationAlreadyDone,
  readLocalTrips,
} from '../services/localTripMigration';

type State = 'idle' | 'prompting' | 'migrating' | 'success' | 'failed';

export function MigrationBanner() {
  const { user } = useAuth();
  const [state, setState] = useState<State>('idle');
  const [count, setCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (migrationAlreadyDone(user.id)) return;
    const local = readLocalTrips();
    if (local.totalCount === 0) return;
    setCount(local.totalCount);
    setState('prompting');
  }, [user]);

  if (!user || state === 'idle') return null;

  async function handleImport() {
    if (!user) return;
    setState('migrating');
    const result = await migrateLocalTrips(user.id);
    if (result.failed === 0 && result.imported > 0) {
      clearLocalTripsAfterMigration();
      setState('success');
    } else if (result.imported > 0) {
      setState('success');
    } else {
      setState('failed');
      setErrorMsg(result.errors[0] ?? 'Không rõ lỗi');
    }
  }

  function handleDismiss() {
    if (user) {
      try {
        localStorage.setItem(
          'moodtrip_local_migration_done_v1',
          JSON.stringify({ userId: user.id, ts: Date.now(), dismissed: true }),
        );
      } catch {
        void 0;
      }
    }
    setState('idle');
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92vw] p-4 rounded-2xl glass-dark border border-teal-500/30 shadow-2xl"
        role="dialog"
      >
        {state === 'prompting' && (
          <>
            <p className="text-white font-medium mb-1">
              Đã tìm thấy {count} lịch trình trên thiết bị này
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Đồng bộ lên tài khoản để truy cập từ bất kỳ thiết bị nào?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg"
              >
                Đồng bộ ngay
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-slate-400 hover:text-white text-sm rounded-lg"
              >
                Để sau
              </button>
            </div>
          </>
        )}

        {state === 'migrating' && (
          <p className="text-white text-sm">⏳ Đang đồng bộ {count} lịch trình…</p>
        )}

        {state === 'success' && (
          <>
            <p className="text-teal-300 font-medium mb-2">✓ Đã đồng bộ thành công</p>
            <button onClick={() => setState('idle')} className="text-slate-400 hover:text-white text-sm">
              Đóng
            </button>
          </>
        )}

        {state === 'failed' && (
          <>
            <p className="text-rose-400 font-medium mb-1">Đồng bộ thất bại</p>
            {errorMsg && <p className="text-slate-400 text-xs mb-3">{errorMsg}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex-1 px-3 py-2 bg-teal-500 text-white text-sm rounded-lg"
              >
                Thử lại
              </button>
              <button onClick={handleDismiss} className="px-3 py-2 text-slate-400 text-sm">
                Để sau
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
