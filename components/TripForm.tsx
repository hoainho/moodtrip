import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { FormData, Duration, TripMode } from '../types';
import { MOOD_SEED_GROUPS, SHORT_MOOD_SEED_GROUPS, seasonalMoodGroup, seedsToMoods, seedsToShortMoods, moodInputFromMoods } from '../constants';
import { useSetMoodSignal, estimateMoodIntensity } from '../hooks/useMoodTheme';
import { IconMapPin, IconWallet, IconChevronLeft, IconChevronRight, IconCalendar, IconCompass, IconSparkles, IconClock, IconInfo } from './icons';
import { Logo } from './Logo';
import { motion } from 'motion/react';

interface TripFormProps {
  onSubmit: (data: FormData) => void;
  onBack: () => void;
  onGoHome: () => void;
  error?: string | null;
  initialData?: Partial<FormData> | null;
  isSubmitting?: boolean;
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
  <div className="flex items-center justify-between p-3 md:p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06] hover:border-white/10 transition-colors">
    <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0">
      <span className="text-teal-400/70 hidden md:inline">{icon}</span>
      <span className="font-medium text-slate-300 text-xs md:text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-1 md:gap-2">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      >
        <IconChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </button>
      <span className="font-bold text-lg md:text-xl text-white w-6 md:w-8 text-center tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      >
        <IconChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </button>
    </div>
  </div>
);

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, onBack, error, initialData, onGoHome, isSubmitting = false }) => {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState<Duration>({ days: 2, nights: 1 });
  const [budget, setBudget] = useState(3000000);
  // Flexible, emotion-driven mood input (replaces the rigid 6-button picker).
  const [moodText, setMoodText] = useState('');
  const [moodSeeds, setMoodSeeds] = useState<string[]>([]);
  const [moodIntensity, setMoodIntensity] = useState(0.5);
  // Once the user drags the slider themselves, stop auto-tracking and respect their choice.
  const [intensityTouched, setIntensityTouched] = useState(false);
  const moodIntensityRef = useRef(moodIntensity);
  moodIntensityRef.current = moodIntensity;
  const [personalNote, setPersonalNote] = useState('');
  const [tripMode, setTripMode] = useState<TripMode>('long');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('22:00');
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Grouped, click-to-build seed suggestions. Long trips lead with a season-fitting group
  // (derived from the current month) so ideas feel timely (weather/mùa/trend).
  const seedGroups: { title: string; seeds: { label: string }[] }[] = useMemo(
    () => (tripMode === 'short'
      ? SHORT_MOOD_SEED_GROUPS
      : [seasonalMoodGroup(new Date().getMonth()), ...MOOD_SEED_GROUPS]),
    [tripMode],
  );

  // Publish the live emotion so the page atmosphere (accent, ambient, 3D light) reacts as the user types.
  const setMoodSignal = useSetMoodSignal();
  useEffect(() => {
    setMoodSignal({ text: moodText, seeds: moodSeeds, intensity: moodIntensity });
  }, [moodText, moodSeeds, moodIntensity, setMoodSignal]);

  // Auto-track: the "đậm nhạt cảm xúc" slider glides to match how strongly the user is writing —
  // until they grab it themselves. Eased rAF tween for smoothness (instant under reduced-motion).
  useEffect(() => {
    if (intensityTouched) return;
    const target = estimateMoodIntensity(moodText, moodSeeds);
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setMoodIntensity(target); return; }
    const from = moodIntensityRef.current;
    if (Math.abs(target - from) < 0.01) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 450);
      const eased = 1 - Math.pow(1 - k, 3);
      setMoodIntensity(from + (target - from) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moodText, moodSeeds, intensityTouched]);

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
      if (initialData.destination !== undefined) setDestination(initialData.destination);
      if (initialData.duration && typeof initialData.duration.days === 'number') {
        setDuration(initialData.duration);
      }
      if (typeof initialData.budget === 'number' && !Number.isNaN(initialData.budget)) {
        setBudget(initialData.budget);
      }
      // Hydrate flexible mood: prefer the new MoodInput; else migrate legacy enum moods into seeds.
      const seededMood = initialData.mood
        ?? moodInputFromMoods(initialData.moods, initialData.shortMoods);
      setMoodText(seededMood.text || '');
      setMoodSeeds(seededMood.seeds || []);
      setMoodIntensity(typeof seededMood.intensity === 'number' ? seededMood.intensity : 0.5);
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
      if (numericValue > 0) setBudgetError(null);
    } else if (value === '') {
      setBudget(0);
    }
  };

  // Toggle a seed suggestion: keep `moodSeeds` in sync and mirror the label into the free-text
  // field (append on select, strip on deselect) — the textarea stays the source of truth the user edits.
  // Pure click-to-select: tapping a chip just toggles it (no typing). The free-text box stays a
  // separate, optional way to add nuance.
  const toggleSeed = (label: string) => {
    setMoodSeeds((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mood is now optional — empty input is valid (the prompt builds a balanced fallback).
    if (budget <= 0) {
      setBudgetError('Ngân sách phải lớn hơn 0');
      return;
    }
    setBudgetError(null);

    const mood = { text: moodText.trim(), seeds: moodSeeds, intensity: moodIntensity };

    onSubmit({
      tripMode,
      startLocation: tripMode === 'short' ? '' : startLocation,
      destination,
      startDate: tripMode === 'short' ? '' : startDate,
      duration: tripMode === 'short' ? { days: 0, nights: 0 } : duration,
      startTime: tripMode === 'short' ? startTime : undefined,
      endTime: tripMode === 'short' ? endTime : undefined,
      budget,
      mood,
      // Derive the internal taxonomy from seeds so card-pull / preferences / 3D world keep working.
      moods: tripMode === 'short' ? [] : seedsToMoods(moodSeeds),
      shortMoods: tripMode === 'short' ? seedsToShortMoods(moodSeeds) : undefined,
      personalNote,
    });
  };

  // Mood now carries the emotional intent; this note is for concrete constraints/preferences.
  const personalNotePlaceholder =
    'VD: đi cùng trẻ nhỏ, không ăn cay, tránh leo trèo nhiều, thích chỗ yên tĩnh, cần gần trung tâm...';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        {/* Header — scrim layer (index.css) keeps the title/subtitle readable over the 3D scene. */}
        <motion.div {...fadeUp(0)} className="text-scrim text-center mb-8">
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
                  <label htmlFor="startLocation" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Nơi khởi hành</label>
                  <div className="relative group">
                    <IconMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
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
                <label htmlFor="destination" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  {tripMode === 'short' ? 'Thành phố' : 'Điểm đến'}
                </label>
                <div className="relative group">
                  <IconMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
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
                  <label htmlFor="startDate" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Ngày khởi hành (tùy chọn)</label>
                  <div className="relative group">
                    <IconCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
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
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <NumberStepper label="Ngày" value={duration.days} onChange={handleDaysChange} min={1} max={30} icon={<IconCalendar className="w-4 h-4" />} />
                  <NumberStepper label="Đêm" value={duration.nights} onChange={handleNightsChange} min={0} max={duration.days > 0 ? duration.days - 1 : 0} icon={<IconCalendar className="w-4 h-4" />} />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="min-w-0">
                  <label htmlFor="startTime" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Giờ bắt đầu</label>
                  <div className="relative group">
                    <IconClock className="absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2 w-4 md:w-4.5 h-4 md:h-4.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full pl-8 md:pl-10 pr-2 md:pr-4 py-3 md:py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label htmlFor="endTime" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Giờ kết thúc</label>
                  <div className="relative group">
                    <IconClock className="absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2 w-4 md:w-4.5 h-4 md:h-4.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="time"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full pl-8 md:pl-10 pr-2 md:pr-4 py-3 md:py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm"
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
              <span className="text-lg text-slate-400 ml-2 font-medium">VND</span>
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
                className="w-full cursor-pointer custom-range"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-400">{tripMode === 'short' ? '100K' : '500K'}</span>
                <span className="text-xs text-slate-400">{tripMode === 'short' ? '5M' : '20M'}</span>
              </div>
            </div>

            <div className="relative group">
              <IconWallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
              <input
                type="text"
                value={budget > 0 ? budget.toLocaleString('vi-VN') : ''}
                onChange={(e) => handleBudgetChange(e.target.value)}
                placeholder="Nhập số tiền"
                className="w-full pl-10 pr-16 py-3.5 bg-white/[0.03] text-white border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30 focus:bg-white/[0.05] transition-all font-semibold outline-none text-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs uppercase tracking-wider">VND</span>
            </div>

            {budgetError && (
              <p role="alert" aria-live="polite" className="text-red-400 text-xs font-medium">
                {budgetError}
              </p>
            )}
          </motion.div>

          {/* Mood Section — the emotional hero of the form (flexible, not a fixed taxonomy) */}
          <motion.div {...fadeUp(0.4)} className="relative glass-dark p-6 md:p-8 space-y-5 overflow-hidden ring-1 ring-[color:var(--mood-accent)]/25">
            {/* Soft warm glow — reacts to --mood-accent at runtime (S1) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-12 w-56 h-56 rounded-full blur-3xl opacity-25"
              style={{ background: 'var(--mood-accent)' }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <IconSparkles className="w-5 h-5" style={{ color: 'var(--mood-accent)' }} />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Tâm trạng của bạn</h3>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {tripMode === 'short' ? 'Tối nay, lòng bạn muốn gì?' : 'Hôm nay, lòng bạn thế nào?'}
              </h2>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                Chạm vài gợi ý bên dưới là Mơ hiểu ngay — không cần gõ nhiều. Thích thì kể thêm bằng lời.
              </p>
            </div>

            {/* Click-to-build mood chips — grouped by tâm trạng / không gian / kiểu đi, dẫn đầu là gợi ý
                hợp mùa (theo thời tiết & trend). Tap để soạn chuyến đi mà không cần gõ. */}
            <div className="space-y-3.5">
              {seedGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.seeds.map((seed) => {
                      const active = moodSeeds.includes(seed.label);
                      return (
                        <motion.button
                          type="button"
                          key={seed.label}
                          aria-pressed={active}
                          onClick={() => toggleSeed(seed.label)}
                          whileTap={{ scale: 0.94 }}
                          className={`px-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
                            active
                              ? 'text-white'
                              : 'text-slate-300 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:text-white'
                          }`}
                          style={active ? { borderColor: 'var(--mood-accent)', background: 'var(--mood-accent-soft)' } : undefined}
                        >
                          {seed.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Intensity — with an info tooltip since "đậm nhạt cảm xúc" is otherwise vague. */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                  Đậm nhạt cảm xúc
                  <span className="relative inline-flex group">
                    <button
                      type="button"
                      aria-label="Đậm nhạt cảm xúc nghĩa là gì?"
                      className="inline-flex items-center justify-center text-slate-400 hover:text-white focus-visible:text-white transition-colors"
                    >
                      <IconInfo className="w-4 h-4" />
                    </button>
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 px-3 py-2 rounded-xl bg-slate-900/95 border border-white/15 text-[11px] leading-relaxed text-slate-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shadow-xl z-20"
                    >
                      Mức cảm xúc này chi phối lịch trình ra sao: <b className="text-white">Nhẹ</b> chỉ là chút gia vị, <b className="text-white">Mạnh</b> sẽ dẫn dắt cả chuyến đi. Mơ tự đoán theo lựa chọn của bạn — kéo để chỉnh lại.
                    </span>
                  </span>
                  {!intensityTouched && <span className="text-slate-400 font-normal">· Mơ đang tự cảm</span>}
                </span>
                <span className="text-xs font-semibold transition-colors" style={{ color: 'var(--mood-accent)' }}>
                  {moodIntensity <= 0.33 ? 'Nhẹ nhàng' : moodIntensity >= 0.66 ? 'Mãnh liệt' : 'Vừa phải'}
                </span>
              </div>
              <input
                type="range"
                id="moodIntensity"
                min={0}
                max={1}
                step={0.01}
                value={moodIntensity}
                onChange={(e) => { setIntensityTouched(true); setMoodIntensity(Number(e.target.value)); }}
                aria-label="Mức độ đậm nhạt của cảm xúc, từ nhẹ đến mạnh"
                className="w-full cursor-pointer custom-range"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-slate-400">Nhẹ nhàng</span>
                <span className="text-xs text-slate-400">Mạnh mẽ</span>
              </div>
            </div>

            {/* Optional free-text — secondary; for nuance beyond the chips. */}
            <div className="relative">
              <label htmlFor="moodText" className="block text-xs font-medium text-slate-300 mb-1.5">
                Muốn nói thêm bằng lời? <span className="text-slate-400">(không bắt buộc)</span>
              </label>
              <textarea
                id="moodText"
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                placeholder={tripMode === 'short'
                  ? 'VD: đi cùng người thương, thích quán ít khách...'
                  : 'VD: đi cùng người thương, thích nơi ít khách, có chút phiêu lưu nhẹ...'}
                rows={2}
                maxLength={400}
                className="w-full px-4 py-3 bg-white/[0.04] text-white border border-white/10 rounded-xl focus:ring-1 focus:ring-[color:var(--mood-accent)]/50 focus:border-[color:var(--mood-accent)]/40 focus:bg-white/[0.06] transition-all placeholder-white/25 outline-none text-sm leading-relaxed resize-none"
              />
            </div>

            {/* Extra notes / constraints (was "Ý kiến cá nhân") */}
            <div className="pt-1">
              <label htmlFor="personalNote" className="block text-xs font-medium text-slate-300 mb-1.5">
                Ghi chú thêm <span className="text-slate-400">(ràng buộc, sở thích — tùy chọn)</span>
              </label>
              <textarea
                id="personalNote"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder={personalNotePlaceholder}
                rows={2}
                maxLength={500}
                className="w-full px-4 py-3 bg-white/[0.03] text-white border border-white/[0.08] rounded-xl focus:ring-1 focus:ring-[color:var(--mood-accent)]/40 focus:border-[color:var(--mood-accent)]/30 focus:bg-white/[0.05] transition-all placeholder-white/20 outline-none text-sm resize-none"
              />
              <p className="text-right text-[10px] text-slate-400 mt-1">{personalNote.length}/500</p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div {...fadeUp(0.5)} className="flex flex-col gap-3 pt-2">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={isSubmitting ? {} : { scale: 1.01, boxShadow: '0 0 40px rgba(13, 148, 136, 0.2)' }}
              whileTap={isSubmitting ? {} : { scale: 0.99 }}
              className={`w-full py-4 gradient-nature text-white font-bold text-lg rounded-2xl shadow-lg shadow-teal-500/20 transition-all duration-300 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <IconSparkles className="w-5 h-5" />
              {isSubmitting ? 'Đang xử lý...' : (tripMode === 'short' ? 'Khám phá ngay' : 'Tạo hành trình')}
            </motion.button>

            <motion.button
              type="button"
              onClick={onBack}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 text-slate-400 font-medium rounded-xl hover:bg-white/[0.03] hover:text-slate-400 transition-all flex items-center justify-center gap-1.5"
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
