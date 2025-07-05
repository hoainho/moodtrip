import { GoogleGenAI } from "@google/genai";
import type { FormData, ItineraryPlan, Duration } from '../types';

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

  return `
    Bạn là một chuyên gia du lịch ảo thông thái và sáng tạo. Nhiệm vụ của bạn là tạo ra một kế hoạch du lịch chi tiết, hấp dẫn và thực tế dựa trên các yêu cầu sau đây.

    Yêu cầu của người dùng:
    - Điểm đến: ${data.destination || 'Việt Nam (hãy gợi ý một địa điểm cụ thể phù hợp)'}
    - Thời gian: ${buildDurationText(data.duration)}
    - Ngân sách mỗi người (ước tính): ${data.budget.toLocaleString('vi-VN')} VNĐ (${budgetDescription})
    - Tâm trạng mong muốn: ${moodTextMap[data.mood]}

    Vui lòng tạo một lịch trình chi tiết và trả về dưới dạng một đối tượng JSON duy nhất.
    TUYỆT ĐỐI KHÔNG sử dụng markdown code fences (như \`\`\`json ... \`\`\`).
    JSON phải có cấu trúc chính xác như sau. Với mỗi hoạt động trong "schedule", hãy cung cấp "venue" (tên địa điểm/quán ăn cụ thể) và "estimated_cost" (chi phí ước tính). Với mỗi ngày trong "timeline", hãy thêm "weather_note" (ghi chú thời tiết và gợi ý trang phục).
    {
      "destination": "Tên địa điểm cụ thể (ví dụ: Đà Lạt, Việt Nam)",
      "overview": "Một đoạn văn ngắn (3-4 câu) mô tả tổng quan và truyền cảm hứng về chuyến đi, khơi gợi cảm xúc phù hợp với tâm trạng đã chọn.",
      "timeline": [
        {
          "day": "Ngày 1",
          "title": "Một tiêu đề hấp dẫn cho ngày, ví dụ: 'Chạm ngõ Đà Lạt mộng mơ'",
          "weather_note": "Dự báo trời se lạnh và có thể có sương mù vào buổi sáng. Nhớ mang theo áo khoác mỏng.",
          "schedule": [
            { 
              "time": "08:00 - 09:00", 
              "activity": "Ăn sáng với món Bánh mì xíu mại đặc trưng.",
              "venue": "Bánh mì xíu mại Hoàng Diệu",
              "estimated_cost": "30.000 - 50.000 VNĐ/người"
            },
            { 
              "time": "09:00 - 12:00", 
              "activity": "Tham quan Thác Datanla và trải nghiệm máng trượt xuyên rừng.",
              "venue": "Khu du lịch Thác Datanla",
              "estimated_cost": "Vé vào cổng: 50.000 VNĐ, Máng trượt: 170.000 VNĐ/khứ hồi"
            },
            { 
              "time": "12:00 - 13:30", 
              "activity": "Ăn trưa và nghỉ ngơi.",
              "venue": "Nhà hàng cơm niêu Hương Việt",
              "estimated_cost": "150.000 - 250.000 VNĐ/người"
            }
          ]
        }
      ],
      "food": [
        { "name": "Bánh mì xíu mại", "description": "Một món ăn sáng đặc trưng của Đà Lạt, ăn kèm với giá và rau thơm." },
        { "name": "Lẩu gà lá é", "description": "Món lẩu thơm nồng vị lá é, rất hợp với thời tiết se lạnh." }
      ],
      "accommodation": [
        { "name": "Ladalat Hotel", "type": "Khách sạn 5 sao", "reason": "Phù hợp với ngân sách thoải mái, cung cấp dịch vụ cao cấp và view đẹp." },
        { "name": "The Kupid Homestay", "type": "Homestay", "reason": "Lựa chọn tuyệt vời cho ngân sách tiết kiệm, không gian ấm cúng và gần gũi." }
      ],
      "tips": [
        "Nên mang theo áo khoác mỏng vì thời tiết Đà Lạt thay đổi nhanh.",
        "Đặt phòng và vé xe trước vào cuối tuần hoặc mùa cao điểm."
      ]
    }

    Hãy đảm bảo các gợi ý về địa điểm, món ăn, nơi ở phải thực tế, phù hợp với điểm đến và ngân sách đã cho.
  `;
}

export const generateItinerary = async (formData: FormData, apiKey: string): Promise<ItineraryPlan> => {
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }
  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildPrompt(formData);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    let jsonStr = response.text.trim();
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
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        const errorMessage = (error as any).message || '';
        if (errorMessage.includes('API key not valid') || errorMessage.includes('permission denied')) {
            throw new Error('API_KEY_INVALID');
        }
        if (errorMessage.includes('[429]')) {
            throw new Error('RATE_LIMIT_EXCEEDED');
        }
    }
    throw new Error("Không thể tạo lịch trình. AI có thể đang bận. Vui lòng thử lại sau.");
  }
};
