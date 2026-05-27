import { loadEnv, type Plugin, type ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

interface DevEdgeProxyOptions {
  geminiApiKey?: string;
  mockItinerary?: boolean;
}

const FAKE_ANON_TOKEN_TTL_SECONDS = 60 * 60;

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

const MOCK_DESTINATION_MARKER = '[MOCK] Đà Lạt (fixture)';

function buildMockGeminiResponse(): unknown {
  const sampleItinerary = {
    destination: MOCK_DESTINATION_MARKER,
    overview: '[FIXTURE — not real Gemini output] Hành trình 2 ngày 1 đêm tại Đà Lạt — thành phố ngàn hoa với khí hậu mát mẻ quanh năm. Kết hợp khám phá thiên nhiên, văn hóa cà phê và những khoảnh khắc lãng mạn bên hồ Xuân Hương.',
    timeline: [
      {
        day: 'Ngày 1',
        title: 'Khám phá trung tâm Đà Lạt',
        weather: { temperature: '15-22°C', condition: 'Mát, có sương', humidity: '78%', wind: '8 km/h', note: 'Tốt cho đi bộ buổi sáng' },
        schedule: [
          { time: '08:00', activity: 'Cà phê sáng bên Hồ Xuân Hương', venue: 'Cafe Tùng', estimated_cost: '50.000 VND', google_maps_link: 'https://maps.google.com/?q=Cafe+Tung+Da+Lat', is_trending: true, trending_reason: 'Hot trên TikTok' },
          { time: '10:00', activity: 'Tham quan Ga Đà Lạt cổ', venue: 'Ga Đà Lạt', estimated_cost: '40.000 VND' },
          { time: '12:30', activity: 'Ăn trưa bánh tráng nướng', venue: 'Dì Đinh', estimated_cost: '80.000 VND' },
          { time: '17:00', activity: 'Ngắm hoàng hôn Hồ Xuân Hương', venue: 'Hồ Xuân Hương', estimated_cost: '100.000 VND' },
          { time: '19:30', activity: 'Lẩu gà lá é tối', venue: 'Tao Ngộ', estimated_cost: '300.000 VND' },
        ],
      },
      {
        day: 'Ngày 2',
        title: 'Thung lũng Tình Yêu & ra về',
        weather: { temperature: '14-20°C', condition: 'Nắng nhẹ', note: 'Tốt cho check-in' },
        schedule: [
          { time: '08:00', activity: 'Ăn sáng phở khô Gia Lai', venue: 'Phở Khô Hồng', estimated_cost: '60.000 VND' },
          { time: '09:30', activity: 'Thung lũng Tình Yêu — check-in', venue: 'Thung lũng Tình Yêu', estimated_cost: '250.000 VND', is_trending: true, trending_reason: '50K reviews 4.6★' },
          { time: '12:00', activity: 'Nem nướng Bà Nghĩa', venue: 'Nem Nướng Bà Nghĩa', estimated_cost: '120.000 VND' },
          { time: '16:00', activity: 'Trả phòng, ra sân bay', venue: 'Sân bay Liên Khương' },
        ],
      },
    ],
    food: [
      { name: 'Bánh tráng nướng', description: 'Pizza Việt Nam, vỏ giòn, topping trứng + thịt băm.' },
      { name: 'Lẩu gà lá é', description: 'Đặc sản Đà Lạt, gà ta ngọt thanh.' },
      { name: 'Nem nướng', description: 'Cuốn bánh tráng, rau sống, chấm chua ngọt.' },
    ],
    accommodation: [
      { name: 'Ana Mandara Villas', type: 'Resort 5★', reason: 'Villa kiểu Pháp, view rừng thông.' },
    ],
    tips: ['Mang áo khoác mỏng', 'Đặt phòng trước', 'Đi xe máy thuê'],
    packing_suggestions: [{ item: 'Áo khoác mỏng', reason: 'Đà Lạt mát 15-22°C.' }],
    budget_summary: {
      total_estimated: '3.500.000 VND',
      breakdown: [
        { category: 'Di chuyển', amount: '900.000 VND' },
        { category: 'Ăn uống', amount: '1.200.000 VND' },
        { category: 'Lưu trú', amount: '600.000 VND' },
      ],
      vs_budget_note: 'Trong khoảng ngân sách bạn đặt.',
    },
  };
  return {
    candidates: [{ content: { parts: [{ text: JSON.stringify(sampleItinerary) }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 800, totalTokenCount: 900 },
  };
}

async function callGeminiDirect(body: unknown, apiKey: string, model: string): Promise<unknown> {
  const modelName = model === 'flash-lite' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
  }
  return res.json();
}

export function devEdgeProxy(opts: DevEdgeProxyOptions = {}): Plugin {
  return {
    name: 'moodtrip-dev-edge-proxy',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, server.config.root, '');
      const apiKey = opts.geminiApiKey || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
      const mockFlag = env.MOCK_ITINERARY === '1' || process.env.MOCK_ITINERARY === '1';
      const useMock = opts.mockItinerary || mockFlag;

      if (useMock) {
        server.config.logger.warn(
          '\n\u001b[33m\u2502 [dev-edge-proxy] MOCK MODE \u2014 /v1/generate returns the \u0110\u00e0 L\u1ea1t fixture, not real Gemini.\u001b[0m\n\u001b[33m\u2502 Unset MOCK_ITINERARY to use real Gemini.\u001b[0m\n',
        );
      } else if (!apiKey) {
        server.config.logger.error(
          '\n\u001b[31m\u2502 [dev-edge-proxy] MISSING GEMINI_API_KEY \u2014 /v1/generate will return 500.\u001b[0m\n\u001b[31m\u2502 Add GEMINI_API_KEY=... to .env.local, or set MOCK_ITINERARY=1 to use the fixture.\u001b[0m\n',
        );
      } else {
        server.config.logger.info(
          `\n\u001b[32m\u2502 [dev-edge-proxy] LIVE Gemini for /v1/generate (key ${apiKey.slice(0, 6)}\u2026${apiKey.slice(-4)})\u001b[0m\n`,
        );
      }

      server.middlewares.use('/v1/anon-token', (req, res, next) => {
        if (req.method !== 'POST') return next();
        sendJson(res, 200, {
          token: `dev-anon-${Date.now()}`,
          expiresIn: FAKE_ANON_TOKEN_TTL_SECONDS,
          tier: 'anon',
        });
      });

      server.middlewares.use('/v1/generate', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        try {
          const body = (await readJsonBody(req)) as { model?: string; contents?: unknown; generationConfig?: unknown; systemInstruction?: unknown };
          if (useMock) {
            sendJson(res, 200, buildMockGeminiResponse());
            return;
          }
          if (!apiKey) {
            sendJson(res, 500, {
              code: 'NO_GEMINI_KEY',
              error: 'GEMINI_API_KEY missing from .env.local. Add it, or set MOCK_ITINERARY=1 to use the fixture.',
            });
            return;
          }
          const result = await callGeminiDirect(
            {
              contents: body.contents,
              generationConfig: body.generationConfig,
              systemInstruction: body.systemInstruction,
            },
            apiKey,
            body.model ?? 'flash',
          );
          sendJson(res, 200, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown';
          server.config.logger.error(`[dev-edge-proxy] /v1/generate error: ${message}`);
          sendJson(res, 502, { code: 'DEV_PROXY_ERROR', error: message });
        }
      });

      server.middlewares.use('/v1/health', (_req, res) => {
        const mode = useMock ? 'mock' : apiKey ? 'live-gemini' : 'misconfigured';
        sendJson(res, 200, { ok: mode !== 'misconfigured', mode });
      });

      server.middlewares.use('/v1/spend-status', (_req, res) => {
        sendJson(res, 200, { ok: true, mode: 'dev', dailyBudgetUsd: 0, dailySpentUsd: 0 });
      });
    },
  };
}
