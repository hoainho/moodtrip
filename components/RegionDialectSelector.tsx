import { useEffect, useState } from 'react';
import { useAuth } from '../services/useAuth';
import { loadPreferences, setRegionDialect } from '../services/preferencesApi';

const OPTIONS: Array<{ id: string; label: string; sample: string }> = [
  { id: 'auto', label: 'Tự động theo điểm đến', sample: 'Mơ chọn giọng phù hợp với mỗi chuyến' },
  { id: 'north', label: 'Miền Bắc', sample: 'ạ, nhé, đấy' },
  { id: 'central', label: 'Miền Trung', sample: 'mệ, tê, ni, rứa' },
  { id: 'south', label: 'Miền Nam', sample: 'nhe, dữ chưa, trời ơi' },
  { id: 'mekong', label: 'Miền Tây', sample: 'mèn đét, hông, nghen' },
];

export function RegionDialectSelector() {
  const { user } = useAuth();
  const [current, setCurrent] = useState<string>('auto');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    loadPreferences(user.id).then((p) => {
      if (p?.regionDialect) setCurrent(p.regionDialect);
    });
  }, [user]);

  if (!user) return null;

  async function handlePick(id: string) {
    setCurrent(id);
    setSaving(true);
    await setRegionDialect(user!.id, id === 'auto' ? null : id);
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 1500);
  }

  return (
    <div className="rounded-2xl glass-dark border border-white/10 p-4 max-w-md mx-auto">
      <p className="text-white font-medium text-sm mb-1">🗣️ Tiếng vùng của Mơ</p>
      <p className="text-slate-400 text-xs mb-3">
        Chọn giọng địa phương bạn muốn nghe khi Mơ kể chuyện.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handlePick(opt.id)}
            disabled={saving}
            className={`text-left px-3 py-2 rounded-xl text-xs border transition-colors ${
              current === opt.id
                ? 'bg-teal-500/15 border-teal-500/50 text-teal-200'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <p className="font-medium">{opt.label}</p>
            <p className="text-[10px] opacity-70 mt-0.5">{opt.sample}</p>
          </button>
        ))}
      </div>
      {savedAt && <p className="text-teal-300 text-xs mt-2">✓ Đã lưu</p>}
    </div>
  );
}
