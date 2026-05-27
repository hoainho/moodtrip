export interface SoundClip {
  blob: Blob;
  duration: number;
  recordedAt: number;
  label?: string;
}

export interface SoundRecorder {
  start: () => Promise<void>;
  stop: () => Promise<SoundClip>;
  cancel: () => void;
  isSupported: boolean;
  isRecording: boolean;
}

const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const m of PREFERRED_MIME_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      continue;
    }
  }
  return null;
}

export function isSongDiSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && pickSupportedMimeType() !== null;
}

export interface SoundRecorderOptions {
  maxDurationMs?: number;
  label?: string;
}

export async function startSoundRecorder(opts: SoundRecorderOptions = {}): Promise<{
  stop: () => Promise<SoundClip>;
  cancel: () => void;
}> {
  const mime = pickSupportedMimeType();
  if (!mime) throw new Error('SOUND_NOT_SUPPORTED');

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: BlobPart[] = [];
  const startedAt = Date.now();
  let stopped = false;

  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  recorder.start();

  const maxMs = opts.maxDurationMs ?? 5000;
  const maxTimer = setTimeout(() => {
    if (recorder.state === 'recording') recorder.stop();
  }, maxMs);

  function teardown() {
    clearTimeout(maxTimer);
    stream.getTracks().forEach((t) => t.stop());
  }

  return {
    stop: () =>
      new Promise<SoundClip>((resolve, reject) => {
        if (stopped) {
          reject(new Error('Recorder already stopped'));
          return;
        }
        stopped = true;
        recorder.onstop = () => {
          teardown();
          resolve({
            blob: new Blob(chunks, { type: mime }),
            duration: Math.min(Date.now() - startedAt, maxMs),
            recordedAt: startedAt,
            label: opts.label,
          });
        };
        if (recorder.state === 'recording') recorder.stop();
        else resolve({ blob: new Blob(chunks, { type: mime }), duration: Date.now() - startedAt, recordedAt: startedAt, label: opts.label });
      }),
    cancel: () => {
      stopped = true;
      teardown();
      try {
        if (recorder.state === 'recording') recorder.stop();
      } catch {
        void 0;
      }
    },
  };
}

export interface WaveformSummary {
  peaks: number[];
  averageVolume: number;
}

export async function computeWaveform(blob: Blob, samples = 48): Promise<WaveformSummary> {
  if (typeof AudioContext === 'undefined') {
    return { peaks: new Array(samples).fill(0), averageVolume: 0 };
  }
  const arrayBuf = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(arrayBuf);
  const channel = decoded.getChannelData(0);
  const chunkSize = Math.floor(channel.length / samples) || 1;
  const peaks: number[] = [];
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    let max = 0;
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, channel.length);
    for (let j = start; j < end; j++) {
      const v = Math.abs(channel[j] ?? 0);
      if (v > max) max = v;
    }
    peaks.push(max);
    sum += max;
  }
  await ctx.close();
  return { peaks, averageVolume: sum / samples };
}
