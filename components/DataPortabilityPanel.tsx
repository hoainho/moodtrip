import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/useAuth';
import {
  buildDataExport,
  downloadArchive,
  requestAccountDeletionViaEdgeFunction,
} from '../services/dataExport';
import { IconPackage, IconTrash, IconCheck } from './icons';

type State =
  | { kind: 'idle' }
  | { kind: 'exporting' }
  | { kind: 'exported'; count: number }
  | { kind: 'export-failed'; error: string }
  | { kind: 'confirming-deletion' }
  | { kind: 'deleting' }
  | { kind: 'delete-failed'; error: string }
  | { kind: 'deleted' };

export function DataPortabilityPanel() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ kind: 'idle' });

  if (!user) {
    return (
      <p className="text-slate-500 text-xs">
        Đăng nhập để xuất dữ liệu hoặc yêu cầu xoá tài khoản.
      </p>
    );
  }

  async function handleExport() {
    if (!user) return;
    setState({ kind: 'exporting' });
    try {
      const archive = await buildDataExport(user);
      downloadArchive(archive);
      setState({ kind: 'exported', count: archive.trips.length });
    } catch (err) {
      setState({
        kind: 'export-failed',
        error: err instanceof Error ? err.message : 'Lỗi không xác định',
      });
    }
  }

  async function handleConfirmDelete() {
    setState({ kind: 'deleting' });
    const result = await requestAccountDeletionViaEdgeFunction();
    if (result.ok) {
      setState({ kind: 'deleted' });
    } else {
      setState({
        kind: 'delete-failed',
        error: result.error ?? 'Lỗi không xác định',
      });
    }
  }

  return (
    <div className="rounded-2xl glass-dark border border-white/10 p-4 max-w-md mx-auto space-y-4">
      <div>
        <p className="text-white font-semibold text-sm mb-1 inline-flex items-center gap-2">
          <IconPackage className="w-4 h-4 text-teal-300" />
          Xuất dữ liệu của bạn
        </p>
        <p className="text-slate-400 text-xs leading-relaxed mb-3">
          Tải về một file JSON chứa toàn bộ lịch trình, sở thích, và đồng ý xử lý dữ liệu của bạn.
          Theo Nghị định 13/2023/NĐ-CP, bạn có quyền mang dữ liệu của mình đi bất kỳ lúc nào.
        </p>
        <button
          onClick={handleExport}
          disabled={state.kind === 'exporting'}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl disabled:opacity-60"
        >
          {state.kind === 'exporting' ? 'Đang xuất…' : 'Tải xuống dữ liệu'}
        </button>
        <AnimatePresence>
          {state.kind === 'exported' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-teal-300 text-xs mt-2 inline-flex items-center gap-1.5"
            >
              <IconCheck className="w-3.5 h-3.5" />
              Đã xuất {state.count} chuyến đi.
            </motion.p>
          )}
          {state.kind === 'export-failed' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-rose-400 text-xs mt-2"
            >
              Xuất thất bại: {state.error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <hr className="border-white/5" />

      <div>
        <p className="text-white font-semibold text-sm mb-1 inline-flex items-center gap-2">
          <IconTrash className="w-4 h-4 text-rose-300" />
          Yêu cầu xoá tài khoản
        </p>
        <p className="text-slate-400 text-xs leading-relaxed mb-3">
          Xoá toàn bộ dữ liệu của bạn trên hệ thống MoodTrip. Hành động này không thể hoàn tác.
          Theo Nghị định 13/2023/NĐ-CP, dữ liệu sẽ được xoá trong vòng 30 ngày.
        </p>
        {state.kind === 'confirming-deletion' ? (
          <div className="space-y-2">
            <p className="text-rose-300 text-xs">
              Bạn chắc chứ? Toàn bộ {user.email ? `(${user.email})` : 'tài khoản'} sẽ biến mất.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg"
              >
                Xoá vĩnh viễn
              </button>
              <button
                onClick={() => setState({ kind: 'idle' })}
                className="px-3 py-2 text-slate-400 hover:text-white text-xs"
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : state.kind === 'deleted' ? (
          <p className="text-rose-200 text-xs inline-flex items-center gap-1.5">
            <IconCheck className="w-4 h-4" aria-hidden="true" /> Tài khoản đã được xoá. Hẹn gặp lại nếu bạn quay lại.
          </p>
        ) : (
          <button
            onClick={() => setState({ kind: 'confirming-deletion' })}
            disabled={state.kind === 'deleting'}
            className="px-4 py-2 border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 text-xs font-semibold rounded-xl disabled:opacity-60"
          >
            {state.kind === 'deleting' ? 'Đang xoá…' : 'Yêu cầu xoá tài khoản'}
          </button>
        )}
        {state.kind === 'delete-failed' && (
          <p className="text-rose-400 text-xs mt-2">Xoá thất bại: {state.error}</p>
        )}
      </div>
    </div>
  );
}
