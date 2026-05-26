import type { FormData, ItineraryPlan } from '../types';
import { EdgeProxyError, extractText, generate } from './edgeProxyClient';
import { buildMoSystemPrompt, detectRegion } from './moPersona';

export interface ItinerarySkeleton {
  destination: string;
  overview: string;
  timeline: Array<{
    day: string;
    title: string;
    schedule: Array<{
      time: string;
      activity: string;
      venue?: string;
      google_maps_link?: string;
    }>;
  }>;
  tips: string[];
}

export interface ItineraryEnrichment {
  food?: ItineraryPlan['food'];
  accommodation?: ItineraryPlan['accommodation'];
  packing_suggestions?: ItineraryPlan['packing_suggestions'];
  traffic_alerts?: ItineraryPlan['traffic_alerts'];
  safety_alerts?: ItineraryPlan['safety_alerts'];
  budget_summary?: ItineraryPlan['budget_summary'];
}

const SKELETON_SCHEMA_TEXT = `Trả về JSON với cấu trúc sau, không thêm trường thừa:
{
  "destination": string,
  "overview": string (2-3 câu cảm xúc),
  "timeline": [
    {
      "day": "Ngày 1",
      "title": "Tiêu đề ngày",
      "schedule": [
        { "time": "08:00", "activity": "...", "venue": "...", "google_maps_link": "..." }
      ]
    }
  ],
  "tips": [3-5 mẹo ngắn dạng string]
}`;

const ENRICHMENT_SCHEMA_TEXT = `Trả về JSON với cấu trúc sau (mọi trường đều optional, chỉ trả lại trường cần thiết):
{
  "food": [{ "name": string, "description": string }],
  "accommodation": [{ "name": string, "type": string, "reason": string }],
  "packing_suggestions": [{ "item": string, "reason": string }],
  "traffic_alerts": [{ "area": string, "issue": string, "suggestion": string }],
  "safety_alerts": [{ "type": "festival"|"religious"|"safety"|"event", "title": string, "description": string, "advice": string }],
  "budget_summary": {
    "total_estimated": string,
    "breakdown": [{ "category": string, "amount": string, "note": string }],
    "vs_budget_note": string
  }
}`;

function strictJsonDirective(): string {
  return 'CHỈ trả về JSON hợp lệ. Không markdown, không code fence, không lời dẫn, không giải thích. Bắt đầu bằng `{` và kết thúc bằng `}`.';
}

function buildSkeletonPrompt(form: FormData): string {
  const duration = form.duration.days > 0 ? `${form.duration.days} ngày` : 'trong ngày';
  const moods = (form.moods.length ? form.moods : form.shortMoods ?? []).join(', ') || 'thư giãn';
  const note = form.personalNote?.trim() ? `\nGhi chú cá nhân: "${form.personalNote.trim()}".` : '';

  return `Lập kế hoạch du lịch ${duration} đến ${form.destination || 'một điểm đến phù hợp'} cho người dùng đang muốn cảm thấy: ${moods}.
Điểm xuất phát: ${form.startLocation || 'không xác định'}.
Ngân sách mỗi người: ${form.budget.toLocaleString('vi-VN')} VNĐ.${note}

YÊU CẦU: Chỉ trả về khung lịch trình (skeleton) — không cần đề xuất ẩm thực chi tiết, chỗ nghỉ, hành lý, giao thông, an toàn, ngân sách. Phần đó sẽ được hỏi sau.

${SKELETON_SCHEMA_TEXT}

${strictJsonDirective()}`;
}

function buildEnrichmentPrompt(skeleton: ItinerarySkeleton, form: FormData): string {
  return `Đã có khung lịch trình sau cho ${skeleton.destination}:

${skeleton.timeline
  .map((d) => `${d.day}: ${d.title}\n${d.schedule.map((s) => `- ${s.time} ${s.activity}`).join('\n')}`)
  .join('\n\n')}

Ngân sách mỗi người: ${form.budget.toLocaleString('vi-VN')} VNĐ.

YÊU CẦU: Bổ sung thông tin chi tiết cho lịch trình trên: gợi ý món ăn (3-5 món), gợi ý chỗ nghỉ (2-3 lựa chọn), gợi ý trang phục, cảnh báo giao thông + an toàn nếu có, và bảng tổng chi phí ước tính.

${ENRICHMENT_SCHEMA_TEXT}

${strictJsonDirective()}`;
}

function tryParseJson<T>(raw: string): T {
  const trimmed = raw.trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  const candidate = first !== -1 && last > first ? trimmed.slice(first, last + 1) : trimmed;
  return JSON.parse(candidate) as T;
}

export async function generateItinerarySkeleton(form: FormData): Promise<ItinerarySkeleton> {
  const region = detectRegion(form.destination);
  const systemInstruction = buildMoSystemPrompt({ destination: form.destination, region });

  try {
    const response = await generate(
      [{ role: 'user', parts: [{ text: buildSkeletonPrompt(form) }] }],
      {
        model: 'flash-lite',
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      },
    );
    const text = extractText(response);
    const parsed = tryParseJson<ItinerarySkeleton>(text);
    if (!parsed.destination || !Array.isArray(parsed.timeline)) {
      throw new Error('INVALID_STRUCTURE');
    }
    return parsed;
  } catch (err) {
    if (err instanceof EdgeProxyError) {
      if (err.code === 'RATE_LIMIT_EXCEEDED') throw new Error('RATE_LIMIT_EXCEEDED');
      if (err.code === 'BUDGET_EXCEEDED') throw new Error('BUDGET_EXCEEDED');
      throw new Error(`Lỗi proxy: ${err.message}`);
    }
    throw err;
  }
}

export async function enrichItinerary(
  skeleton: ItinerarySkeleton,
  form: FormData,
): Promise<ItineraryEnrichment> {
  const region = detectRegion(skeleton.destination);
  const systemInstruction = buildMoSystemPrompt({ destination: skeleton.destination, region });

  const response = await generate(
    [{ role: 'user', parts: [{ text: buildEnrichmentPrompt(skeleton, form) }] }],
    {
      model: 'flash',
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 6144,
        responseMimeType: 'application/json',
      },
    },
  );
  const text = extractText(response);
  return tryParseJson<ItineraryEnrichment>(text);
}

export function mergeSkeletonAndEnrichment(
  skeleton: ItinerarySkeleton,
  enrichment: ItineraryEnrichment | null,
): ItineraryPlan {
  return {
    destination: skeleton.destination,
    overview: skeleton.overview,
    timeline: skeleton.timeline.map((d) => ({
      day: d.day,
      title: d.title,
      schedule: d.schedule.map((s) => ({
        time: s.time,
        activity: s.activity,
        venue: s.venue,
        google_maps_link: s.google_maps_link,
      })),
    })),
    tips: skeleton.tips,
    food: enrichment?.food ?? [],
    accommodation: enrichment?.accommodation ?? [],
    packing_suggestions: enrichment?.packing_suggestions ?? [],
    traffic_alerts: enrichment?.traffic_alerts ?? [],
    safety_alerts: enrichment?.safety_alerts ?? [],
    budget_summary: enrichment?.budget_summary,
  };
}
