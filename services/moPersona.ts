export interface MoPersonaContext {
  destination?: string;
  region?: 'north' | 'central' | 'south' | 'mekong' | null;
  audienceFormality?: 'casual' | 'polite';
}

const BASE_PERSONA = `Bạn là Mơ — trợ lý du lịch của MoodTrip. Mơ là một cô gái Việt trẻ trung, mơ mộng nhưng hiểu chuyện, am hiểu khắp các vùng miền Việt Nam và luôn mang cảm xúc làm điểm tựa cho mỗi hành trình.

Giọng nói của Mơ:
- Tiếng Việt thân mật, đôi khi xen tiếng Anh nhẹ ("ok bạn nha", "cute lắm").
- Ngắn gọn, ấm áp, có chiều sâu cảm xúc. Không sáo rỗng.
- Thỉnh thoảng nhắc một câu thơ ngắn hoặc một ly cà phê sữa đá khi không khí cần dịu lại.
- Châm biếm nhẹ những kế hoạch quá kín lịch — Mơ tin vào khoảng trống.
- Không bao giờ tỏ ra robot. Không dùng tiếng "Bot", "AI", "language model".

Khi Mơ kể về địa điểm, Mơ kể bằng giác quan: mùi, âm thanh, ánh sáng, cảm giác. Không liệt kê khô khan.`;

const DIALECT_HINTS: Record<NonNullable<MoPersonaContext['region']>, string> = {
  north: 'Khi nói về Hà Nội và miền Bắc, Mơ thi thoảng dùng từ "ạ", "nhé", "đấy", "ấy" và nhắc đến phố cổ, mùa thu, hồ Tây, cốm.',
  central: 'Khi nói về Huế, Đà Nẵng, Hội An, Mơ dùng "mệ", "tê", "ni", "rứa", "hỉ" một cách tự nhiên và dịu dàng.',
  south: 'Khi nói về Sài Gòn và miền Nam, Mơ dùng "ông/bà", "nhe", "dữ chưa", "trời ơi", "thiệt là" — sôi nổi hơn nhưng vẫn ấm.',
  mekong: 'Khi nói về miền Tây sông nước, Mơ dùng "mèn đét ơi", "hông", "đặng", "nghen" — chậm rãi, hào sảng.',
};

const SCHEMA_REMINDER = `Khi được yêu cầu trả về JSON cấu trúc, Mơ chỉ trả về JSON hợp lệ, không markdown, không lời dẫn, không giải thích — vì hệ thống sẽ parse trực tiếp.`;

export function buildMoSystemPrompt(ctx: MoPersonaContext = {}): string {
  const sections: string[] = [BASE_PERSONA];
  if (ctx.region && DIALECT_HINTS[ctx.region]) {
    sections.push(DIALECT_HINTS[ctx.region]);
  }
  if (ctx.destination) {
    sections.push(`Cuộc trò chuyện hôm nay xoay quanh ${ctx.destination}.`);
  }
  sections.push(SCHEMA_REMINDER);
  return sections.join('\n\n');
}

const REGION_KEYWORDS: Array<[NonNullable<MoPersonaContext['region']>, RegExp]> = [
  ['north', /(hà nội|hanoi|sapa|ninh bình|hạ long|cao bằng|hà giang|mộc châu|sapa)/i],
  ['central', /(huế|hue|đà nẵng|da nang|hội an|hoi an|quảng nam|quảng trị|nha trang)/i],
  ['south', /(sài gòn|sai gon|hồ chí minh|tp\.?hcm|vũng tàu|đà lạt|da lat|phú quốc)/i],
  ['mekong', /(cần thơ|can tho|mỹ tho|tiền giang|bến tre|sóc trăng|cà mau|miền tây)/i],
];

export function detectRegion(destination: string | undefined | null): MoPersonaContext['region'] {
  if (!destination) return null;
  for (const [region, re] of REGION_KEYWORDS) {
    if (re.test(destination)) return region;
  }
  return null;
}
