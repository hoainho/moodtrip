import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ItineraryPlan } from '../types';
import { IconX, IconDownload } from './icons';

interface TripReelModalProps {
  itinerary: ItineraryPlan;
  open: boolean;
  onClose: () => void;
}

const W = 1080;
const H = 1920;

function topHighlights(itinerary: ItineraryPlan, n: number): Array<{ time: string; title: string; venue: string | null }> {
  const all = itinerary.timeline.flatMap((d) =>
    d.schedule.map((s) => ({ time: s.time, title: s.activity, venue: s.venue ?? null, trending: !!s.is_trending }))
  );
  const trending = all.filter((a) => a.trending);
  const rest = all.filter((a) => !a.trending);
  return [...trending, ...rest].slice(0, n);
}

function paletteFor(destination: string): { c1: string; c2: string; c3: string } {
  const palettes = [
    { c1: '#0ea5a4', c2: '#0369a1', c3: '#1e1b4b' },
    { c1: '#f59e0b', c2: '#dc2626', c3: '#831843' },
    { c1: '#a855f7', c2: '#ec4899', c3: '#581c87' },
    { c1: '#10b981', c2: '#0d9488', c3: '#064e3b' },
    { c1: '#6366f1', c2: '#8b5cf6', c3: '#312e81' },
  ];
  const idx = (destination.charCodeAt(0) + destination.length) % palettes.length;
  return palettes[idx];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildReelSvg(itinerary: ItineraryPlan): string {
  const dest = escapeXml(itinerary.destination);
  const days = itinerary.timeline.length;
  const activities = itinerary.timeline.reduce((s, d) => s + d.schedule.length, 0);
  const cost = itinerary.budget_summary?.total_estimated || '—';
  const highlights = topHighlights(itinerary, 4);
  const { c1, c2, c3 } = paletteFor(itinerary.destination);

  const highlightItems = highlights
    .map((h, i) => {
      const y = 1180 + i * 130;
      const title = escapeXml(h.title.length > 38 ? h.title.slice(0, 36) + '…' : h.title);
      const venue = h.venue ? escapeXml((h.venue.length > 32 ? h.venue.slice(0, 30) + '…' : h.venue)) : '';
      return `
    <g transform="translate(80,${y})">
      <rect x="0" y="0" width="920" height="100" rx="20" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <text x="32" y="42" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="700" fill="#fcd34d">${escapeXml(h.time)}</text>
      <text x="150" y="42" font-family="Inter,system-ui,sans-serif" font-size="32" font-weight="600" fill="#ffffff">${title}</text>
      ${venue ? `<text x="150" y="78" font-family="Inter,system-ui,sans-serif" font-size="22" fill="rgba(255,255,255,0.7)">📍 ${venue}</text>` : ''}
    </g>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.2" cy="0.15" r="0.6">
      <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.85" cy="0.85" r="0.7">
      <stop offset="0%" stop-color="rgba(252,211,77,0.25)"/>
      <stop offset="100%" stop-color="rgba(252,211,77,0)"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  <g transform="translate(80,140)">
    <rect x="0" y="0" width="240" height="50" rx="25" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <text x="120" y="34" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">MOODTRIP</text>
  </g>

  <text x="80" y="380" font-family="Inter,system-ui,sans-serif" font-size="42" font-weight="500" fill="rgba(255,255,255,0.75)" letter-spacing="4">HÀNH TRÌNH CỦA TÔI</text>
  <text x="80" y="540" font-family="Georgia,serif" font-size="170" font-weight="700" fill="#ffffff">${dest}</text>

  <g transform="translate(80,680)">
    <rect x="0" y="0" width="280" height="220" rx="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
    <text x="140" y="80" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.7)" text-anchor="middle" letter-spacing="2">NGÀY</text>
    <text x="140" y="170" font-family="Inter,system-ui,sans-serif" font-size="110" font-weight="800" fill="#ffffff" text-anchor="middle">${days}</text>

    <rect x="320" y="0" width="280" height="220" rx="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
    <text x="460" y="80" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.7)" text-anchor="middle" letter-spacing="2">HOẠT ĐỘNG</text>
    <text x="460" y="170" font-family="Inter,system-ui,sans-serif" font-size="110" font-weight="800" fill="#ffffff" text-anchor="middle">${activities}</text>

    <rect x="640" y="0" width="280" height="220" rx="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
    <text x="780" y="80" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.7)" text-anchor="middle" letter-spacing="2">DỰ KIẾN</text>
    <text x="780" y="170" font-family="Inter,system-ui,sans-serif" font-size="42" font-weight="800" fill="#ffffff" text-anchor="middle">${escapeXml(cost)}</text>
  </g>

  <text x="80" y="1080" font-family="Inter,system-ui,sans-serif" font-size="30" font-weight="600" fill="rgba(255,255,255,0.6)" letter-spacing="3">ĐIỂM NHẤN</text>
  ${highlightItems}

  <g transform="translate(80,1780)">
    <text x="0" y="40" font-family="Georgia,serif" font-size="40" font-style="italic" fill="rgba(255,255,255,0.85)">Tạo bởi Mơ ✨</text>
    <text x="0" y="90" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.6)" letter-spacing="2">moodtrip.app</text>
  </g>
</svg>`;
}

export const TripReelModal: React.FC<TripReelModalProps> = ({ itinerary, open, onClose }) => {
  const svg = useMemo(() => buildReelSvg(itinerary), [itinerary]);
  const dataUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);

  const handleDownload = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = itinerary.destination.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    a.download = `moodtrip-${slug}-reel.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleCopyImage = async () => {
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/svg+xml': blob })]);
      return;
    } catch (writeErr) {
      console.warn('[reel] clipboard.write unavailable, falling back to text', writeErr);
    }
    try {
      await navigator.clipboard.writeText(svg);
    } catch (textErr) {
      console.warn('[reel] clipboard unavailable', textErr);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
              aria-label="Đóng"
            >
              <IconX className="w-5 h-5" />
            </button>

            <img
              src={dataUrl}
              alt={`Reel preview cho ${itinerary.destination}`}
              className="w-full max-h-[78vh] rounded-2xl shadow-2xl shadow-black/60 border border-white/10"
              style={{ aspectRatio: '9 / 16', objectFit: 'contain', background: '#0a0e1a' }}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/30 hover:from-teal-400 hover:to-cyan-400 transition-colors"
              >
                <IconDownload className="w-4 h-4" /> Tải về (SVG)
              </button>
              <button
                onClick={handleCopyImage}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/15 transition-colors"
              >
                📋 Copy
              </button>
            </div>

            <p className="text-xs text-white/60 text-center max-w-xs">
              File 1080×1920, đăng được trực tiếp lên Instagram Reels, TikTok, Facebook Story.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
