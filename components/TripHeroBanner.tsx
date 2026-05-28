import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { ItineraryPlan, FormData, Mood } from '../types';
import { IconMapPin, IconClock, IconWallet, IconFire, IconSparkles, IconSmartphone } from './icons';

interface TripHeroBannerProps {
  itinerary: ItineraryPlan;
  formData: FormData | null;
  onShowReel?: () => void;
}

const MOOD_VOICE: Record<Mood, string> = {
  relax: 'thư giãn',
  explore: 'khám phá',
  nature: 'đắm mình trong thiên nhiên',
  romantic: 'lãng mạn',
  adventure: 'phiêu lưu',
  cultural: 'thấm văn hóa',
};

const MOOD_REASON: Record<Mood, (destination: string) => string> = {
  relax: (d) => `${d} có nhịp sống chậm rãi, đủ để bạn thở sâu và nghỉ ngơi thật sự.`,
  explore: (d) => `Mỗi góc phố ở ${d} đều có thứ để khám phá — không lặp lại một ngày nào.`,
  nature: (d) => `Thiên nhiên ${d} rất gần — bạn có thể chạm vào nó trong vòng vài phút từ trung tâm.`,
  romantic: (d) => `${d} là nơi của những bữa tối dưới đèn vàng và đi bộ bên nhau không cần nói gì.`,
  adventure: (d) => `${d} có đủ địa hình và trải nghiệm để adrenaline lên cao mỗi ngày.`,
  cultural: (d) => `${d} có lớp lịch sử dày, mỗi địa danh đều có một câu chuyện đáng nghe.`,
};

function moPersonaOpening(itinerary: ItineraryPlan, moods: Mood[]): string {
  const destination = itinerary.destination;
  const dayCount = itinerary.timeline.length;
  const primaryMood = moods[0];
  const moodVoice = primaryMood ? MOOD_VOICE[primaryMood] : 'khám phá';
  const greetings = [
    `Mơ đã chọn ${destination} cho bạn — ${dayCount} ngày để ${moodVoice}.`,
    `${destination} đang đợi bạn. Mơ vẽ sẵn ${dayCount} ngày, bạn chỉ việc đi.`,
    `Mơ tin ${destination} sẽ vừa ý bạn — ${dayCount} ngày được chăm chút từng giờ.`,
  ];
  const idx = (destination.length + dayCount) % greetings.length;
  return greetings[idx];
}

function deriveWhyReasons(itinerary: ItineraryPlan, formData: FormData | null): string[] {
  const reasons: string[] = [];
  const moods = formData?.moods || [];
  const destination = itinerary.destination;

  if (moods.length > 0) {
    const fn = MOOD_REASON[moods[0]];
    if (fn) reasons.push(fn(destination));
  }

  const trendingCount = itinerary.timeline
    .flatMap(d => d.schedule)
    .filter(s => s.is_trending).length;
  if (trendingCount > 0) {
    reasons.push(`${trendingCount} điểm đang trending — bạn ghé đúng lúc cộng đồng còn nhắc.`);
  }

  if (itinerary.food && itinerary.food.length >= 3) {
    const firstFood = itinerary.food[0]?.name;
    reasons.push(`Ẩm thực được Mơ chọn lọc — bắt đầu với ${firstFood} là đã đáng đi rồi.`);
  }

  if (itinerary.budget_summary && formData?.budget) {
    const totalStr = itinerary.budget_summary.total_estimated.replace(/[^\d]/g, '');
    const totalNum = parseInt(totalStr, 10);
    if (!Number.isNaN(totalNum) && totalNum > 0 && totalNum <= formData.budget * (formData.duration?.days || 1)) {
      reasons.push(`Hành trình nằm gọn trong ngân sách bạn đặt — không phá ví.`);
    }
  }

  if (reasons.length < 3 && itinerary.timeline.length > 0) {
    const totalActivities = itinerary.timeline.reduce((sum, d) => sum + d.schedule.length, 0);
    reasons.push(`${totalActivities} hoạt động được sắp theo nhịp tự nhiên — không vội, không phí giờ.`);
  }

  if (reasons.length < 3) {
    reasons.push(`Mỗi ngày có thời tiết, giá cả và mẹo di chuyển riêng — bạn không phải tự tra cứu thêm.`);
  }

  return reasons.slice(0, 3);
}

function computeVitals(itinerary: ItineraryPlan) {
  const totalActivities = itinerary.timeline.reduce((sum, d) => sum + d.schedule.length, 0);
  const trendingCount = itinerary.timeline
    .flatMap(d => d.schedule)
    .filter(s => s.is_trending).length;
  return {
    days: itinerary.timeline.length,
    activities: totalActivities,
    trending: trendingCount,
    totalCost: itinerary.budget_summary?.total_estimated || null,
  };
}

export const TripHeroBanner: React.FC<TripHeroBannerProps> = ({ itinerary, formData, onShowReel }) => {
  const opening = useMemo(
    () => moPersonaOpening(itinerary, formData?.moods || []),
    [itinerary, formData]
  );
  const reasons = useMemo(
    () => deriveWhyReasons(itinerary, formData),
    [itinerary, formData]
  );
  const vitals = useMemo(() => computeVitals(itinerary), [itinerary]);

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-teal-500/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-700 to-indigo-900" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.4),transparent_50%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,200,100,0.5),transparent_55%)]" />

        <div className="relative p-7 sm:p-10 text-white">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold tracking-wide uppercase mb-4"
          >
            <IconSparkles className="w-3.5 h-3.5" />
            Hành trình từ Mơ
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
            className="text-4xl sm:text-5xl font-bold leading-tight mb-3 drop-shadow-md"
          >
            {itinerary.destination}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-base sm:text-lg italic text-white/90 max-w-2xl leading-relaxed mb-6"
          >
            “{opening}”
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
              <div className="flex items-center gap-1.5 text-white/70 text-[10px] uppercase tracking-wider font-semibold mb-1">
                <IconClock className="w-3 h-3" /> Số ngày
              </div>
              <div className="text-2xl font-bold tabular-nums">{vitals.days}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
              <div className="flex items-center gap-1.5 text-white/70 text-[10px] uppercase tracking-wider font-semibold mb-1">
                <IconMapPin className="w-3 h-3" /> Hoạt động
              </div>
              <div className="text-2xl font-bold tabular-nums">{vitals.activities}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
              <div className="flex items-center gap-1.5 text-white/70 text-[10px] uppercase tracking-wider font-semibold mb-1">
                <IconFire className="w-3 h-3" /> Trending
              </div>
              <div className="text-2xl font-bold tabular-nums">{vitals.trending}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
              <div className="flex items-center gap-1.5 text-white/70 text-[10px] uppercase tracking-wider font-semibold mb-1">
                <IconWallet className="w-3 h-3" /> Tổng dự kiến
              </div>
              <div className="text-base sm:text-lg font-bold leading-tight">{vitals.totalCost || '—'}</div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-sm sm:text-base text-white/85 max-w-2xl leading-relaxed"
          >
            {itinerary.overview}
          </motion.p>

          {onShowReel && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onShowReel}
              className="mt-5 inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold transition-colors"
            >
              <IconSmartphone className="w-4 h-4" />
              Tạo Reel để khoe bạn bè
            </motion.button>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        className="mt-4 grid sm:grid-cols-3 gap-3"
      >
        {reasons.map((reason, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + i * 0.1, duration: 0.45 }}
            className="relative p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-teal-400/30 hover:bg-white/[0.06] transition-all"
          >
            <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 text-xs font-bold flex items-center justify-center shadow-lg">
              {i + 1}
            </div>
            <p className="text-sm text-slate-200 leading-relaxed pl-2">{reason}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
