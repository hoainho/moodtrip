import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX } from './icons';
import {
  PROVINCE_LANDMARKS,
  buildQueSeed,
  buildQuePersonalNote,
  type Province,
} from '../services/duongVeQue';
import type { FormData } from '../types';

interface DuongVeQueModalProps {
  open: boolean;
  onClose: () => void;
  onSeed: (prefill: Partial<FormData>) => void;
}

export function DuongVeQueModal({ open, onClose, onSeed }: DuongVeQueModalProps) {
  const [query, setQuery] = useState('');
  const provinces = useMemo(
    () =>
      PROVINCE_LANDMARKS.filter((p) =>
        p.province.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  function handlePick(province: Province) {
    const seed = buildQueSeed(province);
    if (!seed) return;
    onSeed({
      destination: seed.province,
      personalNote: buildQuePersonalNote(seed),
      moods: ['cultural', 'relax'],
    });
    onClose();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="relative w-full max-w-md max-h-[80vh] rounded-3xl glass-dark border border-white/10 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <IconX className="w-5 h-5" />
          </button>

          <div className="p-6 pb-4">
            <p className="text-teal-400 text-xs uppercase tracking-wider mb-2">Đường về quê</p>
            <h2 className="text-2xl font-bold text-white mb-2">Quê bạn ở đâu?</h2>
            <p className="text-slate-400 text-sm mb-4">
              Mơ sẽ gợi ý một chuyến về thăm quê — không phải tour du khách, mà là về với cảm giác.
            </p>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tỉnh / thành phố…"
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 text-sm"
            />
          </div>

          <ul className="px-3 pb-6 overflow-y-auto flex-1">
            {provinces.length === 0 && (
              <li className="px-4 py-2 text-slate-500 text-sm">
                Không có tỉnh phù hợp. Mơ chưa biết về quê này — gửi cho team nhé.
              </li>
            )}
            {provinces.map((p) => (
              <li key={p.province}>
                <button
                  onClick={() => handlePick(p.province)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <p className="text-white font-medium">{p.province}</p>
                  <p className="text-slate-500 text-xs">
                    {p.signatureLandmarks.slice(0, 2).join(' · ')}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
