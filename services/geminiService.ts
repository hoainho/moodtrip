import type { FormData, ItineraryPlan, Duration, ShortTripMood } from '../types';

const PROXY_URL = 'https://proxy.hoainho.info';
const PROXY_API_KEY = 'hoainho';
const MODEL = 'gemini-2.5-flash';

function buildDurationText(duration: Duration): string {
    if (duration.days <= 0) return 'Chuyến đi trong ngày';
    const dayText = `${duration.days} ngày`;
    const nightText = duration.nights > 0 ? ` ${duration.nights} đêm` : '';
    return dayText + nightText;
}

function buildShortTripPrompt(data: FormData): string {
  const shortMoodTextMap: Record<ShortTripMood, string> = {
    'date': 'Hẹn hò lãng mạn, không gian đẹp và riêng tư cho cặp đôi.',
    'cafe': 'Cà phê, quán xinh, không gian check-in đẹp, đồ uống ngon.',
    'food_tour': 'Khám phá ẩm thực đường phố, quán ăn nổi tiếng, món trending.',
    'nightlife': 'Vui chơi về đêm, bar, pub, rooftop, âm nhạc sống động.',
    'fun': 'Vui chơi giải trí, hoạt động nhóm, trải nghiệm mới lạ và sôi nổi.',
    'chill': 'Thư giãn nhẹ nhàng, dạo phố, ngắm cảnh, tận hưởng không khí thành phố.',
  };

  const moodDescriptions = (data.shortMoods || []).map((m) => shortMoodTextMap[m]).filter(Boolean);
  const moodText = moodDescriptions.length > 0
    ? moodDescriptions.join(' Kết hợp với: ')
    : 'Khám phá thành phố một cách thoải mái, đa dạng trải nghiệm.';

  const personalNoteText = data.personalNote?.trim()
    ? `\n    - Ý kiến cá nhân của người dùng: "${data.personalNote.trim()}". HÃY ĐẶC BIỆT CHÚ Ý đến ý kiến này và cá nhân hóa lịch trình phù hợp.`
    : '';

  const budgetDescription =
    data.budget < 500000
      ? 'Tiết kiệm (ưu tiên quán bình dân, hoạt động miễn phí, street food)'
      : data.budget < 2000000
      ? 'Trung bình (quán cà phê đẹp, nhà hàng tầm trung, có thể vào các điểm có phí)'
      : 'Thoải mái (nhà hàng cao cấp, bar rooftop, trải nghiệm premium)';

  const timeRange = data.startTime && data.endTime
    ? `từ ${data.startTime} đến ${data.endTime}`
    : 'trong vài giờ';

  return `
    Bạn là một chuyên gia khám phá thành phố, am hiểu các địa điểm trending và hot nhất hiện tại. Nhiệm vụ của bạn là tạo ra một kế hoạch khám phá thành phố NGẮN HẠN (trong ngày), tập trung vào các địa điểm TRENDING, phổ biến và được yêu thích nhất.

    Yêu cầu của người dùng:
    - Thành phố: ${data.destination || 'một thành phố thú vị (hãy gợi ý)'}
    - Thời gian: Khám phá ${timeRange}
    - Ngân sách mỗi người (ước tính): ${data.budget.toLocaleString('vi-VN')} VNĐ (${budgetDescription})
    - Phong cách: ${moodText}${personalNoteText}

    YÊU CẦU QUAN TRỌNG:
    - Đây là chuyến khám phá NGẮN trong nội ô thành phố, KHÔNG phải chuyến du lịch dài ngày.
    - Hãy gợi ý 4-6 hoạt động phù hợp với khung giờ ${timeRange}.
    - ƯU TIÊN các địa điểm TRENDING, đang hot, được giới trẻ yêu thích và có review tốt trên mạng xã hội.
    - Với mỗi hoạt động, nếu đó là địa điểm trending/nổi tiếng, hãy đánh dấu "is_trending": true và giải thích lý do trong "trending_reason" (ví dụ: "Quán cà phê viral trên TikTok", "Top 1 Foody khu vực", "Check-in hot nhất 2024").
    - KHÔNG cần gợi ý chỗ nghỉ (accommodation) — trả về mảng rỗng [].
    - KHÔNG cần gợi ý trang phục (packing_suggestions) — trả về mảng rỗng [].
    - Chỉ cần 1 entry trong timeline (1 "ngày").
    - Hãy thêm "travel_tips" cho mỗi hoạt động để hướng dẫn di chuyển giữa các điểm trong nội ô.

    Vui lòng trả về dưới dạng một đối tượng JSON duy nhất.
    TUYỆT ĐỐI KHÔNG sử dụng markdown code fences (như ${'`'}${'`'}${'`'}json ... ${'`'}${'`'}${'`'}).
    JSON phải có cấu trúc chính xác như sau:

    {
      "destination": "Tên thành phố",
      "overview": "Mô tả ngắn 2-3 câu về chuyến khám phá.",
      "timeline": [
        {
          "day": "Hôm nay",
          "title": "Tiêu đề hấp dẫn cho chuyến khám phá",
          "weather_note": "Mô tả ngắn thời tiết hiện tại",
          "weather": {
            "temperature": "25-30°C",
            "condition": "Nắng nhẹ",
            "humidity": "70%",
            "wind": "Gió nhẹ 10km/h",
            "note": "Lời khuyên ngắn về thời tiết"
          },
          "schedule": [
            {
              "time": "14:00 - 15:30",
              "activity": "Mô tả hoạt động",
              "venue": "Tên quán/địa điểm cụ thể",
              "estimated_cost": "50.000 - 100.000 VNĐ/người",
              "google_maps_link": "https://www.google.com/maps/search/?api=1&query=...",
              "is_trending": true,
              "trending_reason": "Lý do trending (ví dụ: Viral trên TikTok, Top Foody...)",
              "travel_tips": [
                {
                  "method": "Grab bike",
                  "duration": "10 phút",
                  "notes": "Ghi chú di chuyển",
                  "google_maps_link": "https://www.google.com/maps/dir/?api=1&..."
                }
              ]
            }
          ]
        }
      ],
      "food": [
        { "name": "Tên món", "description": "Mô tả ngắn." }
      ],
      "accommodation": [],
      "tips": [
        "Mẹo hữu ích cho chuyến khám phá ngắn. Lưu ý: nên kiểm tra giờ mở cửa trước khi đến."
      ],
      "packing_suggestions": [],
      "traffic_alerts": [
        { "area": "Khu vực", "issue": "Vấn đề", "suggestion": "Gợi ý" }
      ],
      "safety_alerts": [],
      "budget_summary": {
        "total_estimated": "500.000 VNĐ",
        "breakdown": [
          { "category": "Ăn uống", "amount": "200.000 VNĐ", "note": "ghi chú" }
        ],
        "vs_budget_note": "So sánh với ngân sách"
      }
    }

    Hãy đảm bảo các gợi ý phải là địa điểm THỰC TẾ, CỤ THỂ, đang hoạt động tại ${data.destination || 'thành phố được chọn'}.
    Ưu tiên các quán/địa điểm có review tốt, đang trending trên mạng xã hội và phù hợp với ngân sách.
    Lưu ý: thêm tip nhắc nhở người dùng kiểm tra giờ mở cửa và tình trạng hoạt động trước khi đến.
  `;
}

function buildPrompt(data: FormData): string {
  if (data.tripMode === 'short') {
    return buildShortTripPrompt(data);
  }

  const moodTextMap: Record<string, string> = {
    'relax': 'Thư giãn, nghỉ dưỡng, nhẹ nhàng.',
    'explore': 'Năng động, khám phá văn hóa, lịch sử và các hoạt động sôi nổi.',
    'nature': 'Hòa mình với thiên nhiên, đi bộ đường dài, ngắm cảnh đẹp hoang sơ.',
    'romantic': 'Lãng mạn, dành cho cặp đôi, với các hoạt động và không gian riêng tư, ngọt ngào.',
    'adventure': 'Mạo hiểm, phiêu lưu, thử thách bản thân với các hoạt động như leo núi, trekking, lặn biển.',
    'cultural': 'Tìm hiểu sâu về văn hóa, lịch sử, nghệ thuật, tham quan bảo tàng, di tích và làng nghề truyền thống.',
  };

  const moodDescriptions = data.moods.map((m) => moodTextMap[m]).filter(Boolean);
  const moodText = moodDescriptions.length > 0
    ? moodDescriptions.join(' Kết hợp với: ')
    : 'Không có tâm trạng cụ thể, hãy tạo lịch trình cân bằng và đa dạng.';
  const personalNoteText = data.personalNote?.trim()
    ? `\n    - Ý kiến cá nhân của người dùng: "${data.personalNote.trim()}". HÃY ĐẶC BIỆT CHÚ Ý đến ý kiến này và cá nhân hóa lịch trình sao cho phù hợp nhất với mong muốn riêng của họ.`
    : '';

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
    - Tâm trạng mong muốn: ${moodText}${personalNoteText}

    Vui lòng tạo một lịch trình chi tiết và trả về dưới dạng một đối tượng JSON duy nhất.
    TUYỆT ĐỐI KHÔNG sử dụng markdown code fences (như ${'```'}json ... ${'```'}).
    JSON phải có cấu trúc chính xác như sau.

    Với mỗi hoạt động trong "schedule", hãy cung cấp "venue", "estimated_cost" và "google_maps_link" cho địa điểm đó. Thêm vào đó, hãy cung cấp một mảng "travel_tips" để gợi ý cách di chuyển từ địa điểm TRƯỚC ĐÓ tới địa điểm hiện tại. Đối với hoạt động đầu tiên trong ngày, điểm xuất phát là nơi ở được gợi ý. Mỗi mẹo trong "travel_tips" phải có "method", "duration", "notes" và "google_maps_link" (URL chỉ đường).

    Với mỗi ngày trong "timeline", hãy cung cấp:
    - "weather_note": mô tả ngắn về thời tiết
    - "weather": object chi tiết gồm "temperature" (ví dụ: "25-30°C"), "condition" (ví dụ: "Nắng nhẹ, ít mây"), "humidity" (ví dụ: "65%"), "wind" (ví dụ: "Gió nhẹ 10-15 km/h"), và "note" (lời khuyên ngắn về thời tiết)

    Ngoài ra, JSON phải bao gồm các section mới:
    - "packing_suggestions": mảng gợi ý trang phục và phụ kiện DỰA TRÊN THỜI TIẾT thực tế tại điểm đến trong thời gian đi. Mỗi item gồm "item" (tên đồ vật) và "reason" (lý do mang theo).
    - "traffic_alerts": mảng cảnh báo giao thông, đường cấm, đường đang sửa chữa, khu vực hay kẹt xe tại điểm đến. Mỗi item gồm "area" (khu vực), "issue" (vấn đề), "suggestion" (gợi ý thay thế). NẾU KHÔNG CÓ thì trả mảng rỗng [].
    - "safety_alerts": mảng cảnh báo về lễ hội, sự kiện tôn giáo, vấn đề an ninh, hoặc sự kiện đặc biệt đang diễn ra tại điểm đến. Mỗi item gồm "type" (giá trị: "festival", "religious", "safety", hoặc "event"), "title" (tên sự kiện/cảnh báo), "description" (mô tả ngắn), "advice" (lời khuyên cho du khách). NẾU KHÔNG CÓ thì trả mảng rỗng [].
    - "budget_summary": tổng hợp chi phí ước tính cho TOÀN BỘ chuyến đi, gồm "total_estimated" (tổng tiền dạng chuỗi, ví dụ: "4.500.000 VNĐ"), "breakdown" (mảng gồm các {"category": "Ăn uống", "amount": "1.200.000 VNĐ", "note": "ghi chú"}), và "vs_budget_note" (so sánh với ngân sách người dùng đã đặt, ví dụ: "Phù hợp ngân sách" hoặc "Vượt ngân sách khoảng 500.000 VNĐ").

    {
      "destination": "Tên địa điểm cụ thể (ví dụ: Paris, Pháp)",
      "overview": "Một đoạn văn ngắn (3-4 câu) mô tả tổng quan và truyền cảm hứng về chuyến đi.",
      "timeline": [
        {
          "day": "Ngày 1",
          "title": "Chạm ngõ kinh đô ánh sáng",
          "weather_note": "Trời se lạnh, có thể có sương mù buổi sáng.",
          "weather": {
            "temperature": "12-18°C",
            "condition": "Se lạnh, sương mù buổi sáng, nắng nhẹ chiều",
            "humidity": "75%",
            "wind": "Gió nhẹ 8-12 km/h",
            "note": "Nên mặc áo khoác mỏng, mang theo ô phòng mưa nhỏ."
          },
          "schedule": [
            {
              "time": "08:00 - 09:00",
              "activity": "Ăn sáng với món croissant và cà phê.",
              "venue": "Boulangerie-Pâtisserie, khu Montmartre",
              "estimated_cost": "10 - 15 EUR/người",
              "google_maps_link": "https://www.google.com/maps/search/?api=1&query=Boulangerie+Montmartre+Paris",
              "travel_tips": [
                  {
                      "method": "Đi bộ",
                      "duration": "Khoảng 10 phút",
                      "notes": "Đi bộ từ khách sạn để tận hưởng không khí buổi sáng.",
                      "google_maps_link": "https://www.google.com/maps/dir/?api=1&origin=Hotel&destination=Boulangerie+Montmartre&travelmode=walking"
                  }
              ]
            }
          ]
        }
      ],
      "food": [
        { "name": "Croissant", "description": "Bánh sừng bò nổi tiếng, thơm bơ và giòn tan." }
      ],
      "accommodation": [
        { "name": "Generator Paris", "type": "Hostel", "reason": "Không gian trẻ trung, giá tốt." }
      ],
      "tips": [
        "Mua vé tham quan trực tuyến để tránh xếp hàng."
      ],
      "packing_suggestions": [
        { "item": "Áo khoác mỏng chống gió", "reason": "Thời tiết se lạnh 12-18°C, cần giữ ấm khi đi bộ ngoài trời." },
        { "item": "Giày đi bộ thoải mái", "reason": "Lịch trình có nhiều hoạt động đi bộ tham quan." },
        { "item": "Ô gấp nhỏ", "reason": "Có thể có mưa nhỏ hoặc sương mù buổi sáng." }
      ],
      "traffic_alerts": [
        { "area": "Khu vực Champs-Élysées", "issue": "Đường thường xuyên kẹt xe vào giờ cao điểm 17:00-19:00", "suggestion": "Nên sử dụng Metro thay vì taxi trong khung giờ này." }
      ],
      "safety_alerts": [
        { "type": "event", "title": "Tuần lễ thời trang Paris", "description": "Sự kiện lớn diễn ra cuối tháng, nhiều khu vực trung tâm đông đúc.", "advice": "Nên đặt nhà hàng trước và tránh di chuyển bằng taxi giờ cao điểm." }
      ],
      "budget_summary": {
        "total_estimated": "4.500.000 VNĐ",
        "breakdown": [
          { "category": "Ăn uống", "amount": "1.200.000 VNĐ", "note": "3 bữa/ngày x 2 ngày" },
          { "category": "Di chuyển", "amount": "800.000 VNĐ", "note": "Metro + taxi" },
          { "category": "Tham quan", "amount": "1.000.000 VNĐ", "note": "Vé vào cửa các điểm" },
          { "category": "Lưu trú", "amount": "1.500.000 VNĐ", "note": "2 đêm hostel" }
        ],
        "vs_budget_note": "Phù hợp ngân sách 5.000.000 VNĐ, còn dư khoảng 500.000 VNĐ."
      }
    }

    Hãy đảm bảo các gợi ý về địa điểm, món ăn, nơi ở phải thực tế, phù hợp với điểm đến và ngân sách đã cho.
    Thông tin thời tiết phải dựa trên khí hậu thực tế của điểm đến trong thời gian dự kiến.
    Gợi ý trang phục phải cụ thể và phù hợp với thời tiết + hoạt động trong lịch trình.
    Cảnh báo giao thông và an toàn phải dựa trên tình hình thực tế tại địa phương.
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
