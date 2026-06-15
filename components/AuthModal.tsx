import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX, IconMail } from './icons';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { signInWithMagicLink, signInWithOAuth } from '../services/authSession';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <AnimatePresence>
        {open && (
          <ModalShell onClose={onClose}>
            <h2 className="text-2xl font-bold text-white mb-3">Đăng nhập chưa khả dụng</h2>
            <p className="text-slate-300 mb-6">
              Tính năng tài khoản đang được chuẩn bị. Bạn vẫn có thể dùng MoodTrip ẩn danh —
              lịch trình được lưu trên thiết bị này.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-teal-500 text-white font-semibold rounded-xl"
            >
              Đã hiểu
            </button>
          </ModalShell>
        )}
      </AnimatePresence>
    );
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === 'sending') return;
    setStatus('sending');
    setErrorMsg(null);
    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setStatus('sending');
    setErrorMsg(null);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <ModalShell onClose={onClose}>
          <h2 className="text-2xl font-bold text-white mb-2">Đăng nhập MoodTrip</h2>
          <p className="text-slate-400 text-sm mb-6">
            Lưu lịch trình của bạn để truy cập từ bất kỳ thiết bị nào.
          </p>

          {status === 'sent' ? (
            <div className="text-center py-6">
              <p className="text-teal-300 mb-2 inline-flex items-center gap-2"><IconMail className="w-5 h-5" aria-hidden="true" /> Đã gửi liên kết đăng nhập</p>
              <p className="text-slate-400 text-sm">
                Mở email <span className="text-white font-medium">{email}</span> và nhấn vào liên kết để hoàn tất.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={status === 'sending'}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
                />
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {status === 'sending' ? 'Đang gửi…' : 'Gửi liên kết đăng nhập'}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-slate-500 text-xs">HOẶC</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={status === 'sending'}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl disabled:opacity-50"
                >
                  Tiếp tục với Google
                </button>
                <button
                  onClick={() => handleOAuth('apple')}
                  disabled={status === 'sending'}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl disabled:opacity-50"
                >
                  Tiếp tục với Apple
                </button>
              </div>

              {errorMsg && (
                <p className="mt-4 text-rose-400 text-sm" role="alert">
                  {errorMsg}
                </p>
              )}
            </>
          )}
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative w-full max-w-md p-6 rounded-3xl glass-dark border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          <IconX className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
