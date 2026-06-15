import { motion } from 'motion/react';
import { IconChevronLeft, IconHome, IconGlobe } from './icons';

interface PageNavActionsProps {
  onGoHome: () => void;
  /** Opens the "Đường về quê" modal. Omit to hide the action. */
  onOpenQue?: () => void;
  /** Opens the "Thế giới của bạn" scene. Omit to hide the action. */
  onOpenWorld?: () => void;
}

/**
 * Shared header action cluster for the standalone pages (Tips / About / Release).
 * These pages render their own sticky header, so the floating top-right "Về quê / Thế giới"
 * cluster from App is suppressed on them to avoid a duplicated navbar — those actions live
 * here instead, giving "Về quê" a proper place in each page's nav.
 */
export function PageNavActions({ onGoHome, onOpenQue, onOpenWorld }: PageNavActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {onOpenQue && (
        <button
          type="button"
          onClick={onOpenQue}
          aria-label="Đường về quê"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 text-xs sm:text-sm font-medium text-purple-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <IconHome className="w-4 h-4" />
          <span className="hidden sm:inline">Về quê</span>
        </button>
      )}
      {onOpenWorld && (
        <button
          type="button"
          onClick={onOpenWorld}
          aria-label="Thế giới của bạn"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <IconGlobe className="w-4 h-4" />
          <span className="hidden sm:inline">Thế giới</span>
        </button>
      )}
      <motion.button
        onClick={onGoHome}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center min-h-[44px] px-4 py-2 text-sm font-medium text-teal-400 hover:text-teal-300 rounded-lg hover:bg-white/5 transition-colors"
      >
        <IconChevronLeft className="w-5 h-5 mr-1" />
        <span className="hidden sm:inline">Quay lại trang chủ</span>
        <span className="sm:hidden">Trang chủ</span>
      </motion.button>
    </div>
  );
}
