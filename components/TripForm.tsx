import React, { useState, useEffect, useMemo } from 'react';
import type { FormData, Mood, Duration, TripMode, ShortTripMood } from '../types';
import { MOOD_OPTIONS, SHORT_TRIP_MOOD_OPTIONS } from '../constants';
import { IconMapPin, IconWallet, IconChevronLeft, IconChevronRight, IconCalendar, IconCompass, IconSparkles, IconClock } from './icons';
import { Logo } from './Logo';
import { motion } from 'motion/react';

interface TripFormProps {
  onSubmit: (data: FormData) => void;
  onBack: () => void;
  onGoHome: () => void;
  error?: string | null;
  initialData?: FormData | null;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
});

const NumberStepper: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  icon: React.ReactNode;
}> = ({ value, onChange, min, max, label, icon }) => (
  <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06] hover:border-white/10 transition-colors">
    <div className="flex items-center gap-2.5">
      <span className="text-teal-400/70">{icon}</span>
      <span className="font-medium text-slate-300 text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      >
        <IconChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-bold text-xl text-white w-8 text-center tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      >
        <IconChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, onBack, error, initialData, onGoHome }) => {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState<Duration>({ days: 2, nights: 1 });
  const [budget, setBudget] = useState(3000000);
  const [moods, setMoods] = useState<Mood[]>(['explore']);
  const [personalNote, setPersonalNote] = useState('');
  const [tripMode, setTripMode] = useState<TripMode>('long');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('22:00');
  const [shortMoods, setShortMoods] = useState<ShortTripMood[]>([]);

  const handleTripModeChange = (mode: TripMode) => {
    setTripMode(mode);
    if (mode === 'short') {
      setBudget(500000);
    } else {
      setBudget(3000000);
    }
  };

  useEffect(() => {
    if (initialData) {
      setTripMode(initialData.tripMode || 'long');
      setStartLocation(initialData.startLocation || '');
      setDestination(initialData.destination);
      setDuration(initialData.duration);
      setBudget(initialData.budget);
      setMoods(initialData.moods || []);
      setShortMoods(initialData.shortMoods || []);
      setPersonalNote(initialData.personalNote || '');
      setStartDate(initialData.startDate || '');
      if (initialData.startTime) setStartTime(initialData.startTime);
      if (initialData.endTime) setEndTime(initialData.endTime);
    }
  }, [initialData]);

  const handleDaysChange = (newDays: number) => {
    const clampedDays = Math.max(1, Math.min(30, newDays));
    const newNights = Math.min(duration.nights, Math.max(0, clampedDays - 1));
    setDuration({ days: clampedDays, nights: newNights });
  };

  const handleNightsChange = (newNights: number) => {
    const clampedNights = Math.max(0, Math.min(duration.days > 0 ? duration.days - 1 : 0, newNights));
    setDuration({ ...duration, nights: clampedNights });
  };

  const handleBudgetChange = (value: number | string) => {
    const numericValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : value;
    if (!isNaN(numericValue)) {
      setBudget(Math.max(0, numericValue));
    } else if (value === '') {
      setBudget(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      tripMode,
      startLocation: tripMode === 'short' ? '' : startLocation,
      destination,
      startDate: tripMode === 'short' ? '' : startDate,
      duration: tripMode === 'short' ? { days: 0, nights: 0 } : duration,
      startTime: tripMode === 'short' ? startTime : undefined,
      endTime: tripMode === 'short' ? endTime : undefined,
      budget,
      moods: tripMode === 'short' ? [] : moods,
      shortMoods: tripMode === 'short' ? shortMoods : undefined,
      personalNote,
    });
  };

  const personalNotePlaceholder = useMemo(() => {
    const hints: string[] = [];

    if (tripMode === 'short') {
      const shortMoodHints: Record<string, string[]> = {
        date: ['muốn ăn tối lãng mạn', 'thích nơi yên tĩnh riêng tư', 'muốn xem hoàng hôn'],
        cafe: ['thích quán có view đẹp', 'muốn chỗ yên tĩnh để nói chuyện', 'thích quán mới khai trương'],
        food_tour: ['muốn thử bún chả Hà Nội', 'thích đồ ăn vặt', 'muốn ăn hải sản tươi'],
        nightlife: ['thích rooftop bar', 'muốn nghe nhạc live', 'thích cocktail'],
        fun: ['muốn chơi boardgame', 'thích karaoke', 'muốn thử escape room'],
        chill: ['muốn đi dạo bờ sông', 'thích ngồi công viên', 'muốn ngắm thành phố về đêm'],
      };
      if (shortMoods.length > 0) {
        for (const m of shortMoods) {
          const arr = shortMoodHints[m];
          if (arr) hints.push(arr[Math.floor(Math.random() * arr.length)]);
        }
      }
      if (destination) {
        hints.push(`khám phá ${destination}`);
      }
      if (hints.length === 0) {
        return 'VD: Muốn ăn tối lãng mạn, thích quán cà phê view đẹp, muốn đi dạo...';
      }
      return `VD: ${hints.slice(0, 3).join(', ')}...`;
    }

    const moodHints: Record<string, string[]> = {
      relax: ['muốn được massage thư giãn', 'thích ngâm hồ bơi', 'muốn ngủ nướng buổi sáng'],
      explore: ['thích khám phá phố cổ', 'muốn thử đồ ăn đường phố', 'thích đi chợ đêm'],
      nature: ['muốn leo núi buổi sáng', 'thích ngắm hoàng hôn', 'muốn cắm trại qua đêm'],
      romantic: ['muốn ăn tối nến', 'thích đi dạo dưới ánh trăng', 'muốn chụp ảnh cặp đôi'],
      adventure: ['muốn thử nhảy dù', 'thích lặn biển', 'muốn đi xe địa hình'],
      cultural: ['muốn tham quan bảo tàng', 'thích xem biểu diễn truyền thống', 'muốn học nấu ăn địa phương'],
    };

    if (moods.length > 0) {
      for (const m of moods) {
        const arr = moodHints[m];
        if (arr) hints.push(arr[Math.floor(Math.random() * arr.length)]);
      }
    }

    if (destination) {
      hints.push(`khám phá ẩm thực ${destination}`);
    }

    if (budget < 2000000) {
      hints.push('ưu tiên địa điểm miễn phí');
    } else if (budget >= 10000000) {
      hints.push('trải nghiệm cao cấp');
    }

    if (hints.length === 0) {
      return 'VD: Muốn sáng chạy bộ, tối ăn hải sản, thích check-in quán cà phê đẹp...';
    }

    return `VD: ${hints.slice(0, 3).join(', ')}...`;
  }, [tripMode, moods, shortMoods, destination, budget]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <motion.div {...fadeUp(0)} className="text-center mb-8">
          <Logo className="text-white inline-flex mb-5" onClick={onGoHome} />
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-shadow-md">
            {tripMode === 'short' ? 'Kế hoạch ngắn hạn' : 'Lên kế hoạch cho chuyến đi'}
          </h2>
          <p className="text-slate-300 mt-3 text-lg text-shadow-sm">
            {tripMode === 'short'
              ? 'Lên kế hoạch ngắn gọn cho buổi hẹn hò hoặc khám phá thành phố'
              : 'Chọn phong cách, để AI thiết kế hành trình hoàn hảo cho bạn'}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-2xl"
            role="alert"
          >
            <p className="font-semibold">Lỗi</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Section */}
          <motion.div {...fadeUp(0.1)} className="glass-dark p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <IconCompass className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Địa điểm</h3>
            </div>

            <div className={`grid gap-4 ${tripMode === 'short' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {tripMode === 'long' && (
                <div>
                  <label htmlFor="startLocation" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Nơi khởi hành</label>
                  <div className="relative group">
                    <IconMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="text"
                      id="startLocation"
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      placeholder="Thành phố (tùy chọn)"
                      className="w-full pl-10 pr-4 py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm"
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="destination" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                  {tripMode === 'short' ? 'Thành phố' : 'Điểm đến'}
                </label>
                <div className="relative group">
                  <IconMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="text"
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={tripMode === 'short' ? 'VD: Hà Nội, Sài Gòn, Đà Nẵng...' : 'Địa điểm (hoặc để AI gợi ý)'}
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Date & Duration Section */}
          <motion.div {...fadeUp(0.2)} className="glass-dark p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <IconCalendar className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Thời gian</h3>
            </div>

            {/* Trip Mode Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                onClick={() => handleTripModeChange('long')}
                whileTap={{ scale: 0.97 }}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  tripMode === 'long'
                    ? 'bg-teal-400/15 text-teal-300 border border-teal-400/40 shadow-lg shadow-teal-400/10'
                    : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                Dài hạn
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handleTripModeChange('short')}
                whileTap={{ scale: 0.97 }}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  tripMode === 'short'
                    ? 'bg-teal-400/15 text-teal-300 border border-teal-400/40 shadow-lg shadow-teal-400/10'
                    : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                Ngắn hạn
              </motion.button>
            </div>

            {tripMode === 'long' ? (
              <>
                <div>
                  <label htmlFor="startDate" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Ngày khởi hành (tùy chọn)</label>
                  <div className="relative group">
                    <IconCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full pl-10 pr-4 py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberStepper label="Ngày" value={duration.days} onChange={handleDaysChange} min={1} max={30} icon={<IconCalendar className="w-4 h-4" />} />
                  <NumberStepper label="Đêm" value={duration.nights} onChange={handleNightsChange} min={0} max={duration.days > 0 ? duration.days - 1 : 0} icon={<IconCalendar className="w-4 h-4" />} />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Giờ bắt đầu</label>
                  <div className="relative group">
                    <IconClock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Giờ kết thúc</label>
                  <div className="relative group">
                    <IconClock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="time"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Budget Section */}
          <motion.div {...fadeUp(0.3)} className="glass-dark p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <IconWallet className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Ngân sách mỗi người</h3>
            </div>

            <div className="text-center py-2">
              <span className="text-4xl md:text-5xl font-bold text-white tabular-nums tracking-tight">
                {budget > 0 ? budget.toLocaleString('vi-VN') : '0'}
              </span>
              <span className="text-lg text-slate-500 ml-2 font-medium">VND</span>
            </div>

            <div className="px-1">
              <input
                type="range"
                id="budget"
                min={tripMode === 'short' ? '100000' : '500000'}
                max={tripMode === 'short' ? '5000000' : '20000000'}
                step={tripMode === 'short' ? '100000' : '500000'}
                value={budget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer custom-range"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-600">{tripMode === 'short' ? '100K' : '500K'}</span>
                <span className="text-xs text-slate-600">{tripMode === 'short' ? '5M' : '20M'}</span>
              </div>
            </div>

            <div className="relative group">
              <IconWallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
              <input
                type="text"
                value={budget > 0 ? budget.toLocaleString('vi-VN') : ''}
                onChange={(e) => handleBudgetChange(e.target.value)}
                placeholder="Nhập số tiền"
                className="w-full pl-10 pr-16 py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all font-semibold outline-none text-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-medium text-xs uppercase tracking-wider">VND</span>
            </div>
          </motion.div>

          {/* Mood Section */}
          <motion.div {...fadeUp(0.4)} className="glass-dark p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <IconSparkles className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{tripMode === 'short' ? 'Phong cách' : 'Tâm trạng của bạn'}</h3>
            </div>
            <p className="text-xs text-slate-500">Chọn một hoặc nhiều tâm trạng phù hợp</p>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {(tripMode === 'short' ? SHORT_TRIP_MOOD_OPTIONS : MOOD_OPTIONS).map((opt) => {
                const isSelected = tripMode === 'short'
                  ? shortMoods.includes(opt.id as ShortTripMood)
                  : moods.includes(opt.id as Mood);
                return (
                  <motion.button
                    type="button"
                    key={opt.id}
                    onClick={() => {
                      if (tripMode === 'short') {
                        setShortMoods((prev) =>
                          prev.includes(opt.id as ShortTripMood)
                            ? prev.filter((m) => m !== opt.id)
                            : [...prev, opt.id as ShortTripMood]
                        );
                      } else {
                        setMoods((prev) =>
                          prev.includes(opt.id as Mood)
                            ? prev.filter((m) => m !== opt.id)
                            : [...prev, opt.id as Mood]
                        );
                      }
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative p-4 text-center rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? 'border-teal-400/60 bg-teal-400/10 shadow-lg shadow-teal-400/10'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId={`moodGlow-${opt.id}`}
                        className="absolute inset-0 rounded-2xl bg-teal-400/5 border border-teal-400/30"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className={`flex justify-center items-center h-10 md:h-12 relative z-10 ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>
                      {opt.icon}
                    </div>
                    <p className={`font-medium mt-1.5 text-xs relative z-10 ${isSelected ? 'text-teal-300' : 'text-slate-500'}`}>
                      {opt.label}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* Personal Note */}
            <div className="pt-2">
              <label htmlFor="personalNote" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                Ý kiến cá nhân (tùy chọn)
              </label>
              <textarea
                id="personalNote"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder={personalNotePlaceholder}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm resize-none"
              />
              <p className="text-right text-[10px] text-slate-600 mt-1">{personalNote.length}/500</p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div {...fadeUp(0.5)} className="flex flex-col gap-3 pt-2">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01, boxShadow: '0 0 40px rgba(13, 148, 136, 0.2)' }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 gradient-nature text-white font-bold text-lg rounded-2xl shadow-lg shadow-teal-500/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <IconSparkles className="w-5 h-5" />
              {tripMode === 'short' ? 'Khám phá ngay' : 'Tạo hành trình'}
            </motion.button>

            <motion.button
              type="button"
              onClick={onBack}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 text-slate-500 font-medium rounded-xl hover:bg-white/[0.03] hover:text-slate-400 transition-all flex items-center justify-center gap-1.5"
            >
              <IconChevronLeft className="w-4 h-4" />
              Quay lại
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};
