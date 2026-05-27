import type { ItineraryPlan } from '../types';
import { EdgeProxyError, extractText, generate } from './edgeProxyClient';
import { buildMoSystemPrompt, detectRegion } from './moPersona';

export interface MoLetter {
  greeting: string;
  body: string[];
  signoff: string;
  doodleSeed: string;
}

const LETTER_SCHEMA = `Trả về JSON với cấu trúc:
{
  "greeting": string (chào người dùng theo phong cách Mơ, 1 câu),
  "body": [3-5 đoạn ngắn, mỗi đoạn 1-2 câu, gợi cụ thể vài khoảnh khắc trong chuyến đi],
  "signoff": string (kết thư, có thể gợi tới chuyến kế tiếp),
  "doodleSeed": string (1 từ duy nhất mô tả hình minh hoạ kèm thư, ví dụ "nón lá", "cafe-sữa-đá")
}`;

const STRICT = 'CHỈ trả về JSON hợp lệ. Không markdown, không bọc trong code fence, không lời dẫn.';

function buildLetterPrompt(trip: ItineraryPlan): string {
  const highlights = trip.timeline
    .flatMap((day) => day.schedule.slice(0, 2).map((s) => `- ${day.day} · ${s.time} ${s.activity}`))
    .slice(0, 8)
    .join('\n');
  return `Bạn vừa hoàn thành chuyến đi sau:
Điểm đến: ${trip.destination}
Tổng quan: ${trip.overview}
Một vài khoảnh khắc nổi bật:
${highlights}

Viết cho người dùng một bức thư tay ngắn (cảm xúc, không sáo rỗng) — như một người bạn từng đồng hành — nhắc lại vài chi tiết cụ thể từ chuyến đi.

${LETTER_SCHEMA}

${STRICT}`;
}

function tryParseJson<T>(raw: string): T {
  const trimmed = raw.trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  const candidate = first !== -1 && last > first ? trimmed.slice(first, last + 1) : trimmed;
  return JSON.parse(candidate) as T;
}

export async function composeMoLetter(trip: ItineraryPlan): Promise<MoLetter> {
  const region = detectRegion(trip.destination);
  const systemInstruction = buildMoSystemPrompt({ destination: trip.destination, region });

  try {
    const response = await generate(
      [{ role: 'user', parts: [{ text: buildLetterPrompt(trip) }] }],
      {
        model: 'flash-lite',
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048, responseMimeType: 'application/json' },
      },
    );
    const text = extractText(response);
    const parsed = tryParseJson<MoLetter>(text);
    if (!parsed.greeting || !Array.isArray(parsed.body) || parsed.body.length === 0) {
      throw new Error('INVALID_LETTER_STRUCTURE');
    }
    return parsed;
  } catch (err) {
    if (err instanceof EdgeProxyError) {
      if (err.code === 'RATE_LIMIT_EXCEEDED') throw new Error('RATE_LIMIT_EXCEEDED');
      if (err.code === 'BUDGET_EXCEEDED') throw new Error('BUDGET_EXCEEDED');
    }
    throw err;
  }
}

const DOODLE_SVG_LIBRARY: Record<string, string> = {
  'nón lá': '<path d="M40 80 Q90 5 140 80 Z" stroke="#0d9488" stroke-width="2" fill="none"/><line x1="90" y1="80" x2="90" y2="100" stroke="#0d9488" stroke-width="2"/>',
  'cafe': '<rect x="55" y="40" width="50" height="40" rx="4" fill="none" stroke="#0d9488" stroke-width="2"/><path d="M105 50 Q120 55 105 70" stroke="#0d9488" fill="none" stroke-width="2"/><path d="M65 25 Q70 35 65 40 M75 25 Q80 35 75 40" stroke="#94a3b8" fill="none" stroke-width="1.5"/>',
  'biển': '<path d="M20 60 Q40 50 60 60 T100 60 T140 60" stroke="#06b6d4" stroke-width="2" fill="none"/><path d="M20 75 Q40 65 60 75 T100 75 T140 75" stroke="#06b6d4" stroke-width="2" fill="none"/><circle cx="120" cy="30" r="10" fill="none" stroke="#f59e0b" stroke-width="2"/>',
  'núi': '<polyline points="20,90 50,40 75,65 100,30 130,80 150,90" fill="none" stroke="#0d9488" stroke-width="2"/>',
};

export function buildDoodleSvg(seed: string): string {
  const key = seed.toLowerCase();
  const inner = Object.entries(DOODLE_SVG_LIBRARY).find(([k]) => key.includes(k))?.[1] ??
    `<text x="80" y="65" font-family="Caveat, cursive" font-size="36" fill="#0d9488" text-anchor="middle">~ ${escapeXmlText(seed)} ~</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="110" viewBox="0 0 160 110">${inner}</svg>`;
}

function escapeXmlText(s: string): string {
  return s.replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));
}
