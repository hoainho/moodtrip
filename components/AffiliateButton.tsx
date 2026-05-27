import { useState } from 'react';
import { motion } from 'motion/react';
import {
  acceptAffiliateConsent,
  recordAffiliateClickIntent,
  type AffiliateLinkInput,
} from '../services/affiliate';

interface AffiliateButtonProps extends AffiliateLinkInput {
  label: string;
  variant?: 'primary' | 'subtle';
}

type State = 'idle' | 'awaiting-consent' | 'redirecting' | 'blocked';

const PARTNER_LABELS: Record<AffiliateLinkInput['partner'], string> = {
  traveloka: 'Traveloka',
  klook: 'Klook',
  agoda: 'Agoda',
};

export function AffiliateButton({ label, variant = 'primary', ...input }: AffiliateButtonProps) {
  const [state, setState] = useState<State>('idle');
  const [reason, setReason] = useState<string | null>(null);

  async function handleClick() {
    const result = await recordAffiliateClickIntent(input, { requireConsent: true });
    if (!result.ok) {
      if (result.reason === 'BLOCKED_DOMAIN') {
        setReason('Liên kết này không an toàn.');
        setState('blocked');
        return;
      }
      if (result.reason === 'CONSENT_REQUIRED') {
        setState('awaiting-consent');
        return;
      }
    }
    if (result.redirectUrl) {
      setState('redirecting');
      window.open(result.redirectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => setState('idle'), 1500);
    }
  }

  async function handleAcceptConsent() {
    await acceptAffiliateConsent();
    setState('idle');
    void handleClick();
  }

  const baseCls =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-md shadow-teal-500/30 hover:opacity-95'
      : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-teal-300 text-xs';

  if (state === 'awaiting-consent') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 rounded-xl bg-white/5 border border-teal-500/20 text-sm text-slate-300"
      >
        <p className="mb-2">
          Liên kết này sẽ gửi bạn đến {PARTNER_LABELS[input.partner]}. MoodTrip nhận hoa hồng nếu
          bạn đặt qua liên kết — không ảnh hưởng giá bạn trả.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAcceptConsent}
            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg"
          >
            Đồng ý & tiếp tục
          </button>
          <button
            onClick={() => setState('idle')}
            className="px-3 py-1.5 text-slate-400 text-xs"
          >
            Hủy
          </button>
        </div>
      </motion.div>
    );
  }

  if (state === 'blocked') {
    return <p className="text-rose-400 text-xs">{reason}</p>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'redirecting'}
      className={`${baseCls} disabled:opacity-60`}
    >
      {state === 'redirecting' ? 'Đang mở…' : label}
    </button>
  );
}
