import type { FormData, ItineraryPlan, Duration } from '../types';

const PROXY_URL = 'https://proxy.hoainho.info';
const PROXY_API_KEY = 'hoainho';
const MODEL = 'gemini-2.5-flash';

function buildDurationText(duration: Duration): string {
    if (duration.days <= 0) return 'Chuyến đi trong ngày';
    const dayText = `${duration.days} ngày`;
    const nightText = duration.nights > 0 ? ` ${duration.nights} đêm` : '';
    return dayText + nightText;
}

function buildPrompt(data: FormData): string {
  const moodTextMap = {
    'relax': 'Thư giãn, nghỉ dưỡng, nhẹ nhàng.',
    'explore': 'Năng động, khám phá văn hóa, lịch sử và các hoạt động sôi nổi.',
    'nature': 'Hòa mình với thiên nhiên, đi bộ đường dài, ngắm cảnh đẹp hoang sơ.',
    'romantic': 'Lãng mạn, dành cho cặp đôi, với các hoạt động và không gian riêng tư, ngọt ngào.',
    'adventure': 'Mạo hiểm, phiêu lưu, thử thách bản thân với các hoạt động như leo núi, trekking, lặn biển.',
    'cultural': 'Tìm hiểu sâu về văn hóa, lịch sử, nghệ thuật, tham quan bảo tàng, di tích và làng nghề truyền thống.',
  };

  const budgetDescription =
    data.budget < 2000000
      ? 'Tiết kiệm (ưu tiên các lựa chọn miễn phí, giá rẻ, ăn uống bình dân, ở homestay/nhà nghỉ)'
      : data.budget < 5000000
      ? 'Trung bình (cân bằng giữa chi phí và trải nghiệm, có thể ăn nhà hàng, ở khách sạn 3 sao)'
      : 'Thoải mái (ưu tiên trải nghiệm cao cấp, ăn uống ở nhà hàng nổi tiếng, ở khách sạn 4-5 sao, resort)';
  
  const startDateText = data.startDate ? `\n    - Ngày khởi hành dự kiến: ${data.startDate}` : '';

  return `
    Bạn là một chuyên gia du lịch ảo thông thái và sáng tạo. Nhiệm vụ của bạn là tạo ra một kế hoạch du lịch chi tiết, hấp dẫn và thực tế dựa trên các yêu cầu sau đây.

    Yêu cầu của người dùng:
    - Nơi khởi hành: ${data.startLocation || 'Không xác định.'}
    - Điểm đến: ${data.destination || 'một địa điểm du lịch thú vị và đặc biệt bất kỳ trên thế giới (hãy gợi ý một địa điểm cụ thể phù hợp)'}${startDateText}
    - Thời gian: ${buildDurationText(data.duration)}
    - Ngân sách mỗi người (ước tính): ${data.budget.toLocaleString('vi-VN')} VNĐ (${budgetDescription})
    - Tâm trạng mong muốn: ${moodTextMap[data.mood]}

    Vui lòng tạo một lịch trình chi tiết và trả về dưới dạng một đối tượng JSON duy nhất.
    TUYỆT ĐỐI KHÔNG sử dụng markdown code fences (như \`\`\`json ... \`\`\`).
    JSON phải có cấu trúc chính xác như sau. Với mỗi hoạt động trong "schedule", hãy cung cấp "venue", "estimated_cost" và "google_maps_link" cho địa điểm đó. Thêm vào đó, hãy cung cấp một mảng "travel_tips" để gợi ý cách di chuyển từ địa điểm TRƯỚC ĐÓ tới địa điểm hiện tại. Đối với hoạt động đầu tiên trong ngày, điểm xuất phát là nơi ở được gợi ý. Mỗi mẹo trong "travel_tips" phải có "method", "duration", "notes" và "google_maps_link" (URL chỉ đường). Với mỗi ngày trong "timeline", hãy thêm "weather_note".
    {
      "destination": "Tên địa điểm cụ thể (ví dụ: Paris, Pháp)",
      "overview": "Một đoạn văn ngắn (3-4 câu) mô tả tổng quan và truyền cảm hứng về chuyến đi, khơi gợi cảm xúc phù hợp với tâm trạng đã chọn.",
      "timeline": [
        {
          "day": "Ngày 1",
          "title": "Một tiêu đề hấp dẫn cho ngày, ví dụ: 'Chạm ngõ kinh đô ánh sáng'",
          "weather_note": "Dự báo trời se lạnh và có thể có sương mù vào buổi sáng. Nhớ mang theo áo khoác mỏng.",
          "schedule": [
            {
              "time": "08:00 - 09:00",
              "activity": "Ăn sáng với món croissant và cà phê.",
              "venue": "Boulangerie-Pâtisserie, khu Montmartre",
              "estimated_cost": "10 - 15 EUR/người",
              "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Boulangerie-Pâtisserie+Montmartre+Paris",
              "travel_tips": [
                  {
                      "method": "Đi bộ",
                      "duration": "Khoảng 10 phút",
                      "notes": "Đi bộ từ khách sạn để tận hưởng không khí buổi sáng của Paris.",
                      "google_maps_link": "https://www.google.com/maps/dir/?api=1&origin=Generator+Paris&destination=Boulangerie-Pâtisserie+Montmartre+Paris&travelmode=walking"
                  }
              ]
            }
          ]
        }
      ],
      "food": [
        { "name": "Croissant", "description": "Bánh sừng bò nổi tiếng của Pháp, thơm bơ và giòn tan." }
      ],
      "accommodation": [
        { "name": "Generator Paris", "type": "Hostel", "reason": "Lựa chọn tuyệt vời cho ngân sách tiết kiệm, không gian trẻ trung và dễ kết bạn." }
      ],
      "tips": [
        "Nên mua vé tham quan các địa điểm nổi tiếng trực tuyến để tránh xếp hàng."
      ]
    }

    Hãy đảm bảo các gợi ý về địa điểm, món ăn, nơi ở phải thực tế, phù hợp với điểm đến và ngân sách đã cho.
  `;
}

export const generateItinerary = async (formData: FormData): Promise<ItineraryPlan> => {
  const prompt = buildPrompt(formData);

  try {
    const response = await fetch(`${PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PROXY_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Bạn là một chuyên gia du lịch. Luôn trả về JSON hợp lệ theo cấu trúc được yêu cầu. KHÔNG sử dụng markdown code fences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8192,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API_KEY_INVALID');
      }
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = responseData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Phản hồi rỗng từ AI.');
    }

    let jsonStr = content.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as ItineraryPlan;
    
    if (!parsedData.destination || !parsedData.timeline || !parsedData.overview) {
        throw new Error("Cấu trúc lịch trình nhận về từ AI không hợp lệ.");
    }

    return parsedData;
  } catch (error) {
    console.error("Error calling Proxy API:", error);
    if (error instanceof Error) {
        if (error.message === 'API_KEY_INVALID' || error.message === 'RATE_LIMIT_EXCEEDED') {
            throw error;
        }
    }
    throw new Error("Không thể tạo lịch trình. AI có thể đang bận. Vui lòng thử lại sau.");
  }
};
