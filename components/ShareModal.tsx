import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { IconX, IconCopy, IconCheck, IconShare, IconMapPin, IconFood, IconCalendar } from './icons';
import { generateShareUrl } from '../services/shareService';
import { getQrCodeUrl } from '../services/qrCode';
import type { ItineraryPlan } from '../types';

interface ShareModalProps {
  itinerary: ItineraryPlan;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ itinerary, onClose }) => {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateShareUrl(itinerary)
      .then((url) => {
        setShareUrl(url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [itinerary]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = shareUrl ? getQrCodeUrl(shareUrl, 200) : null;

  const dayCount = itinerary.timeline.length;
  const foodCount = itinerary.food.length;
  const topFoods = itinerary.food.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative glass-dark rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <IconX className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-full gradient-nature flex-shrink-0">
            <IconShare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Chia sẻ chuyến đi</h3>
            <p className="text-xs text-slate-400">{itinerary.destination}</p>
          </div>
        </div>

        {/* Trip Preview Card */}
        <div className="gradient-ocean rounded-2xl p-4 mb-5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <IconMapPin className="w-4 h-4 text-white/70 flex-shrink-0" />
            <h4 className="text-base font-bold text-white truncate">{itinerary.destination}</h4>
          </div>
          <p className="text-xs text-white/60 leading-relaxed line-clamp-2 mb-3">{itinerary.overview}</p>

          {/* Stats row */}
          <div className="flex gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/5">
              <IconCalendar className="w-3 h-3 text-white/60" />
              <span className="text-xs font-semibold text-white">{dayCount}</span>
              <span className="text-[10px] text-white/50">ngày</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/5">
              <IconFood className="w-3 h-3 text-white/60" />
              <span className="text-xs font-semibold text-white">{foodCount}</span>
              <span className="text-[10px] text-white/50">món</span>
            </div>
            {itinerary.budget_summary && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/5 flex-1 min-w-0">
                <span className="text-xs font-semibold text-teal-300 truncate">{itinerary.budget_summary.total_estimated}</span>
              </div>
            )}
          </div>

          {/* Food highlights */}
          {topFoods.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topFoods.map((food, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/5"
                >
                  {food.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="w-8 h-8 animate-spin text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : shareUrl ? (
          <>
            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <img
                  src={qrUrl!}
                  alt="QR Code"
                  width={180}
                  height={180}
                  className="rounded-xl"
                />
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mb-3">
              Quét mã QR hoặc sao chép link bên dưới
            </p>

            {/* Share URL */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10 overflow-hidden">
                <p className="text-xs text-slate-300 truncate font-mono">{shareUrl}</p>
              </div>
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 p-2.5 rounded-xl border transition-all ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-teal-500/20 text-teal-400 border-teal-500/30 hover:bg-teal-500/30'
                }`}
              >
                {copied ? <IconCheck className="w-5 h-5" /> : <IconCopy className="w-5 h-5" />}
              </motion.button>
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-red-400 py-8">
            Không thể tạo link chia sẻ. Vui lòng thử lại.
          </p>
        )}
      </motion.div>
    </div>
  );
};
