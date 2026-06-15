export type Province = string;

export interface ProvinceLandmark {
  province: Province;
  region: 'north' | 'central' | 'south' | 'mekong' | 'highlands';
  emotionalPrompts: string[];
  signatureLandmarks: string[];
  signatureDishes: string[];
}

export const PROVINCE_LANDMARKS: ProvinceLandmark[] = [
  // ── NORTH ──────────────────────────────────────────────────────────────────
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
    province: 'Hà Giang',
    region: 'north',
    emotionalPrompts: [
      'Đứng trên Đồng Văn nhìn xuống thung lũng đá tai mèo và nhớ tới người ở nhà.',
      'Chạy xe máy qua Mã Pì Lèng lúc trời vừa hửng, gió núi thổi lạnh mặt.',
    ],
    signatureLandmarks: ['Cao nguyên đá Đồng Văn', 'Đèo Mã Pì Lèng', 'Cột cờ Lũng Cú', 'Phố cổ Đồng Văn'],
    signatureDishes: ['Cháo ấu tẩu', 'Thắng cố ngựa', 'Bánh cuốn trứng Hà Giang', 'Rượu ngô Bắc Hà'],
  },
  {
    province: 'Ninh Bình',
    region: 'north',
    emotionalPrompts: [
      'Chèo thuyền qua hang Múa nhìn lên vách đá phủ cây xanh, lòng chợt bình yên lạ.',
      'Ghé đền Đinh đúng chiều muộn khi khói nhang còn vấn vít.',
    ],
    signatureLandmarks: ['Tràng An', 'Tam Cốc – Bích Động', 'Đền Đinh Tiên Hoàng', 'Hang Múa'],
    signatureDishes: ['Cơm cháy Ninh Bình', 'Dê núi Ninh Bình', 'Nem Yên Mạc', 'Rượu Kim Sơn'],
  },
  {
    province: 'Quảng Ninh',
    region: 'north',
    emotionalPrompts: [
      'Sáng sớm ra cảng Tuần Châu nhìn vịnh sương mù chưa tan, mùi biển quen thuộc lại về.',
      'Ngồi trên thuyền đánh cá của bố, mắt dõi theo từng bèo dạt nước.',
    ],
    signatureLandmarks: ['Vịnh Hạ Long', 'Đảo Cô Tô', 'Chùa Yên Tử', 'Đảo Tuần Châu'],
    signatureDishes: ['Sá sùng Hạ Long', 'Chả mực Hạ Long', 'Ngán biển', 'Bánh gật gù'],
  },
  {
    province: 'Lào Cai',
    region: 'north',
    emotionalPrompts: [
      'Đứng ở ga Lào Cai nhìn qua cầu sang bên kia biên giới, lòng bỗng thấy nhà mình thật gần.',
      'Ghé chợ phiên Bắc Hà sáng chủ nhật, tiếng người H\'Mông nói cười rộn cả sườn đồi.',
    ],
    signatureLandmarks: ['Thị trấn Bắc Hà', 'Chợ phiên Bắc Hà', 'Cổng trời Ô Quy Hồ', 'Đền Thượng Sa Pa'],
    signatureDishes: ['Thịt lợn hun khói', 'Bánh chưng đen', 'Rượu táo mèo', 'Cá suối nướng'],
  },
  {
    province: 'Điện Biên',
    region: 'north',
    emotionalPrompts: [
      'Đứng trên đồi A1 nhìn xuống lòng chảo Điện Biên, lịch sử cứ thế ùa về.',
      'Ăn bữa cơm lam ống nứa bên bếp lửa của bản Mường.',
    ],
    signatureLandmarks: ['Đồi A1', 'Hầm Đờ Cát', 'Mường Phăng', 'Hồ Pa Khoang'],
    signatureDishes: ['Cơm lam', 'Nộm hoa ban', 'Cá suối nướng pa pỉnh tộp', 'Rượu cần Điện Biên'],
  },
  {
    province: 'Cao Bằng',
    region: 'north',
    emotionalPrompts: [
      'Đứng trước thác Bản Giốc nghe nước đổ ầm ào, cảm giác nhỏ bé mà bình yên lạ.',
      'Sáng lạnh cuối đông ghé chợ phiên Trùng Khánh mua bánh khảo về cho ông bà.',
    ],
    signatureLandmarks: ['Thác Bản Giốc', 'Động Ngườm Ngao', 'Pác Bó', 'Phố cổ Cao Bằng'],
    signatureDishes: ['Bánh khảo Cao Bằng', 'Vịt quay Thất Khê', 'Bánh coóng phù', 'Xôi trám đen'],
  },
  {
    province: 'Thái Nguyên',
    region: 'north',
    emotionalPrompts: [
      'Ngồi trong nhà giữa vườn chè xanh mướt, uống chén trà nóng hổi mà lòng ấm hẳn.',
      'Chiều về, mùi chè sao đang khô bay theo gió làm người lữ hành nhớ nhà.',
    ],
    signatureLandmarks: ['Đồi chè Tân Cương', 'Hồ Núi Cốc', 'Đền Đuổm', 'ATK Định Hóa'],
    signatureDishes: ['Chè Thái Nguyên', 'Bánh chưng Bờ Đậu', 'Gà đồi Thái Nguyên', 'Xôi ngũ sắc'],
  },
  {
    province: 'Bắc Ninh',
    region: 'north',
    emotionalPrompts: [
      'Nghe câu quan họ vang lên giữa hội Lim, bỗng thấy cái hồn quê Kinh Bắc ngấm vào từng hơi thở.',
      'Thăm lại đình làng thuở bé, mái ngói cũ còn đó mà người thân đã vắng bóng.',
    ],
    signatureLandmarks: ['Chùa Dâu', 'Đền Đô', 'Hội Lim', 'Chùa Phật Tích'],
    signatureDishes: ['Bánh phu thê Đình Bảng', 'Tương Đình Tổ', 'Cháo cá', 'Bánh khúc'],
  },
  {
    province: 'Hưng Yên',
    region: 'north',
    emotionalPrompts: [
      'Mùa nhãn về, mùi nhãn lồng thơm ngát cả con phố nhỏ, lòng bỗng muốn gọi điện về nhà.',
      'Đi thuyền dọc sông Hồng chiều tà, nhìn bãi cát vàng bên bờ mà nhớ những chiều tuổi thơ.',
    ],
    signatureLandmarks: ['Phố Hiến cổ', 'Đền Chử Đồng Tử', 'Văn Miếu Xích Đằng', 'Vườn nhãn lồng'],
    signatureDishes: ['Nhãn lồng Hưng Yên', 'Bánh cuốn chả', 'Tương bần Mỹ Hào', 'Chè hoa nhãn'],
  },

  // ── CENTRAL ────────────────────────────────────────────────────────────────
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
    province: 'Thanh Hóa',
    region: 'central',
    emotionalPrompts: [
      'Về làng nhìn lại cánh đồng phù sa sông Mã, nghe bố kể chuyện ngày xưa đồng làng còn rộng hơn.',
      'Sáng sớm ghé chợ Rồng mua gói bánh gai mang về biếu bà.',
    ],
    signatureLandmarks: ['Thành Nhà Hồ', 'Biển Sầm Sơn', 'Suối cá Cẩm Lương', 'Lam Kinh'],
    signatureDishes: ['Bánh gai Tứ Trụ', 'Nem chua Thanh Hóa', 'Chả tôm', 'Bánh cuốn Phủ Lý'],
  },
  {
    province: 'Nghệ An',
    region: 'central',
    emotionalPrompts: [
      'Đi qua dải đất miền Trung nắng gió, thấy người xứ Nghệ nói chuyện là biết mình đang về nhà.',
      'Ghé thăm quê Bác Hồ ở Kim Liên lúc chiều muộn, lòng thấy bình yên lạ.',
    ],
    signatureLandmarks: ['Làng Sen Kim Liên', 'Quảng trường Hồ Chí Minh', 'Biển Cửa Lò', 'Núi Quyết'],
    signatureDishes: ['Tương Nam Đàn', 'Nhút Thanh Chương', 'Cháo lươn Vinh', 'Bánh mướt'],
  },
  {
    province: 'Hà Tĩnh',
    region: 'central',
    emotionalPrompts: [
      'Mùa hè Hà Tĩnh gió Lào thổi khô người, nhưng bữa cơm nhà vẫn ngon nhất trần đời.',
      'Chiều về ngồi bên biển Thiên Cầm nghe sóng vỗ, nhớ lại những năm tháng lớn lên ở đây.',
    ],
    signatureLandmarks: ['Biển Thiên Cầm', 'Đèo Ngang', 'Chùa Hương Tích', 'Khu lưu niệm Nguyễn Du'],
    signatureDishes: ['Kẹo cu đơ', 'Cháo hàu', 'Mắm tép Hà Tĩnh', 'Bún bò kho'],
  },
  {
    province: 'Quảng Trị',
    region: 'central',
    emotionalPrompts: [
      'Đứng trước nghĩa trang Trường Sơn trong im lặng, hiểu vì sao đất này mang nặng ký ức.',
      'Qua cầu Hiền Lương nhìn dòng Bến Hải, lòng dưng lặng xuống.',
    ],
    signatureLandmarks: ['Thành cổ Quảng Trị', 'Cầu Hiền Lương', 'Nghĩa trang Trường Sơn', 'Địa đạo Vịnh Mốc'],
    signatureDishes: ['Bánh ướt thịt heo', 'Cháo bột', 'Ném chua Quảng Trị', 'Bún hến'],
  },
  {
    province: 'Quảng Ngãi',
    region: 'central',
    emotionalPrompts: [
      'Sáng sớm ra cảng Sa Kỳ nhìn thuyền đánh cá về, mùi biển quen như mùi nhà.',
      'Ngồi trong quán đường làng ăn tô đường nụ dừa, nhớ những chiều nhỏ theo bà đi chợ.',
    ],
    signatureLandmarks: ['Đảo Lý Sơn', 'Mỹ Lai', 'Biển Sa Huỳnh', 'Thiên Ấn Niêm Hà'],
    signatureDishes: ['Kẹo gương Quảng Ngãi', 'Chả bò Quảng Ngãi', 'Cá bống sông Trà', 'Bánh nghệ'],
  },
  {
    province: 'Bình Định',
    region: 'central',
    emotionalPrompts: [
      'Về Quy Nhơn đứng trên ghềnh Ráng nhìn biển mà lòng trống trải như thuở còn bé.',
      'Ăn bát bún chả cá sáng sớm ở chợ Quy Nhơn, vị quen từ hồi còn học cấp hai.',
    ],
    signatureLandmarks: ['Ghềnh Ráng', 'Kỳ Co - Eo Gió', 'Tháp Đôi', 'Biển Quy Nhơn'],
    signatureDishes: ['Bún chả cá Quy Nhơn', 'Bánh xèo mực', 'Nem chợ Huyện', 'Rượu Bàu Đá'],
  },
  {
    province: 'Phú Yên',
    region: 'central',
    emotionalPrompts: [
      'Đứng trên ghềnh Đá Đĩa nhìn sóng vỡ trắng xoá, nghe tiếng biển như tiếng gọi từ nhà.',
      'Chiều tà ở biển Long Thủy, nhìn con thuyền nhỏ cập bến mà lòng bỗng bình yên.',
    ],
    signatureLandmarks: ['Ghềnh Đá Đĩa', 'Đầm Ô Loan', 'Mũi Điện', 'Biển Tuy Hòa'],
    signatureDishes: ['Cá ngừ đại dương', 'Bánh tráng Phú Yên', 'Sò huyết Ô Loan', 'Bún sứa'],
  },
  {
    province: 'Khánh Hòa',
    region: 'central',
    emotionalPrompts: [
      'Sáng sớm ra bến cá Nha Trang, mùi biển mùi cá quen thuộc như hơi thở của tuổi thơ.',
      'Chiều ngồi trên bãi biển nhìn tháp Bà Ponagar trong nắng vàng, nhớ lại những lần cùng gia đình.',
    ],
    signatureLandmarks: ['Vịnh Nha Trang', 'Tháp Bà Ponagar', 'Đảo Hòn Mun', 'Viện Hải dương học'],
    signatureDishes: ['Bún cá sứa Nha Trang', 'Nem nướng Ninh Hòa', 'Bánh căn', 'Chả cá thác lác'],
  },
  {
    province: 'Ninh Thuận',
    region: 'central',
    emotionalPrompts: [
      'Buổi sáng ở Phan Rang nắng đã gắt, nhưng mùi nho chín trên giàn cứ kéo người về.',
      'Ghé thăm làng Chăm trên đường về, tiếng dệt thổ cẩm đều đều làm lòng yên lặng.',
    ],
    signatureLandmarks: ['Vườn nho Ba Mọi', 'Tháp Chàm Po Klong Garai', 'Biển Ninh Chữ', 'Đồi cát Nam Cương'],
    signatureDishes: ['Nho Ninh Thuận', 'Dê nướng Ninh Thuận', 'Bánh căn Phan Rang', 'Cừu hấp'],
  },
  {
    province: 'Bình Thuận',
    region: 'central',
    emotionalPrompts: [
      'Đứng trên đồi cát Mũi Né nhìn biển xanh phía xa, gió thổi bay tóc – cảm giác tự do như ngày còn trẻ.',
      'Chiều về Phan Thiết, mùi nước mắm từ nhà thùng bay ra cả khu phố, thân quen đến nao lòng.',
    ],
    signatureLandmarks: ['Đồi cát Mũi Né', 'Suối Tiên', 'Tháp Pô Sah Inư', 'Hải đăng Mũi Kê Gà'],
    signatureDishes: ['Bánh căn Phan Thiết', 'Nước mắm Phan Thiết', 'Cơm gà Phan Thiết', 'Bánh rán nhân dừa'],
  },

  // ── HIGHLANDS ──────────────────────────────────────────────────────────────
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
    province: 'Đắk Lắk',
    region: 'highlands',
    emotionalPrompts: [
      'Sáng dậy sớm ngồi uống cà phê chồn ở Buôn Ma Thuột, tiếng chim rừng vang lên như ngày bé theo bố lên nương.',
      'Ghé buôn làng người Ê Đê lúc chiều, tiếng cồng chiêng vang trong gió làm lòng bật khóc không rõ lý do.',
    ],
    signatureLandmarks: ['Buôn Đôn', 'Hồ Lắk', 'Thác Dray Nur', 'Bảo tàng các dân tộc Việt Nam'],
    signatureDishes: ['Cà phê Buôn Ma Thuột', 'Cơm lam gà nướng', 'Thịt nai khô', 'Rượu cần Tây Nguyên'],
  },
  {
    province: 'Kon Tum',
    region: 'highlands',
    emotionalPrompts: [
      'Ngồi trên nhà rông Kon Tum chiều tà, gió núi lạnh mà lòng ấm vì nghe tiếng bà con nói cười bản xứ.',
      'Đi bộ dọc sông Đăk Bla sáng sớm, sương còn giăng mặt nước như chưa muốn tan.',
    ],
    signatureLandmarks: ['Nhà thờ gỗ Kon Tum', 'Cầu treo Kon Klor', 'Làng Kontu Ktu', 'Rừng thông Măng Đen'],
    signatureDishes: ['Cơm lam ống nứa', 'Gỏi lá Kon Tum', 'Phở khô Kon Tum', 'Muối kiến vàng'],
  },
  {
    province: 'Lâm Đồng',
    region: 'highlands',
    emotionalPrompts: [
      'Sáng sớm đi qua vùng trồng chè Bảo Lộc, hương chè theo gió vào mũi, lòng dịu lại như ngồi bên mẹ.',
      'Chiều ở Bảo Lộc trời mưa nhỏ, ngồi nhà uống trà B\'lao nghe mưa mà chẳng muốn đi đâu.',
    ],
    signatureLandmarks: ['Đồi chè Bảo Lộc', 'Thác Đambri', 'Thiền viện Trúc Lâm Phương Nam', 'Vườn dâu tằm'],
    signatureDishes: ['Trà B\'lao Bảo Lộc', 'Bánh tráng nướng sa tế', 'Dâu tằm tươi', 'Cơm chiên dương châu núi rừng'],
  },

  // ── SOUTH ──────────────────────────────────────────────────────────────────
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
    province: 'Phú Quốc',
    region: 'south',
    emotionalPrompts: ['Đi câu mực đêm với ngư dân.'],
    signatureLandmarks: ['Bãi Sao', 'Vinpearl Safari', 'Chợ đêm Dinh Cậu'],
    signatureDishes: ['Gỏi cá trích', 'Bún quậy', 'Nhum biển nướng'],
  },
  {
    province: 'Đồng Nai',
    region: 'south',
    emotionalPrompts: [
      'Chiều ở Biên Hòa nghe tiếng nhà máy xa xa, mùi đất đỏ sau cơn mưa đầu mùa, lòng lại thấy mình còn thuộc về nơi này.',
      'Ghé chùa Bửu Hưng đúng ngày giỗ, mùi hương trầm quen đến mức cổ họng cứ nghẹn.',
    ],
    signatureLandmarks: ['Văn miếu Trấn Biên', 'Khu bảo tồn thiên nhiên Mã Đà', 'Đảo Ó – Đồng Trường', 'Chùa Bửu Hưng'],
    signatureDishes: ['Bún riêu cua đồng', 'Bánh canh Trảng Bom', 'Chả giò Biên Hòa', 'Gà nướng than hoa'],
  },
  {
    province: 'Bình Dương',
    region: 'south',
    emotionalPrompts: [
      'Sáng sớm ghé làng gốm Lái Thiêu, mùi đất nung và tiếng tráng men vang lên quen như hơi thở.',
      'Đứng trước ngôi nhà cũ ở Thủ Dầu Một, cổng gỗ mòn vẹt – ký ức ùa về như chưa hề đi xa.',
    ],
    signatureLandmarks: ['Làng gốm Lái Thiêu', 'Khu du lịch Đại Nam', 'Nhà cổ Trần Văn Hổ', 'Chùa Hội Khánh'],
    signatureDishes: ['Bánh bèo bì Bình Dương', 'Măng cụt Lái Thiêu', 'Lẩu bò nhúng dấm', 'Bánh tằm bì'],
  },
  {
    province: 'Tây Ninh',
    region: 'south',
    emotionalPrompts: [
      'Lên Núi Bà Đen lúc sương còn dày, nhìn xuống đồng bằng trải rộng mà lòng thấy đất quê mình thật lớn.',
      'Bữa trưa bánh tráng phơi sương chấm mắm me dưới bóng cây điều già, nhớ những năm còn chạy ruộng với bà.',
    ],
    signatureLandmarks: ['Núi Bà Đen', 'Tòa thánh Cao Đài Tây Ninh', 'Hồ Dầu Tiếng', 'Khu căn cứ Trung ương Cục'],
    signatureDishes: ['Bánh tráng phơi sương', 'Muối tôm Tây Ninh', 'Bánh canh Tây Ninh', 'Trâu xào lăn'],
  },

  // ── MEKONG ─────────────────────────────────────────────────────────────────
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
    province: 'Long An',
    region: 'mekong',
    emotionalPrompts: [
      'Sáng sớm ra đồng cùng bố mẹ khi lúa vừa trổ đòng, mùi đất phù sa Đồng Tháp Mười theo gió.',
      'Bữa cơm chiều bên bờ kênh, ăn con cá lóc nướng trui vừa bắt được mà lòng thấy sung sướng hơn bất kỳ nhà hàng nào.',
    ],
    signatureLandmarks: ['Đồng Tháp Mười', 'Vườn thanh long Châu Thành', 'Khu di tích Vàm Nhựt Tảo', 'Làng nghề đan lát Tân Trụ'],
    signatureDishes: ['Lẩu chua cá linh bông súng', 'Rượu nếp Long An', 'Nem Thủ Thừa', 'Đặc sản rắn đồng'],
  },
  {
    province: 'Tiền Giang',
    region: 'mekong',
    emotionalPrompts: [
      'Ăn tô hủ tiếu Mỹ Tho buổi sáng ở quán bà Năm đầu hẻm, mùi nước lèo bay theo gió sông – lòng lại thấy mình vừa về tới nhà.',
      'Đi thuyền qua cồn Phụng cồn Thới Sơn, tiếng chèo khua nước làm bao nhiêu ký ức tuổi thơ dội về.',
    ],
    signatureLandmarks: ['Cồn Thới Sơn', 'Cồn Lân', 'Chợ Mỹ Tho', 'Trại rắn Đồng Tâm'],
    signatureDishes: ['Hủ tiếu Mỹ Tho', 'Sủi cảo nước Mỹ Tho', 'Bánh giá Chợ Giồng', 'Khô cá sặc'],
  },
  {
    province: 'Vĩnh Long',
    region: 'mekong',
    emotionalPrompts: [
      'Chèo thuyền qua cù lao Mây ngày nước lớn, nhìn hai hàng dừa nghiêng xuống mặt sông mà thấy lòng thanh thản.',
      'Chiều ngồi trước hiên nhà cổ Bình Hoà Phước, nghe tiếng gà gáy xa xa – lúc này mới hiểu vì sao người ta cứ nhớ quê.',
    ],
    signatureLandmarks: ['Cù lao An Bình', 'Nhà cổ Bình Hoà Phước', 'Văn Thánh Miếu Vĩnh Long', 'Cầu Mỹ Thuận'],
    signatureDishes: ['Lẩu mắm Vĩnh Long', 'Bánh ít lá gai', 'Chả lụa Vĩnh Long', 'Cháo cá rau đắng'],
  },
  {
    province: 'Đồng Tháp',
    region: 'mekong',
    emotionalPrompts: [
      'Mùa nước nổi ở Đồng Tháp, cánh đồng sen hồng rực rỡ giữa trời nước mênh mông – nhìn mà thấy lòng rộng ra.',
      'Về Cao Lãnh ăn tô bún cá lóc bà Nội nấu, vị chua ngọt thân quen không đâu sánh được.',
    ],
    signatureLandmarks: ['Vườn quốc gia Tràm Chim', 'Gò Tháp', 'Khu mộ Nguyễn Sinh Sắc', 'Làng hoa Sa Đéc'],
    signatureDishes: ['Bánh phồng tôm Sa Giang', 'Lẩu cá linh hoa điên điển', 'Xôi phồng Đồng Tháp', 'Nem chua Sa Đéc'],
  },
  {
    province: 'Sóc Trăng',
    region: 'mekong',
    emotionalPrompts: [
      'Đến Sóc Trăng dịp Oóc Om Bóc, tiếng trống ghe ngo vang lên giữa sông – lòng phấn chấn như thuở còn bé xem cùng ông ngoại.',
      'Ghé chùa Kh\'leang buổi sớm, mùi hoa lài và tiếng chuông ngân vang làm người lại bình yên.',
    ],
    signatureLandmarks: ['Chùa Kh\'leang', 'Chùa Dơi (Mã Tộc)', 'Hồ nước ngọt Sóc Trăng', 'Biển Hồ Bể'],
    signatureDishes: ['Bánh pía Sóc Trăng', 'Bún nước lèo Sóc Trăng', 'Lạp xưởng tươi', 'Bánh cống'],
  },
  {
    province: 'Bạc Liêu',
    region: 'mekong',
    emotionalPrompts: [
      'Ngồi nghe đờn ca tài tử ở Bạc Liêu đêm khuya, giọng ca vọng cổ nghe cứ như mang theo cả trời đất miền Tây.',
      'Sáng sớm ra cánh đồng điện gió nhìn chân trời rộng, cảm giác thơ thới như chưa từng thấy.',
    ],
    signatureLandmarks: ['Nhà công tử Bạc Liêu', 'Đồng Nọc Nạng', 'Vườn nhãn cổ Bạc Liêu', 'Cánh đồng điện gió'],
    signatureDishes: ['Bánh tằm bì Bạc Liêu', 'Muối ớt Bạc Liêu', 'Cháo hàu', 'Chả giò Bạc Liêu'],
  },
  {
    province: 'Cà Mau',
    region: 'mekong',
    emotionalPrompts: [
      'Đứng ở mũi Cà Mau – cực Nam Tổ quốc – nhìn biển đông tây hòa nhau, lòng dâng lên niềm tự hào khó tả.',
      'Chèo thuyền qua rừng đước Cà Mau, bóng tối xen kẽ ánh sáng lọc qua tán lá như tranh vẽ.',
    ],
    signatureLandmarks: ['Mũi Cà Mau', 'Vườn quốc gia U Minh Hạ', 'Rừng đước Năm Căn', 'Đất mũi Cà Mau'],
    signatureDishes: ['Cua biển Cà Mau', 'Ba khía muối', 'Tôm khô Cà Mau', 'Lẩu mắm cá đồng'],
  },
  {
    province: 'Kiên Giang',
    region: 'mekong',
    emotionalPrompts: [
      'Chiều ở Hà Tiên ngồi nhìn hoàng hôn xuống núi Tô Châu, sắc đỏ trải dài trên mặt vịnh – lần nào về cũng không thôi ngắm.',
      'Chợ Rạch Giá sáng sớm rộn tiếng rao, mùi cá mắm theo gió biển bay vào – đó là mùi của nhà.',
    ],
    signatureLandmarks: ['Mũi Nai – Hà Tiên', 'Quần đảo Nam Du', 'Chùa Phù Dung', 'Thạch Động Thôn Vân'],
    signatureDishes: ['Bánh canh Hà Tiên', 'Bún cá Kiên Giang', 'Gỏi cá trích Phú Quốc', 'Nước mắm Phú Quốc'],
  },
  {
    province: 'Trà Vinh',
    region: 'mekong',
    emotionalPrompts: [
      'Sáng sớm đến chùa Âng trong làn sương nhẹ, tiếng cầu kinh Khmer ngân nga làm lòng lắng xuống.',
      'Chạy xe dọc sông Cổ Chiên nhìn bờ dừa xanh mướt phản chiếu xuống nước, mùa gió lại nhớ bếp nhà.',
    ],
    signatureLandmarks: ['Chùa Âng (Angkorajaborey)', 'Biển Ba Động', 'Ao Bà Om', 'Làng Chăm Trà Vinh'],
    signatureDishes: ['Bánh tét Trà Cuôn', 'Bún nước lèo Trà Vinh', 'Cháo ám', 'Cốm dẹp chùa Khmer'],
  },
  {
    province: 'Hậu Giang',
    region: 'mekong',
    emotionalPrompts: [
      'Sáng sớm ra vườn khóm Cầu Đúc hít mùi trái chín, nhớ lại hồi còn nhỏ theo ngoại ra hái khóm bán chợ.',
      'Chiều trên sông Hậu, nhìn chiếc xuồng ba lá chở lúa từ xa lại – cuộc sống đơn giản mà ấm lòng.',
    ],
    signatureLandmarks: ['Vườn khóm Cầu Đúc', 'Khu du lịch Lung Ngọc Hoàng', 'Chợ Vị Thanh', 'Kênh xáng Xà No'],
    signatureDishes: ['Khóm Cầu Đúc', 'Cá thát lát Hậu Giang', 'Bánh tét Hậu Giang', 'Mắm thái Hậu Giang'],
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

/** Common city / nickname aliases so users can search by the place they actually call home. */
export const PROVINCE_ALIASES: Record<string, string[]> = {
  'Khánh Hòa': ['Nha Trang'],
  'Bình Định': ['Quy Nhơn', 'Quy Nhon'],
  'Bình Thuận': ['Phan Thiết', 'Mũi Né'],
  'Ninh Thuận': ['Phan Rang'],
  'Đắk Lắk': ['Buôn Ma Thuột', 'Ban Mê'],
  'Lâm Đồng': ['Bảo Lộc'],
  'Tiền Giang': ['Mỹ Tho'],
  'An Giang': ['Châu Đốc', 'Long Xuyên'],
  'Kiên Giang': ['Rạch Giá', 'Hà Tiên'],
  'Đồng Tháp': ['Cao Lãnh', 'Sa Đéc'],
  'Quảng Ninh': ['Hạ Long', 'Ha Long'],
  'Nghệ An': ['Vinh'],
  'Lào Cai': ['Sa Pa', 'Sapa'],
  'Quảng Nam': ['Tam Kỳ'],
  'Bà Rịa - Vũng Tàu': ['Vũng Tàu'],
  'Thừa Thiên Huế': ['Huế'],
  'Gia Lai': ['Pleiku'],
};

/** Search provinces by province name, city alias, or a signature landmark. Empty query = full list. */
export function matchProvinces(query: string): ProvinceLandmark[] {
  const q = query.trim().toLowerCase();
  if (!q) return PROVINCE_LANDMARKS;
  return PROVINCE_LANDMARKS.filter((p) => {
    if (p.province.toLowerCase().includes(q)) return true;
    const aliases = PROVINCE_ALIASES[p.province] ?? [];
    if (aliases.some((a) => a.toLowerCase().includes(q))) return true;
    return p.signatureLandmarks.some((l) => l.toLowerCase().includes(q));
  });
}

/** Returns the matched alias label for a query (for display as a subtitle), if any. */
export function matchedAlias(province: Province, query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const aliases = PROVINCE_ALIASES[province] ?? [];
  return aliases.find((a) => a.toLowerCase().includes(q)) ?? null;
}

const GENERIC_PROMPTS: string[] = [
  'Về lại con đường tuổi thơ, ăn bữa cơm nhà và nghe người thân kể chuyện cũ.',
  'Ngủ lại một đêm ở nhà, sáng thức dậy nghe tiếng chim và mùi bếp quen thuộc.',
  'Dành một buổi sáng đi bộ qua xóm nhỏ, ghé thăm những người hàng xóm cũ.',
  'Ngồi bên bàn cơm gia đình, ăn những món mẹ nấu mà không nơi nào có thể thay thế.',
];

export function buildCustomQueSeed(province: string): QueTripSeed {
  const name = province.trim();
  const prompt = GENERIC_PROMPTS[Math.floor(Math.random() * GENERIC_PROMPTS.length)];
  return {
    province: name,
    region: 'central',
    prompt,
    landmarks: [],
    dishes: [],
  };
}

export function buildQuePersonalNote(seed: QueTripSeed): string {
  const parts: string[] = [
    `Chuyến đi về quê ${seed.province}.`,
    seed.prompt,
    'Hãy gợi ý lịch trình mang cảm xúc trở về (không phải tour du khách).',
  ];
  if (seed.landmarks.length > 0) {
    parts.push(`Ưu tiên ghé: ${seed.landmarks.slice(0, 3).join(', ')}.`);
  }
  if (seed.dishes.length > 0) {
    parts.push(`Nhớ giới thiệu món ${seed.dishes.slice(0, 2).join(' và ')}.`);
  }
  return parts.join(' ');
}
