export type Province = string;

export interface ProvinceLandmark {
  province: Province;
  region: 'north' | 'central' | 'south' | 'mekong' | 'highlands';
  emotionalPrompts: string[];
  signatureLandmarks: string[];
  signatureDishes: string[];
}

export const PROVINCE_LANDMARKS: ProvinceLandmark[] = [
  {
    province: 'Hà Nội',
    region: 'north',
    emotionalPrompts: [
      'Đi bộ vòng quanh Hồ Gươm lúc 5 giờ sáng khi phố còn vắng.',
      'Ngồi trên hè một quán phở gia truyền của bà ngoại.',
      'Tìm lại cây bàng trước cửa nhà cũ.',
    ],
    signatureLandmarks: ['Hồ Hoàn Kiếm', 'Phố cổ', 'Văn Miếu', 'Chợ Đồng Xuân'],
    signatureDishes: ['Phở bò', 'Bún chả', 'Bánh cuốn', 'Chả cá Lã Vọng'],
  },
  {
    province: 'Nam Định',
    region: 'north',
    emotionalPrompts: [
      'Thăm cây đa của làng và nghe cụ bà kể lại chuyện gia tộc.',
      'Đến phủ Dầy đúng dịp giỗ mẫu.',
    ],
    signatureLandmarks: ['Đền Trần', 'Phủ Dầy', 'Nhà thờ Bùi Chu'],
    signatureDishes: ['Phở bò Nam Định', 'Bánh xíu páo', 'Nem nắm'],
  },
  {
    province: 'Hải Phòng',
    region: 'north',
    emotionalPrompts: ['Sáng sớm ăn bánh đa cua, chiều ngồi cảng nghe còi tàu.'],
    signatureLandmarks: ['Đảo Cát Bà', 'Khu Đồ Sơn', 'Nhà hát thành phố'],
    signatureDishes: ['Bánh đa cua', 'Nem cua bể', 'Bánh mì cay'],
  },
  {
    province: 'Sapa',
    region: 'north',
    emotionalPrompts: ['Đi bộ một mình giữa ruộng bậc thang trong sương sớm.'],
    signatureLandmarks: ['Đỉnh Fansipan', 'Bản Cát Cát', 'Thác Bạc'],
    signatureDishes: ['Thắng cố', 'Cá hồi Sapa', 'Lợn cắp nách'],
  },
  {
    province: 'Huế',
    region: 'central',
    emotionalPrompts: [
      'Mặc áo dài đi vào lăng tẩm và nghe nhã nhạc cung đình.',
      'Đứng trên cầu Trường Tiền ngắm sông Hương lúc nắng nhẹ.',
    ],
    signatureLandmarks: ['Đại Nội', 'Lăng Tự Đức', 'Chùa Thiên Mụ', 'Sông Hương'],
    signatureDishes: ['Bún bò Huế', 'Cơm hến', 'Bánh khoái', 'Chè Huế'],
  },
  {
    province: 'Đà Nẵng',
    region: 'central',
    emotionalPrompts: ['Lái xe lên đèo Hải Vân lúc bình minh.'],
    signatureLandmarks: ['Cầu Rồng', 'Bà Nà Hills', 'Bán đảo Sơn Trà', 'Ngũ Hành Sơn'],
    signatureDishes: ['Mì Quảng', 'Bún chả cá', 'Bánh tráng cuốn thịt heo'],
  },
  {
    province: 'Hội An',
    region: 'central',
    emotionalPrompts: ['Đi giữa phố cổ khi đèn lồng vừa thắp.'],
    signatureLandmarks: ['Phố cổ Hội An', 'Chùa Cầu', 'Biển Cửa Đại', 'Cù Lao Chàm'],
    signatureDishes: ['Cao lầu', 'Cơm gà Hội An', 'Bánh mì Phượng', 'Bánh bao bánh vạc'],
  },
  {
    province: 'Quảng Bình',
    region: 'central',
    emotionalPrompts: ['Lặng nhìn cửa hang Sơn Đoòng sáng lên trong nắng đầu ngày.'],
    signatureLandmarks: ['Phong Nha - Kẻ Bàng', 'Hang Én', 'Đèo Ngang'],
    signatureDishes: ['Bánh bột lọc Quảng Bình', 'Cháo canh', 'Bánh xèo Quảng Bình'],
  },
  {
    province: 'Quảng Nam',
    region: 'central',
    emotionalPrompts: ['Đến Mỹ Sơn vào sớm khi sương còn đọng trên gạch Chàm.'],
    signatureLandmarks: ['Mỹ Sơn', 'Cù Lao Chàm', 'Biển An Bàng'],
    signatureDishes: ['Mì Quảng Quế Sơn', 'Bê thui Cầu Mống'],
  },
  {
    province: 'Đà Lạt',
    region: 'highlands',
    emotionalPrompts: ['Ngồi bên bờ hồ Tuyền Lâm lúc 6h sáng, uống một ly cà phê nóng.'],
    signatureLandmarks: ['Hồ Xuân Hương', 'Đồi chè Cầu Đất', 'Ga Đà Lạt cũ', 'Nhà thờ Domaine'],
    signatureDishes: ['Bánh tráng nướng', 'Lẩu gà lá é', 'Sữa đậu nành Đà Lạt'],
  },
  {
    province: 'Pleiku',
    region: 'highlands',
    emotionalPrompts: ['Đứng bên Biển Hồ và nghe gió Tây Nguyên thổi.'],
    signatureLandmarks: ['Biển Hồ (T\'Nưng)', 'Chùa Minh Thành'],
    signatureDishes: ['Phở khô Gia Lai', 'Bún mắm cua'],
  },
  {
    province: 'TP. Hồ Chí Minh',
    region: 'south',
    emotionalPrompts: ['Ngồi ban công nhà bà uống cà phê sữa đá nghe vọng cổ.'],
    signatureLandmarks: ['Nhà thờ Đức Bà', 'Phố đi bộ Nguyễn Huệ', 'Chợ Bến Thành', 'Chợ Lớn'],
    signatureDishes: ['Cơm tấm', 'Hủ tiếu', 'Bánh xèo', 'Phá lấu'],
  },
  {
    province: 'Vũng Tàu',
    region: 'south',
    emotionalPrompts: ['Đi xe xuống Bãi Sau nghe sóng từ thuở bé.'],
    signatureLandmarks: ['Tượng Chúa Kitô', 'Bạch Dinh', 'Ngọn hải đăng'],
    signatureDishes: ['Bánh khọt', 'Bánh bông lan trứng muối'],
  },
  {
    province: 'Cần Thơ',
    region: 'mekong',
    emotionalPrompts: ['Đi chợ nổi Cái Răng từ 5h sáng và ăn hủ tiếu trên ghe.'],
    signatureLandmarks: ['Chợ nổi Cái Răng', 'Bến Ninh Kiều', 'Nhà cổ Bình Thủy'],
    signatureDishes: ['Bánh tét lá cẩm', 'Bún cá Cần Thơ', 'Lẩu mắm'],
  },
  {
    province: 'Bến Tre',
    region: 'mekong',
    emotionalPrompts: ['Đi xuồng nhỏ qua các con rạch dừa.'],
    signatureLandmarks: ['Cồn Phụng', 'Vườn dừa', 'Khu lưu niệm Đồng Khởi'],
    signatureDishes: ['Kẹo dừa', 'Đuông dừa', 'Cá kèo kho rau răm'],
  },
  {
    province: 'An Giang',
    region: 'mekong',
    emotionalPrompts: ['Đến Rừng tràm Trà Sư mùa nước nổi.'],
    signatureLandmarks: ['Rừng tràm Trà Sư', 'Núi Cấm', 'Châu Đốc'],
    signatureDishes: ['Bún cá Châu Đốc', 'Mắm Châu Đốc', 'Bánh xèo rau núi'],
  },
  {
    province: 'Phú Quốc',
    region: 'south',
    emotionalPrompts: ['Đi câu mực đêm với ngư dân.'],
    signatureLandmarks: ['Bãi Sao', 'Vinpearl Safari', 'Chợ đêm Dinh Cậu'],
    signatureDishes: ['Gỏi cá trích', 'Bún quậy', 'Nhum biển nướng'],
  },
];

export interface QueTripSeed {
  province: Province;
  region: ProvinceLandmark['region'];
  prompt: string;
  landmarks: string[];
  dishes: string[];
}

export function buildQueSeed(province: Province): QueTripSeed | null {
  const data = PROVINCE_LANDMARKS.find(
    (p) => p.province.toLowerCase() === province.toLowerCase(),
  );
  if (!data) return null;
  const pick = <T,>(arr: T[]): T | null => (arr.length === 0 ? null : (arr[Math.floor(Math.random() * arr.length)] as T));
  const prompt = pick(data.emotionalPrompts) ?? '';
  return {
    province: data.province,
    region: data.region,
    prompt,
    landmarks: data.signatureLandmarks,
    dishes: data.signatureDishes,
  };
}

export function listProvinces(): Province[] {
  return PROVINCE_LANDMARKS.map((p) => p.province);
}

export function buildQuePersonalNote(seed: QueTripSeed): string {
  return `Chuyến đi về quê ${seed.province}. ${seed.prompt} Hãy gợi ý lịch trình mang cảm xúc trở về (không phải tour du khách). Ưu tiên ghé: ${seed.landmarks.slice(0, 3).join(', ')}. Nhớ giới thiệu món ${seed.dishes.slice(0, 2).join(' và ')}.`;
}
