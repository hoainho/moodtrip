import React, { useState, useEffect } from 'react';
import type { FormData, Mood, Duration } from '../types';
import { MOOD_OPTIONS } from '../constants';
import { IconMapPin, IconWallet, IconSun, IconMoon, IconChevronLeft, IconChevronRight, IconCalendar } from './icons';
import { Logo } from './Logo';

interface TripFormProps {
  onSubmit: (data: FormData) => void;
  onBack: () => void;
  onGoHome: () => void;
  error?: string | null;
  initialData?: FormData | null;
}

const NumberStepper: React.FC<{
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    label: string;
}> = ({ value, onChange, min, max, label }) => (
    <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
        <span className="font-semibold text-slate-800">{label}</span>
        <div className="flex items-center space-x-3">
            <button
                type="button"
                onClick={() => onChange(value - 1)}
                disabled={value <= min}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <IconChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg text-teal-700 w-8 text-center">{value}</span>
            <button
                type="button"
                onClick={() => onChange(value + 1)}
                disabled={value >= max}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <IconChevronRight className="w-5 h-5" />
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
  const [mood, setMood] = useState<Mood>('explore');

  useEffect(() => {
    if (initialData) {
      setStartLocation(initialData.startLocation || '');
      setDestination(initialData.destination);
      setDuration(initialData.duration);
      setBudget(initialData.budget);
      setMood(initialData.mood);
      setStartDate(initialData.startDate || '');
    }
  }, [initialData]);


  const handleDaysChange = (newDays: number) => {
    const clampedDays = Math.max(1, Math.min(30, newDays)); // 1 to 30 days
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
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ startLocation, destination, startDate, duration, budget, mood });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-sky-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 md:p-12 space-y-8 transform transition-all duration-500">
        <div className="text-center">
            <Logo className="text-teal-700 inline-flex mb-4" onClick={onGoHome}/>
            <h2 className="text-3xl font-bold text-teal-700">Lên kế hoạch cho chuyến đi mơ ước</h2>
            <p className="text-slate-500 mt-2">Chỉ cần vài lựa chọn, AI sẽ lo phần còn lại!</p>
        </div>
        
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg shadow-md" role="alert">
                <p className="font-bold">Lỗi</p>
                <p>{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           {/* Start Location */}
           <div>
            <label htmlFor="startLocation" className="block text-lg font-medium text-slate-700 mb-2">Nơi bắt đầu</label>
            <div className="relative">
              <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                id="startLocation"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Nhập thành phố khởi hành (tùy chọn)"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-500 transition placeholder-slate-400"
              />
            </div>
          </div>
          
          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-lg font-medium text-slate-700 mb-2">Điểm đến</label>
            <div className="relative">
              <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Nhập địa điểm (hoặc để trống)"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-500 transition placeholder-slate-400"
              />
            </div>
          </div>
          
          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-lg font-medium text-slate-700 mb-2">Ngày khởi hành (tùy chọn)</label>
            <div className="relative">
              <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-500 transition placeholder-slate-400"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
              <label className="block text-lg font-medium text-slate-700 mb-3">Thời gian</label>
              <div className="grid grid-cols-2 gap-4">
                <NumberStepper label="Số ngày" value={duration.days} onChange={handleDaysChange} min={1} max={30} />
                <NumberStepper label="Số đêm" value={duration.nights} onChange={handleNightsChange} min={0} max={duration.days > 0 ? duration.days - 1 : 0} />
              </div>
          </div>
          
          {/* Budget */}
          <div>
              <label htmlFor="budget" className="block text-lg font-medium text-slate-700 mb-2">Ngân sách (mỗi người)</label>
              <div className="space-y-3">
                  <div className="relative">
                      <IconWallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                          type="text"
                          value={budget > 0 ? budget.toLocaleString('vi-VN') : ''}
                          onChange={(e) => handleBudgetChange(e.target.value)}
                          placeholder="0"
                          className="w-full pl-10 pr-12 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-500 transition font-semibold text-slate-800"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">VNĐ</span>
                  </div>
                  <input
                      type="range"
                      id="budget"
                      min="500000"
                      max="20000000"
                      step="500000"
                      value={budget}
                      onChange={(e) => handleBudgetChange(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer custom-range"
                  />
              </div>
          </div>

          {/* Mood */}
          <div>
              <label className="block text-lg font-medium text-slate-700 mb-3">Tâm trạng của bạn?</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {MOOD_OPTIONS.map((opt) => (
                      <button type="button" key={opt.id} onClick={() => setMood(opt.id)} className={`p-3 text-center rounded-lg border-2 transition-all duration-200 ${mood === opt.id ? 'border-teal-500 bg-teal-50 scale-105 shadow-lg' : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}>
                          <span className="text-3xl md:text-4xl">{opt.icon}</span>
                          <p className="font-semibold mt-1 text-sm text-slate-800">{opt.label}</p>
                      </button>
                  ))}
              </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 text-slate-600 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
                Quay lại
            </button>
            <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
                Tạo hành trình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};