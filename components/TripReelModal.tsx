import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ItineraryPlan } from '../types';
import { IconX, IconDownload, IconCopy, IconCheck, IconSparkles } from './icons';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface TripReelModalProps {
  itinerary: ItineraryPlan;
  open: boolean;
  onClose: () => void;
}

type FormatId = 'story' | 'square' | 'portrait';

interface Format {
  id: FormatId;
  label: string;
  platforms: string;
  w: number;
  h: number;
  aspect: string;
}

const FORMATS: Record<FormatId, Format> = {
  story: { id: 'story', label: 'Reels / Story', platforms: 'TikTok · IG Reels · FB Story', w: 1080, h: 1920, aspect: '9 / 16' },
  portrait: { id: 'portrait', label: 'Feed Portrait', platforms: 'IG Feed · FB Feed', w: 1080, h: 1350, aspect: '4 / 5' },
  square: { id: 'square', label: 'Square', platforms: 'IG Feed · FB Post', w: 1080, h: 1080, aspect: '1 / 1' },
};

interface Highlight {
  time: string;
  title: string;
  venue: string | null;
}

function topHighlights(itinerary: ItineraryPlan, n: number): Highlight[] {
  const all = itinerary.timeline.flatMap((d) =>
    d.schedule.map((s) => ({
      time: s.time,
      title: s.activity,
      venue: s.venue ?? null,
      trending: !!s.is_trending,
    })),
  );
  const trending = all.filter((a) => a.trending);
  const rest = all.filter((a) => !a.trending);
  return [...trending, ...rest].slice(0, n);
}

interface Palette {
  c1: string;
  c2: string;
  c3: string;
  glow: string;
  accent: string;
}

function paletteFor(destination: string): Palette {
  const palettes: Palette[] = [
    { c1: '#14b8a6', c2: '#0369a1', c3: '#1e1b4b', glow: 'rgba(125,211,252,0.55)', accent: '#fcd34d' },
    { c1: '#f59e0b', c2: '#dc2626', c3: '#831843', glow: 'rgba(254,215,170,0.55)', accent: '#fde68a' },
    { c1: '#a855f7', c2: '#ec4899', c3: '#581c87', glow: 'rgba(244,114,182,0.55)', accent: '#fef3c7' },
    { c1: '#10b981', c2: '#0d9488', c3: '#064e3b', glow: 'rgba(110,231,183,0.55)', accent: '#fde68a' },
    { c1: '#6366f1', c2: '#8b5cf6', c3: '#312e81', glow: 'rgba(196,181,253,0.55)', accent: '#fcd34d' },
    { c1: '#ef4444', c2: '#f97316', c3: '#7c2d12', glow: 'rgba(254,202,202,0.55)', accent: '#fef3c7' },
  ];
  const sum = destination.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return palettes[sum % palettes.length];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

type FontId = 'inter' | 'georgia';

const FONT_FAMILY: Record<FontId, string> = {
  inter: "'Inter', 'Be Vietnam Pro', system-ui, -apple-system, sans-serif",
  georgia: "'Georgia', 'Times New Roman', serif",
};

const FONT_WEIGHT: Record<FontId, number> = {
  inter: 700,
  georgia: 700,
};

const SAFETY_MARGIN = 0.92;

let _canvasCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (_canvasCtx) return _canvasCtx;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  _canvasCtx = ctx;
  return ctx;
}

const FALLBACK_WIDTH_RATIO: Record<FontId, { default: number; vietnamese: number; upper: number; digit: number; punct: number; space: number }> = {
  inter: { default: 0.55, vietnamese: 0.62, upper: 0.72, digit: 0.58, punct: 0.34, space: 0.27 },
  georgia: { default: 0.54, vietnamese: 0.60, upper: 0.68, digit: 0.58, punct: 0.34, space: 0.27 },
};

const VIET_DIACRITIC_RE = /[\u00C0-\u1EF9]/;
const UPPER_RE = /[A-Z\u00C0-\u00DE\u0100-\u017F]/;
const DIGIT_RE = /[0-9]/;
const SPACE_RE = /\s/;

function estimateTextWidth(text: string, fontSize: number, font: FontId = 'inter'): number {
  const ctx = getMeasureCtx();
  if (ctx) {
    ctx.font = `${FONT_WEIGHT[font]} ${fontSize}px ${FONT_FAMILY[font]}`;
    const metrics = ctx.measureText(text);
    return metrics.width;
  }
  const r = FALLBACK_WIDTH_RATIO[font];
  let total = 0;
  for (const ch of text) {
    if (SPACE_RE.test(ch)) total += fontSize * r.space;
    else if (DIGIT_RE.test(ch)) total += fontSize * r.digit;
    else if (VIET_DIACRITIC_RE.test(ch)) total += fontSize * r.vietnamese;
    else if (UPPER_RE.test(ch)) total += fontSize * r.upper;
    else if (/[a-z]/.test(ch)) total += fontSize * r.default;
    else total += fontSize * r.punct;
  }
  return total;
}

function widthFits(text: string, fontSize: number, maxWidth: number, font: FontId): boolean {
  return estimateTextWidth(text, fontSize, font) <= maxWidth * SAFETY_MARGIN;
}

function truncateToWidth(text: string, fontSize: number, maxWidth: number, font: FontId): string {
  const budget = maxWidth * SAFETY_MARGIN;
  if (estimateTextWidth(text, fontSize, font) <= budget) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid) + '…';
    if (estimateTextWidth(candidate, fontSize, font) <= budget) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  const result = text.slice(0, lo).trimEnd() + '…';
  return result;
}

function wrapText(text: string, maxWidth: number, fontSize: number, maxLines: number, font: FontId = 'inter'): string[] {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;
    if (widthFits(candidate, fontSize, maxWidth, font)) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = '';
    }
    if (lines.length >= maxLines - 1) {
      const remaining = words.slice(i).join(' ');
      lines.push(truncateToWidth(remaining, fontSize, maxWidth, font));
      return lines;
    }
    if (widthFits(word, fontSize, maxWidth, font)) {
      current = word;
    } else {
      current = '';
      lines.push(truncateToWidth(word, fontSize, maxWidth, font));
      if (lines.length >= maxLines) return lines;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function fitTextToBox(
  text: string,
  maxWidth: number,
  maxHeight: number,
  startFontSize: number,
  minFontSize: number,
  lineHeightRatio: number,
  maxLines: number,
  font: FontId = 'inter',
): { fontSize: number; lines: string[] } {
  for (let fs = startFontSize; fs >= minFontSize; fs -= 2) {
    const lines = wrapText(text, maxWidth, fs, maxLines, font);
    if (lines.length === 0) return { fontSize: fs, lines: [] };
    const totalHeight = lines.length * fs * lineHeightRatio;
    if (totalHeight > maxHeight) continue;
    let allFit = true;
    for (const line of lines) {
      if (!widthFits(line, fs, maxWidth, font)) {
        allFit = false;
        break;
      }
    }
    if (allFit) return { fontSize: fs, lines };
  }
  const fs = minFontSize;
  const lines = wrapText(text, maxWidth, fs, maxLines, font).map((line) =>
    widthFits(line, fs, maxWidth, font) ? line : truncateToWidth(line, fs, maxWidth, font),
  );
  return { fontSize: fs, lines };
}

function renderTspans(lines: string[], x: number, lineHeight: number, firstLineDy = 0): string {
  return lines
    .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? firstLineDy : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
}

/** Schedule times are ranges like "14:00 - 17:00"; show only the start so the highlight cards stay compact. */
function formatReelTime(t: string): string {
  const m = t.match(/\d{1,2}[:h]\d{2}/);
  if (m) return m[0].replace('h', ':');
  return t.split(/[-–—]/)[0].trim();
}

/**
 * Renders a stat value centered inside a fixed box, auto-shrinking and wrapping to <=2 lines so a long
 * value (e.g. a budget RANGE "450.000 - 660.000 VNĐ") never overflows the box or the frame.
 */
/** Greedy word-wrap WITHOUT truncation. Returns null if any single word can't fit maxWidth at this size. */
function wrapNoTruncate(text: string, maxWidth: number, fontSize: number, maxLines: number, font: FontId): string[] | null {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!widthFits(word, fontSize, maxWidth, font)) return null;
    const candidate = current ? `${current} ${word}` : word;
    if (widthFits(candidate, fontSize, maxWidth, font)) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) return null;
    }
  }
  if (current) lines.push(current);
  return lines.length <= maxLines ? lines : null;
}

function statValueSvg(
  value: string,
  centerX: number,
  labelBaselineY: number,
  boxH: number,
  maxWidth: number,
  baseFs: number,
  minFs: number,
): string {
  const areaTop = labelBaselineY + 14;
  const areaBottom = boxH - 16;
  const areaH = areaBottom - areaTop;

  // Prefer shrinking the font to show the FULL value untruncated (budget ranges are long); only fall
  // back to ellipsis-truncation if even the smallest size can't fit.
  let fontSize = minFs;
  let lines: string[] = [];
  for (let fs = baseFs; fs >= minFs; fs -= 2) {
    const wrapped = wrapNoTruncate(value, maxWidth, fs, 2, 'inter');
    if (wrapped && wrapped.length * fs * 1.12 <= areaH) {
      fontSize = fs;
      lines = wrapped;
      break;
    }
  }
  if (lines.length === 0) {
    const fit = fitTextToBox(value, maxWidth, areaH, minFs, minFs, 1.12, 2, 'inter');
    fontSize = fit.fontSize;
    lines = fit.lines;
  }

  const lh = fontSize * 1.12;
  const blockH = lines.length * lh;
  const firstBaseline = areaTop + (areaH - blockH) / 2 + fontSize * 0.82;
  const tspans = lines
    .map((ln, i) => `<tspan x="${centerX}" dy="${i === 0 ? 0 : lh}">${escapeXml(ln)}</tspan>`)
    .join('');
  return `<text x="${centerX}" y="${firstBaseline}" font-family="${FONT_FAMILY.inter}" font-size="${fontSize}" font-weight="800" fill="#ffffff" text-anchor="middle">${tspans}</text>`;
}

function buildSparkles(w: number, h: number, seed: number, count: number): string {
  const rand = seededRandom(seed);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(rand() * h);
    const r = 1 + rand() * 3.5;
    const opacity = (0.35 + rand() * 0.55).toFixed(2);
    out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${opacity}"/>`);
  }
  for (let i = 0; i < count / 6; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(rand() * h);
    const size = 6 + rand() * 14;
    const opacity = (0.5 + rand() * 0.4).toFixed(2);
    out.push(
      `<g transform="translate(${x},${y}) rotate(${Math.floor(rand() * 360)})" opacity="${opacity}">` +
        `<path d="M0 -${size} L${size * 0.18} -${size * 0.18} L${size} 0 L${size * 0.18} ${size * 0.18} L0 ${size} L-${size * 0.18} ${size * 0.18} L-${size} 0 L-${size * 0.18} -${size * 0.18} Z" fill="#ffffff"/>` +
        `</g>`,
    );
  }
  return out.join('\n');
}

function layoutStory(palette: Palette, dest: string, days: number, activities: number, cost: string, highlights: Highlight[]): string {
  const PAD_LEFT = 80;
  const CONTENT_WIDTH = 920;
  const HIGHLIGHTS_TOP = 1240;
  const HIGHLIGHTS_BOTTOM_LIMIT = 1770;
  const HIGHLIGHTS_BUDGET = HIGHLIGHTS_BOTTOM_LIMIT - HIGHLIGHTS_TOP;

  const DEST_TOP_LIMIT = 430;
  const DEST_BOTTOM_LIMIT = 870;
  const DEST_AVAILABLE_H = DEST_BOTTOM_LIMIT - DEST_TOP_LIMIT;
  const destFit = fitTextToBox(dest, CONTENT_WIDTH, DEST_AVAILABLE_H, 150, 62, 1.18, 3, 'georgia');
  const destLineHeight = destFit.fontSize * 1.18;
  const destBlockH = destFit.lines.length * destLineHeight;
  const destFirstBaselineY = DEST_TOP_LIMIT + (DEST_AVAILABLE_H - destBlockH) / 2 + destFit.fontSize * 0.82;
  const destTspans = renderTspans(destFit.lines, PAD_LEFT, destLineHeight);

  const HIGHLIGHT_TIME_X = 32;
  const HIGHLIGHT_TIME_FS = 26;
  const HIGHLIGHT_TIME_WIDTH = estimateTextWidth('22:00', HIGHLIGHT_TIME_FS, 'inter');
  const HIGHLIGHT_TEXT_LEFT = HIGHLIGHT_TIME_X + Math.max(96, HIGHLIGHT_TIME_WIDTH + 20);
  const HIGHLIGHT_TEXT_WIDTH = CONTENT_WIDTH - HIGHLIGHT_TEXT_LEFT - 32;
  const HIGHLIGHT_TITLE_FS = 28;
  const HIGHLIGHT_TITLE_LH = HIGHLIGHT_TITLE_FS * 1.42;
  const HIGHLIGHT_VENUE_FS = 20;
  const HIGHLIGHT_VENUE_LH = HIGHLIGHT_VENUE_FS * 1.4;
  const HIGHLIGHT_PAD_TOP = 36;
  const HIGHLIGHT_PAD_BETWEEN = 16;
  const HIGHLIGHT_PAD_BOTTOM = 32;
  const HIGHLIGHT_GAP = 24;
  const HIGHLIGHT_VENUE_INDENT = 22;

  type CardLayout = {
    h: Highlight;
    titleLines: string[];
    venueLines: string[];
    cardH: number;
  };
  const candidates: CardLayout[] = highlights.slice(0, 4).map((h) => {
    const titleLines = wrapText(h.title, HIGHLIGHT_TEXT_WIDTH, HIGHLIGHT_TITLE_FS, 2, 'inter');
    const venueLines = h.venue
      ? wrapText(h.venue, HIGHLIGHT_TEXT_WIDTH - HIGHLIGHT_VENUE_INDENT, HIGHLIGHT_VENUE_FS, 1, 'inter')
      : [];
    const titleBlockH = titleLines.length * HIGHLIGHT_TITLE_LH;
    const venueBlockH = venueLines.length * HIGHLIGHT_VENUE_LH;
    const cardH = Math.max(
      108,
      HIGHLIGHT_PAD_TOP + titleBlockH + (venueLines.length > 0 ? HIGHLIGHT_PAD_BETWEEN + venueBlockH : 0) + HIGHLIGHT_PAD_BOTTOM,
    );
    return { h, titleLines, venueLines, cardH };
  });

  const accepted: CardLayout[] = [];
  let runningHeight = 0;
  for (const c of candidates) {
    const next = runningHeight + c.cardH + (accepted.length > 0 ? HIGHLIGHT_GAP : 0);
    if (next > HIGHLIGHTS_BUDGET) break;
    accepted.push(c);
    runningHeight = next;
  }

  let cursorY = HIGHLIGHTS_TOP;
  const renderedHighlights: string[] = [];

  for (const c of accepted) {
    const titleYStart = HIGHLIGHT_PAD_TOP + HIGHLIGHT_TITLE_FS * 0.82;
    const titleTspans = renderTspans(c.titleLines, HIGHLIGHT_TEXT_LEFT, HIGHLIGHT_TITLE_LH);
    const timeY = titleYStart;

    let venueRender = '';
    if (c.venueLines.length > 0) {
      const titleBlockH = c.titleLines.length * HIGHLIGHT_TITLE_LH;
      const venueY = HIGHLIGHT_PAD_TOP + titleBlockH + HIGHLIGHT_PAD_BETWEEN + HIGHLIGHT_VENUE_FS * 0.82;
      const venueTspans = renderTspans(c.venueLines, HIGHLIGHT_TEXT_LEFT + HIGHLIGHT_VENUE_INDENT, HIGHLIGHT_VENUE_LH);
      venueRender = `
      <circle cx="${HIGHLIGHT_TEXT_LEFT + 6}" cy="${venueY - HIGHLIGHT_VENUE_FS * 0.32}" r="3.5" fill="${palette.accent}"/>
      <text font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_VENUE_FS}" fill="rgba(255,255,255,0.82)" y="${venueY}">${venueTspans}</text>`;
    }

    renderedHighlights.push(`
    <g transform="translate(${PAD_LEFT},${cursorY})">
      <rect x="0" y="0" width="${CONTENT_WIDTH}" height="${c.cardH}" rx="22" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="1.5"/>
      <text x="${HIGHLIGHT_TIME_X}" y="${timeY}" font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_TIME_FS}" font-weight="700" fill="${palette.accent}">${escapeXml(formatReelTime(c.h.time))}</text>
      <text font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_TITLE_FS}" font-weight="600" fill="#ffffff" y="${titleYStart}">${titleTspans}</text>
      ${venueRender}
    </g>`);

    cursorY += c.cardH + HIGHLIGHT_GAP;
  }

  return `
  <g transform="translate(${PAD_LEFT},140)">
    <rect x="0" y="0" width="240" height="50" rx="25" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <text x="120" y="34" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="3">MOODTRIP</text>
  </g>

  <text x="${PAD_LEFT}" y="380" font-family="${FONT_FAMILY.inter}" font-size="34" font-weight="500" fill="rgba(255,255,255,0.78)" letter-spacing="4">HÀNH TRÌNH CỦA TÔI</text>
  <text font-family="${FONT_FAMILY.georgia}" font-size="${destFit.fontSize}" font-weight="700" fill="#ffffff" filter="url(#textGlow)" y="${destFirstBaselineY}">${destTspans}</text>

  <g transform="translate(${PAD_LEFT},920)">
    <rect x="0" y="0" width="280" height="220" rx="32" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="140" y="84" font-family="Inter,system-ui,sans-serif" font-size="26" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="3">NGÀY</text>
    <text x="140" y="174" font-family="Inter,system-ui,sans-serif" font-size="110" font-weight="800" fill="#ffffff" text-anchor="middle">${days}</text>

    <rect x="320" y="0" width="280" height="220" rx="32" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="460" y="84" font-family="Inter,system-ui,sans-serif" font-size="26" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="3">HOẠT ĐỘNG</text>
    <text x="460" y="174" font-family="Inter,system-ui,sans-serif" font-size="110" font-weight="800" fill="#ffffff" text-anchor="middle">${activities}</text>

    <rect x="640" y="0" width="280" height="220" rx="32" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="780" y="84" font-family="Inter,system-ui,sans-serif" font-size="26" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="3">CHI PHÍ</text>
    ${statValueSvg(cost, 780, 84, 220, 248, 44, 22)}
  </g>

  <g transform="translate(${PAD_LEFT + 10},1195)"><path d="M0,-10 L1.8,-1.8 L10,0 L1.8,1.8 L0,10 L-1.8,1.8 L-10,0 L-1.8,-1.8 Z" fill="${palette.accent}"/></g>
  <text x="${PAD_LEFT + 28}" y="1206" font-family="${FONT_FAMILY.inter}" font-size="28" font-weight="700" fill="${palette.accent}" letter-spacing="4">ĐIỂM NHẤN</text>
  ${renderedHighlights.join('')}

  <g transform="translate(${PAD_LEFT},1800)">
    <text x="0" y="40" font-family="Georgia,serif" font-size="38" font-style="italic" fill="rgba(255,255,255,0.92)">Tạo bởi Mơ</text>
    <text x="0" y="86" font-family="Inter,system-ui,sans-serif" font-size="24" font-weight="700" fill="rgba(255,255,255,0.65)" letter-spacing="4">moodtrip.app</text>
  </g>`;
}

function layoutPortrait(palette: Palette, dest: string, days: number, activities: number, cost: string, highlights: Highlight[]): string {
  const PAD_LEFT = 60;
  const CONTENT_WIDTH = 960;
  const HIGHLIGHTS_TOP = 812;
  const HIGHLIGHTS_BOTTOM_LIMIT = 1225;
  const HIGHLIGHTS_BUDGET = HIGHLIGHTS_BOTTOM_LIMIT - HIGHLIGHTS_TOP;

  const DEST_TOP_LIMIT = 300;
  const DEST_BOTTOM_LIMIT = 500;
  const DEST_AVAILABLE_H = DEST_BOTTOM_LIMIT - DEST_TOP_LIMIT;
  const destFit = fitTextToBox(dest, CONTENT_WIDTH, DEST_AVAILABLE_H, 110, 56, 1.18, 2, 'georgia');
  const destLineHeight = destFit.fontSize * 1.18;
  const destBlockH = destFit.lines.length * destLineHeight;
  const destFirstBaselineY = DEST_TOP_LIMIT + (DEST_AVAILABLE_H - destBlockH) / 2 + destFit.fontSize * 0.82;
  const destTspans = renderTspans(destFit.lines, PAD_LEFT, destLineHeight);


  const HIGHLIGHT_TIME_X = 32;
  const HIGHLIGHT_TIME_FS = 24;
  const HIGHLIGHT_TIME_WIDTH = estimateTextWidth('22:00', HIGHLIGHT_TIME_FS, 'inter');
  const HIGHLIGHT_TEXT_LEFT = HIGHLIGHT_TIME_X + Math.max(96, HIGHLIGHT_TIME_WIDTH + 20);
  const HIGHLIGHT_TEXT_WIDTH = CONTENT_WIDTH - HIGHLIGHT_TEXT_LEFT - 32;
  const HIGHLIGHT_TITLE_FS = 26;
  const HIGHLIGHT_TITLE_LH = HIGHLIGHT_TITLE_FS * 1.42;
  const HIGHLIGHT_VENUE_FS = 18;
  const HIGHLIGHT_VENUE_LH = HIGHLIGHT_VENUE_FS * 1.4;
  const HIGHLIGHT_PAD_TOP = 32;
  const HIGHLIGHT_PAD_BETWEEN = 14;
  const HIGHLIGHT_PAD_BOTTOM = 28;
  const HIGHLIGHT_GAP = 20;

  type CardLayout = { h: Highlight; titleLines: string[]; venueLines: string[]; cardH: number };
  const candidates: CardLayout[] = highlights.slice(0, 3).map((h) => {
    const titleLines = wrapText(h.title, HIGHLIGHT_TEXT_WIDTH, HIGHLIGHT_TITLE_FS, 2, 'inter');
    const venueLines = h.venue ? wrapText(h.venue, HIGHLIGHT_TEXT_WIDTH, HIGHLIGHT_VENUE_FS, 1, 'inter') : [];
    const titleBlockH = titleLines.length * HIGHLIGHT_TITLE_LH;
    const venueBlockH = venueLines.length * HIGHLIGHT_VENUE_LH;
    const cardH = Math.max(
      100,
      HIGHLIGHT_PAD_TOP + titleBlockH + (venueLines.length > 0 ? HIGHLIGHT_PAD_BETWEEN + venueBlockH : 0) + HIGHLIGHT_PAD_BOTTOM,
    );
    return { h, titleLines, venueLines, cardH };
  });

  const accepted: CardLayout[] = [];
  let runningHeight = 0;
  for (const c of candidates) {
    const next = runningHeight + c.cardH + (accepted.length > 0 ? HIGHLIGHT_GAP : 0);
    if (next > HIGHLIGHTS_BUDGET) break;
    accepted.push(c);
    runningHeight = next;
  }

  let cursorY = HIGHLIGHTS_TOP;
  const renderedHighlights: string[] = [];

  for (const c of accepted) {
    const titleYStart = HIGHLIGHT_PAD_TOP + HIGHLIGHT_TITLE_FS * 0.82;
    const titleTspans = renderTspans(c.titleLines, HIGHLIGHT_TEXT_LEFT, HIGHLIGHT_TITLE_LH);
    const timeY = titleYStart;

    let venueRender = '';
    if (c.venueLines.length > 0) {
      const titleBlockH = c.titleLines.length * HIGHLIGHT_TITLE_LH;
      const venueY = HIGHLIGHT_PAD_TOP + titleBlockH + HIGHLIGHT_PAD_BETWEEN + HIGHLIGHT_VENUE_FS * 0.82;
      const venueTspans = renderTspans(c.venueLines, HIGHLIGHT_TEXT_LEFT, HIGHLIGHT_VENUE_LH);
      venueRender = `<text font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_VENUE_FS}" fill="rgba(255,255,255,0.78)" y="${venueY}">${venueTspans}</text>`;
    }

    renderedHighlights.push(`
    <g transform="translate(${PAD_LEFT},${cursorY})">
      <rect x="0" y="0" width="${CONTENT_WIDTH}" height="${c.cardH}" rx="22" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="1.5"/>
      <text x="${HIGHLIGHT_TIME_X}" y="${timeY}" font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_TIME_FS}" font-weight="700" fill="${palette.accent}">${escapeXml(formatReelTime(c.h.time))}</text>
      <text font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_TITLE_FS}" font-weight="600" fill="#ffffff" y="${titleYStart}">${titleTspans}</text>
      ${venueRender}
    </g>`);

    cursorY += c.cardH + HIGHLIGHT_GAP;
  }

  return `
  <g transform="translate(${PAD_LEFT},100)">
    <rect x="0" y="0" width="200" height="44" rx="22" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <text x="100" y="30" font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="3">MOODTRIP</text>
  </g>

  <text x="${PAD_LEFT}" y="260" font-family="${FONT_FAMILY.inter}" font-size="28" font-weight="500" fill="rgba(255,255,255,0.78)" letter-spacing="4">HÀNH TRÌNH CỦA TÔI</text>
  <text font-family="${FONT_FAMILY.georgia}" font-size="${destFit.fontSize}" font-weight="700" fill="#ffffff" filter="url(#textGlow)" y="${destFirstBaselineY}">${destTspans}</text>

  <g transform="translate(${PAD_LEFT},540)">
    <rect x="0" y="0" width="300" height="180" rx="28" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="150" y="68" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="3">NGÀY</text>
    <text x="150" y="148" font-family="Inter,system-ui,sans-serif" font-size="86" font-weight="800" fill="#ffffff" text-anchor="middle">${days}</text>

    <rect x="330" y="0" width="300" height="180" rx="28" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="480" y="68" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="3">HOẠT ĐỘNG</text>
    <text x="480" y="148" font-family="Inter,system-ui,sans-serif" font-size="86" font-weight="800" fill="#ffffff" text-anchor="middle">${activities}</text>

    <rect x="660" y="0" width="300" height="180" rx="28" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="810" y="68" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="3">CHI PHÍ</text>
    ${statValueSvg(cost, 810, 68, 180, 268, 36, 20)}
  </g>

  <g transform="translate(${PAD_LEFT + 9},772)"><path d="M0,-9 L1.6,-1.6 L9,0 L1.6,1.6 L0,9 L-1.6,1.6 L-9,0 L-1.6,-1.6 Z" fill="${palette.accent}"/></g>
  <text x="${PAD_LEFT + 25}" y="783" font-family="${FONT_FAMILY.inter}" font-size="24" font-weight="700" fill="${palette.accent}" letter-spacing="4">ĐIỂM NHẤN</text>
  ${renderedHighlights.join('')}

  <g transform="translate(${PAD_LEFT},1240)">
    <text x="0" y="34" font-family="Georgia,serif" font-size="34" font-style="italic" fill="rgba(255,255,255,0.92)">Tạo bởi Mơ</text>
    <text x="0" y="74" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="700" fill="rgba(255,255,255,0.65)" letter-spacing="4">moodtrip.app</text>
  </g>`;
}

function layoutSquare(palette: Palette, dest: string, days: number, activities: number, cost: string, highlights: Highlight[]): string {
  const PAD_LEFT = 60;
  const CONTENT_WIDTH = 960;
  const HIGHLIGHTS_TOP = 720;
  const HIGHLIGHTS_BOTTOM_LIMIT = 970;
  const HIGHLIGHTS_BUDGET = HIGHLIGHTS_BOTTOM_LIMIT - HIGHLIGHTS_TOP;

  const DEST_TOP_LIMIT = 260;
  const DEST_BOTTOM_LIMIT = 430;
  const DEST_AVAILABLE_H = DEST_BOTTOM_LIMIT - DEST_TOP_LIMIT;
  const destFit = fitTextToBox(dest, CONTENT_WIDTH, DEST_AVAILABLE_H, 100, 50, 1.18, 2, 'georgia');
  const destLineHeight = destFit.fontSize * 1.18;
  const destBlockH = destFit.lines.length * destLineHeight;
  const destFirstBaselineY = DEST_TOP_LIMIT + (DEST_AVAILABLE_H - destBlockH) / 2 + destFit.fontSize * 0.82;
  const destTspans = renderTspans(destFit.lines, PAD_LEFT, destLineHeight);


  const HIGHLIGHT_TIME_X = 32;
  const HIGHLIGHT_TIME_FS = 22;
  const HIGHLIGHT_TIME_WIDTH = estimateTextWidth('22:00', HIGHLIGHT_TIME_FS, 'inter');
  const HIGHLIGHT_TEXT_LEFT = HIGHLIGHT_TIME_X + Math.max(86, HIGHLIGHT_TIME_WIDTH + 18);
  const HIGHLIGHT_TEXT_WIDTH = CONTENT_WIDTH - HIGHLIGHT_TEXT_LEFT - 32;
  const HIGHLIGHT_TITLE_FS = 22;
  const HIGHLIGHT_TITLE_LH = HIGHLIGHT_TITLE_FS * 1.4;
  const HIGHLIGHT_VENUE_FS = 16;
  const HIGHLIGHT_VENUE_LH = HIGHLIGHT_VENUE_FS * 1.4;
  const HIGHLIGHT_PAD_TOP = 22;
  const HIGHLIGHT_PAD_BETWEEN = 10;
  const HIGHLIGHT_PAD_BOTTOM = 18;
  const HIGHLIGHT_GAP = 14;

  type CardLayout = { h: Highlight; titleLines: string[]; venueLines: string[]; cardH: number };
  const candidates: CardLayout[] = highlights.slice(0, 2).map((h) => {
    const titleLines = wrapText(h.title, HIGHLIGHT_TEXT_WIDTH, HIGHLIGHT_TITLE_FS, 2, 'inter');
    const venueLines = h.venue ? wrapText(h.venue, HIGHLIGHT_TEXT_WIDTH, HIGHLIGHT_VENUE_FS, 1, 'inter') : [];
    const titleBlockH = titleLines.length * HIGHLIGHT_TITLE_LH;
    const venueBlockH = venueLines.length * HIGHLIGHT_VENUE_LH;
    const cardH = Math.max(
      94,
      HIGHLIGHT_PAD_TOP + titleBlockH + (venueLines.length > 0 ? HIGHLIGHT_PAD_BETWEEN + venueBlockH : 0) + HIGHLIGHT_PAD_BOTTOM,
    );
    return { h, titleLines, venueLines, cardH };
  });

  const accepted: CardLayout[] = [];
  let runningHeight = 0;
  for (const c of candidates) {
    const next = runningHeight + c.cardH + (accepted.length > 0 ? HIGHLIGHT_GAP : 0);
    if (next > HIGHLIGHTS_BUDGET) break;
    accepted.push(c);
    runningHeight = next;
  }

  let cursorY = HIGHLIGHTS_TOP;
  const renderedHighlights: string[] = [];

  for (const c of accepted) {
    const titleYStart = HIGHLIGHT_PAD_TOP + HIGHLIGHT_TITLE_FS * 0.82;
    const titleTspans = renderTspans(c.titleLines, HIGHLIGHT_TEXT_LEFT, HIGHLIGHT_TITLE_LH);
    const timeY = titleYStart;

    let venueRender = '';
    if (c.venueLines.length > 0) {
      const titleBlockH = c.titleLines.length * HIGHLIGHT_TITLE_LH;
      const venueY = HIGHLIGHT_PAD_TOP + titleBlockH + HIGHLIGHT_PAD_BETWEEN + HIGHLIGHT_VENUE_FS * 0.82;
      const venueTspans = renderTspans(c.venueLines, HIGHLIGHT_TEXT_LEFT, HIGHLIGHT_VENUE_LH);
      venueRender = `<text font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_VENUE_FS}" fill="rgba(255,255,255,0.78)" y="${venueY}">${venueTspans}</text>`;
    }

    renderedHighlights.push(`
    <g transform="translate(${PAD_LEFT},${cursorY})">
      <rect x="0" y="0" width="${CONTENT_WIDTH}" height="${c.cardH}" rx="20" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="1.5"/>
      <text x="${HIGHLIGHT_TIME_X}" y="${timeY}" font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_TIME_FS}" font-weight="700" fill="${palette.accent}">${escapeXml(formatReelTime(c.h.time))}</text>
      <text font-family="${FONT_FAMILY.inter}" font-size="${HIGHLIGHT_TITLE_FS}" font-weight="600" fill="#ffffff" y="${titleYStart}">${titleTspans}</text>
      ${venueRender}
    </g>`);

    cursorY += c.cardH + HIGHLIGHT_GAP;
  }

  return `
  <g transform="translate(${PAD_LEFT},80)">
    <rect x="0" y="0" width="180" height="40" rx="20" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <text x="90" y="27" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="3">MOODTRIP</text>
  </g>

  <text x="${PAD_LEFT}" y="220" font-family="${FONT_FAMILY.inter}" font-size="22" font-weight="500" fill="rgba(255,255,255,0.78)" letter-spacing="4">HÀNH TRÌNH CỦA TÔI</text>
  <text font-family="${FONT_FAMILY.georgia}" font-size="${destFit.fontSize}" font-weight="700" fill="#ffffff" filter="url(#textGlow)" y="${destFirstBaselineY}">${destTspans}</text>

  <g transform="translate(${PAD_LEFT},460)">
    <rect x="0" y="0" width="300" height="170" rx="26" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="150" y="62" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="2">NGÀY</text>
    <text x="150" y="138" font-family="Inter,system-ui,sans-serif" font-size="82" font-weight="800" fill="#ffffff" text-anchor="middle">${days}</text>

    <rect x="330" y="0" width="300" height="170" rx="26" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="480" y="62" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="2">HOẠT ĐỘNG</text>
    <text x="480" y="138" font-family="Inter,system-ui,sans-serif" font-size="82" font-weight="800" fill="#ffffff" text-anchor="middle">${activities}</text>

    <rect x="660" y="0" width="300" height="170" rx="26" fill="rgba(10,14,26,0.44)" stroke="rgba(255,255,255,0.30)" stroke-width="2"/>
    <text x="810" y="62" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="700" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="2">CHI PHÍ</text>
    ${statValueSvg(cost, 810, 62, 170, 268, 32, 18)}
  </g>

  <g transform="translate(${PAD_LEFT + 8},671)"><path d="M0,-8 L1.4,-1.4 L8,0 L1.4,1.4 L0,8 L-1.4,1.4 L-8,0 L-1.4,-1.4 Z" fill="${palette.accent}"/></g>
  <text x="${PAD_LEFT + 22}" y="680" font-family="${FONT_FAMILY.inter}" font-size="20" font-weight="700" fill="${palette.accent}" letter-spacing="4">ĐIỂM NHẤN</text>
  ${renderedHighlights.join('')}

  <g transform="translate(${PAD_LEFT},980)">
    <text x="0" y="34" font-family="Georgia,serif" font-size="32" font-style="italic" fill="rgba(255,255,255,0.92)">Tạo bởi Mơ</text>
    <text x="0" y="74" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="700" fill="rgba(255,255,255,0.65)" letter-spacing="4">moodtrip.app</text>
  </g>`;
}

function buildReelSvg(itinerary: ItineraryPlan, format: Format): string {
  const dest = itinerary.destination;
  const days = itinerary.timeline.length;
  const activities = itinerary.timeline.reduce((s, d) => s + d.schedule.length, 0);
  const cost = itinerary.budget_summary?.total_estimated || '—';
  const highlights = topHighlights(itinerary, 4);
  const palette = paletteFor(itinerary.destination);
  const seed = dest.split('').reduce((a, c) => a + c.charCodeAt(0), 7) * (format.w + format.h);
  const sparkleCount = Math.round((format.w * format.h) / 18000);
  const sparkles = buildSparkles(format.w, format.h, seed, sparkleCount);

  let body: string;
  if (format.id === 'story') body = layoutStory(palette, dest, days, activities, cost, highlights);
  else if (format.id === 'portrait') body = layoutPortrait(palette, dest, days, activities, cost, highlights);
  else body = layoutSquare(palette, dest, days, activities, cost, highlights);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${format.w}" height="${format.h}" viewBox="0 0 ${format.w} ${format.h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.c1}"/>
      <stop offset="48%" stop-color="${palette.c2}"/>
      <stop offset="100%" stop-color="${palette.c3}"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.18" cy="0.12" r="0.7">
      <stop offset="0%" stop-color="${palette.glow}"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.85" cy="0.85" r="0.75">
      <stop offset="0%" stop-color="rgba(252,211,77,0.32)"/>
      <stop offset="100%" stop-color="rgba(252,211,77,0)"/>
    </radialGradient>
    <radialGradient id="glow3" cx="0.5" cy="0.5" r="0.95">
      <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
      <stop offset="80%" stop-color="rgba(0,0,0,0.05)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.30)"/>
    </radialGradient>
    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="${format.w}" height="${format.h}" fill="url(#bg)"/>
  <rect width="${format.w}" height="${format.h}" fill="url(#glow1)"/>
  <rect width="${format.w}" height="${format.h}" fill="url(#glow2)"/>
  <g opacity="0.55">${sparkles}</g>
  <rect width="${format.w}" height="${format.h}" fill="url(#glow3)"/>
  ${body}
</svg>`;
}

export const TripReelModal: React.FC<TripReelModalProps> = ({ itinerary, open, onClose }) => {
  const [formatId, setFormatId] = useState<FormatId>('story');
  const [copied, setCopied] = useState(false);
  const format = FORMATS[formatId];
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const svg = useMemo(() => buildReelSvg(itinerary, format), [itinerary, format]);
  const dataUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);

  useBodyScrollLock(open);
  useEscapeKey(open, onClose);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => closeBtnRef.current?.focus(), 400);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const handleDownloadSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = itinerary.destination
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase();
    a.download = `moodtrip-${slug}-${format.id}-${format.w}x${format.h}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadPng = async () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = format.w;
    canvas.height = format.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, format.w, format.h);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = itinerary.destination
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .toLowerCase();
      a.download = `moodtrip-${slug}-${format.id}-${format.w}x${format.h}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  const handleCopy = async () => {
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/svg+xml': blob })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      return;
    } catch (writeErr) {
      console.warn('[reel] clipboard.write unavailable, falling back to text', writeErr);
    }
    try {
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
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
          role="dialog"
          aria-modal="true"
          aria-label={`Tạo Reel cho ${itinerary.destination}`}
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
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
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="absolute -top-2 -right-2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white border border-white/25 transition-colors"
              aria-label="Đóng"
            >
              <IconX className="w-4 h-4" />
            </button>

            <div role="tablist" aria-label="Định dạng" className="flex items-center gap-1 p-1 rounded-full bg-white/[0.06] border border-white/10">
              {Object.values(FORMATS).map((f) => {
                const active = f.id === formatId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFormatId(f.id)}
                    className={`relative inline-flex items-center min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      active ? 'bg-white text-slate-900' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] uppercase tracking-widest text-white/60 font-semibold">
              {format.w} × {format.h} · {format.platforms}
            </p>

            <img
              key={formatId}
              src={dataUrl}
              alt={`Reel preview cho ${itinerary.destination}`}
              className="w-full max-h-[68vh] rounded-2xl shadow-2xl shadow-black/60 border border-white/15"
              style={{ aspectRatio: format.aspect, objectFit: 'contain', background: '#0a0e1a' }}
            />

            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/30 hover:from-teal-400 hover:to-cyan-400 transition-colors"
              >
                <IconDownload className="w-4 h-4" />
                Tải PNG
              </button>
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/15 transition-colors"
              >
                <IconDownload className="w-4 h-4" />
                SVG
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/15 transition-colors"
              >
                {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                {copied ? 'Đã copy' : 'Copy'}
              </button>
            </div>

            <p className="text-xs text-white/65 text-center max-w-xs inline-flex items-center justify-center gap-1.5">
              <IconSparkles className="w-3.5 h-3.5" />
              Đăng trực tiếp lên Instagram Reels, TikTok, Facebook Story.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
