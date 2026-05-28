import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CONSENT_SCOPES, readLocalConsent, recordConsent } from '../services/consent';
import { useAuth } from '../services/useAuth';

export function ConsentBanner() {
  const { user } = useAuth();
  const [needsConsent, setNeedsConsent] = useState(false);
  const descriptionId = 'consent-description';
  const acceptBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const stored = readLocalConsent();
    setNeedsConsent(!stored);
  }, []);

  useEffect(() => {
    if (needsConsent) {
      const t = window.setTimeout(() => acceptBtnRef.current?.focus(), 400);
      return () => window.clearTimeout(t);
    }
  }, [needsConsent]);

  if (!needsConsent) return null;

  async function accept() {
    await recordConsent([...CONSENT_SCOPES], { userId: user?.id ?? null });
    setNeedsConsent(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[60] px-4 pt-4 pb-safe-plus-4 bg-slate-950/95 border-t border-white/10 backdrop-blur-md"
        role="dialog"
        aria-modal="false"
        aria-label="Đồng ý xử lý dữ liệu"
        aria-describedby={descriptionId}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm text-slate-300">
            <p className="font-medium text-white mb-1.5">Bạn có đồng ý cho MoodTrip xử lý dữ liệu?</p>
            <p id={descriptionId} className="text-sm text-slate-300 leading-relaxed">
              Chúng tôi gửi nội dung trò chuyện của bạn đến dịch vụ AI (Google Gemini, có thể nằm
              ngoài Việt Nam) để tạo lịch trình, dùng cookie/LocalStorage để lưu lịch trình, và đo
              lường ẩn danh để cải tiến sản phẩm. Theo Nghị định 13/2023/NĐ-CP, bạn có quyền yêu
              cầu xóa dữ liệu bất kỳ lúc nào.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              ref={acceptBtnRef}
              onClick={accept}
              className="min-h-[44px] px-5 py-3 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Tôi đồng ý
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
