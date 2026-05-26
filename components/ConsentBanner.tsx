import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CONSENT_SCOPES, readLocalConsent, recordConsent } from '../services/consent';
import { useAuth } from '../services/useAuth';

export function ConsentBanner() {
  const { user } = useAuth();
  const [needsConsent, setNeedsConsent] = useState(false);

  useEffect(() => {
    const stored = readLocalConsent();
    setNeedsConsent(!stored);
  }, []);

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
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-950/95 border-t border-white/10 backdrop-blur-md"
        role="dialog"
        aria-label="Đồng ý xử lý dữ liệu"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm text-slate-300">
            <p className="font-medium text-white mb-1">Bạn có đồng ý cho MoodTrip xử lý dữ liệu?</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chúng tôi gửi nội dung trò chuyện của bạn đến dịch vụ AI (Google Gemini, có thể nằm
              ngoài Việt Nam) để tạo lịch trình, dùng cookie/LocalStorage để lưu lịch trình, và đo
              lường ẩn danh để cải tiến sản phẩm. Theo Nghị định 13/2023/NĐ-CP, bạn có quyền yêu
              cầu xóa dữ liệu bất kỳ lúc nào.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={accept}
              className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl"
            >
              Tôi đồng ý
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
