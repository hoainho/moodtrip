import type { FormData, Mood } from '../types';
import { EdgeProxyError, extractText, generate } from './edgeProxyClient';
import { buildMoSystemPrompt, detectRegion } from './moPersona';

export interface AntiItinerary {
  vibe: string;
  direction: string;
  whisper: string;
}

const STRICT_JSON = 'CHỈ trả về JSON hợp lệ. Không markdown, không lời dẫn, không giải thích.';

const SCHEMA = `Trả về JSON đúng cấu trúc:
{
  "vibe": string (1 câu cảm xúc rất ngắn, không mô tả lịch trình),
  "direction": string (1 hướng đi cụ thể nhưng không có địa chỉ — VD: "đi về phía tây cho tới khi thấy cánh cửa vàng"),
  "whisper": string (1 câu thì thầm của Mơ, mang tính nội tâm — không có lời khuyên thực dụng)
}`;

function buildPrompt(form: FormData): string {
  const moods = (form.moods.length ? form.moods : (form.shortMoods ?? []).map(String) as Mood[]).slice(0, 3).join(', ');
  const dest = form.destination?.trim() || 'một vùng đất chưa rõ tên';
  return `Người dùng đang cần Anti-Itinerary cho ${dest}. Cảm xúc hôm nay: ${moods || 'mơ hồ'}.

YÊU CẦU: Tuyệt đối KHÔNG tạo schedule, KHÔNG ghi giờ, KHÔNG liệt kê địa điểm cụ thể. Đây là "phản lịch trình" — chỉ một cảm giác, một hướng đi, và một câu thì thầm.

${SCHEMA}

${STRICT_JSON}`;
}

function tryParse<T>(raw: string): T {
  const trimmed = raw.trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  const candidate = first !== -1 && last > first ? trimmed.slice(first, last + 1) : trimmed;
  return JSON.parse(candidate) as T;
}

export async function generateAntiItinerary(form: FormData): Promise<AntiItinerary> {
  const region = detectRegion(form.destination);
  const systemInstruction = buildMoSystemPrompt({ destination: form.destination, region });

  try {
    const response = await generate(
      [{ role: 'user', parts: [{ text: buildPrompt(form) }] }],
      {
        model: 'flash-lite',
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      },
    );
    const text = extractText(response);
    const parsed = tryParse<AntiItinerary>(text);
    if (!parsed.vibe || !parsed.direction || !parsed.whisper) {
      throw new Error('INVALID_ANTI_ITINERARY');
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
