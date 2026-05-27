import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX } from './icons';
import type { ItineraryPlan } from '../types';
import { buildDoodleSvg, composeMoLetter, type MoLetter } from '../services/moNotebook';

interface MoNotebookModalProps {
  open: boolean;
  trip: ItineraryPlan | null;
  onClose: () => void;
}

export function MoNotebookModal({ open, trip, onClose }: MoNotebookModalProps) {
  const [letter, setLetter] = useState<MoLetter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !trip) return;
    setLoading(true);
    setError(null);
    setLetter(null);
    composeMoLetter(trip)
      .then(setLetter)
      .catch((err: Error) => {
        if (err.message === 'RATE_LIMIT_EXCEEDED') {
          setError('Hôm nay Mơ hết hạn ngạch viết thư rồi. Quay lại ngày mai nhé.');
        } else if (err.message === 'BUDGET_EXCEEDED') {
          setError('Mơ đang nghỉ. Quay lại ngày mai nhé.');
        } else {
          setError('Mơ chưa viết được thư lần này. Thử lại sau.');
        }
      })
      .finally(() => setLoading(false));
  }, [open, trip]);

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
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-amber-200/20"
          style={{
            background: 'linear-gradient(180deg, #fefcf6 0%, #fff8e7 100%)',
            color: '#3f2e1c',
            fontFamily: 'Caveat, "Be Vietnam Pro", cursive',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-amber-700/60 hover:bg-amber-100"
          >
            <IconX className="w-5 h-5" />
          </button>

          <div className="p-8" id="mo-letter-content">
            {loading && (
              <p className="text-center text-amber-700 text-lg" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                Mơ đang viết thư cho bạn…
              </p>
            )}
            {error && (
              <p className="text-rose-600 text-base" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                {error}
              </p>
            )}
            {letter && (
              <>
                <p className="text-2xl mb-4 leading-snug">{letter.greeting}</p>
                {letter.body.map((para, idx) => (
                  <p key={idx} className="text-lg mb-3 leading-relaxed">
                    {para}
                  </p>
                ))}
                <p className="text-xl mt-6">{letter.signoff}</p>
                <p className="text-2xl mt-1">— Mơ</p>
                <div
                  className="mt-6 flex justify-center"
                  dangerouslySetInnerHTML={{ __html: buildDoodleSvg(letter.doodleSeed) }}
                />
              </>
            )}
          </div>

          {letter && (
            <div className="px-6 pb-6 flex gap-2" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
              <button
                onClick={() => printLetter()}
                className="flex-1 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-xl"
              >
                In / Lưu PDF
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-amber-700 text-sm hover:bg-amber-100 rounded-xl"
              >
                Đóng
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function printLetter(): void {
  const node = document.getElementById('mo-letter-content');
  if (!node) return;
  const win = window.open('', 'mo-letter', 'width=600,height=800');
  if (!win) return;
  win.document.write(`
    <!doctype html>
    <html><head><title>Thư của Mơ</title>
    <style>
      body { font-family: Caveat, "Be Vietnam Pro", cursive; background: #fefcf6; color: #3f2e1c; padding: 48px; max-width: 600px; margin: 0 auto; }
      p { font-size: 20px; line-height: 1.6; margin: 0 0 12px; }
      svg { display: block; margin: 24px auto; }
    </style></head><body>${node.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
