import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  computeWaveform,
  isSongDiSupported,
  startSoundRecorder,
  type SoundClip,
  type WaveformSummary,
} from '../services/songDi';

interface SongDiRecorderProps {
  destination: string;
  onClipReady?: (clip: SoundClip, waveform: WaveformSummary) => void;
}

type State = 'idle' | 'requesting' | 'recording' | 'processing' | 'ready' | 'unsupported' | 'error';

export function SongDiRecorder({ destination, onClipReady }: SongDiRecorderProps) {
  const [state, setState] = useState<State>(isSongDiSupported() ? 'idle' : 'unsupported');
  const [clip, setClip] = useState<SoundClip | null>(null);
  const [waveform, setWaveform] = useState<WaveformSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recorderRef = useRef<Awaited<ReturnType<typeof startSoundRecorder>> | null>(null);

  useEffect(() => {
    return () => {
      recorderRef.current?.cancel();
    };
  }, []);

  async function handleStart() {
    setState('requesting');
    setErrorMsg(null);
    try {
      const rec = await startSoundRecorder({ maxDurationMs: 5000, label: destination });
      recorderRef.current = rec;
      setState('recording');
      setTimeout(() => {
        if (recorderRef.current === rec) void handleStop();
      }, 5050);
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Không truy cập được micro');
    }
  }

  async function handleStop() {
    if (!recorderRef.current) return;
    setState('processing');
    try {
      const newClip = await recorderRef.current.stop();
      recorderRef.current = null;
      setClip(newClip);
      const wf = await computeWaveform(newClip.blob);
      setWaveform(wf);
      setState('ready');
      onClipReady?.(newClip, wf);
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi xử lý âm thanh');
    }
  }

  if (state === 'unsupported') {
    return (
      <p className="text-slate-500 text-xs">
        Thiết bị này chưa hỗ trợ ghi âm trong trình duyệt.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-white/5 p-4">
      <p className="text-white text-sm font-medium mb-1">🎙️ Sóng đi · {destination}</p>
      <p className="text-slate-400 text-xs mb-3">
        Ghi 5 giây âm thanh ở nơi bạn đang đứng — Mơ sẽ ghép thành một tấm bưu thiếp âm thanh sau chuyến đi.
      </p>

      {waveform && (
        <div className="flex items-end gap-[2px] h-12 mb-3" aria-hidden="true">
          {waveform.peaks.map((p, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-purple-500 to-pink-400 rounded-sm"
              style={{ height: `${Math.max(8, p * 100)}%` }}
            />
          ))}
        </div>
      )}

      {state === 'recording' && (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-rose-300 text-sm font-medium mb-2"
        >
          🔴 Đang ghi…
        </motion.div>
      )}

      {state === 'processing' && <p className="text-slate-400 text-xs mb-2">Đang xử lý…</p>}

      {clip && state === 'ready' && (
        <audio src={URL.createObjectURL(clip.blob)} controls className="w-full mb-3" />
      )}

      {errorMsg && <p className="text-rose-400 text-xs mb-2">{errorMsg}</p>}

      <div className="flex gap-2">
        {state !== 'recording' ? (
          <button
            onClick={handleStart}
            disabled={state === 'requesting' || state === 'processing'}
            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
          >
            {clip ? 'Ghi lại' : '🎙️ Bắt đầu ghi'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl"
          >
            Dừng ngay
          </button>
        )}
      </div>
    </div>
  );
}
