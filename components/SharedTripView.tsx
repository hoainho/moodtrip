import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { TripRecord } from '../services/tripsApi';
import { forkTrip, getTripBySlug } from '../services/tripsApi';
import { useAuth } from '../services/useAuth';

interface SharedTripViewProps {
  slug: string;
  onForkSuccess: (trip: TripRecord) => void;
  onRequestSignIn: () => void;
  onBackToApp: () => void;
}

type State = 'loading' | 'loaded' | 'not-found' | 'forking' | 'forked';

export function SharedTripView({ slug, onForkSuccess, onRequestSignIn, onBackToApp }: SharedTripViewProps) {
  const { user } = useAuth();
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [state, setState] = useState<State>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getTripBySlug(slug);
      if (cancelled) return;
      if (!result) {
        setState('not-found');
      } else {
        setTrip(result);
        setState('loaded');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleFork() {
    if (!user) {
      onRequestSignIn();
      return;
    }
    setState('forking');
    const forked = await forkTrip(slug, user.id);
    if (!forked) {
      setError('Không thể fork lịch trình này. Thử lại nhé.');
      setState('loaded');
      return;
    }
    setState('forked');
    setTimeout(() => onForkSuccess(forked), 600);
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Đang tải lịch trình…</p>
      </div>
    );
  }

  if (state === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Không tìm thấy lịch trình này</h2>
        <p className="text-slate-400 mb-6">Có thể chủ nhân đã chuyển nó về chế độ riêng tư.</p>
        <button
          onClick={onBackToApp}
          className="px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen max-w-3xl mx-auto px-4 py-10"
    >
      <header className="mb-8">
        <p className="text-teal-400 text-xs uppercase tracking-wider mb-2">Lịch trình chia sẻ</p>
        <h1 className="text-4xl font-extrabold text-white mb-2">{trip.destination}</h1>
        <p className="text-slate-400 text-sm">{trip.itinerary.overview}</p>
      </header>

      <section className="space-y-4 mb-10">
        {trip.itinerary.timeline.map((day, idx) => (
          <article key={idx} className="p-5 rounded-2xl glass-dark border border-white/5">
            <h3 className="text-lg font-bold text-teal-300 mb-1">{day.day}</h3>
            <p className="text-white font-medium mb-3">{day.title}</p>
            <ul className="space-y-2">
              {day.schedule.map((item, j) => (
                <li key={j} className="flex gap-3 text-sm">
                  <span className="text-teal-400 font-mono shrink-0 w-14">{item.time}</span>
                  <span className="text-slate-300">{item.activity}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {error && <p className="mb-4 text-rose-400 text-sm">{error}</p>}

      <footer className="sticky bottom-4 z-10 flex gap-2">
        <button
          onClick={handleFork}
          disabled={state === 'forking' || state === 'forked'}
          className="flex-1 px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl disabled:opacity-60 shadow-lg shadow-teal-500/30"
        >
          {state === 'forking'
            ? 'Đang tạo bản remix…'
            : state === 'forked'
            ? '✓ Đã thêm vào lịch trình của bạn'
            : user
            ? '🪄 Remix lịch trình này'
            : 'Đăng nhập để remix'}
        </button>
        <button
          onClick={onBackToApp}
          className="px-4 py-3 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm"
        >
          Trang chủ
        </button>
      </footer>
    </motion.div>
  );
}
