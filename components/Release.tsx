import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import { IconChevronLeft } from './icons';

interface ReleaseProps {
  onGoHome: () => void;
}

const CHANGELOG_CONTENT = `# MoodTrip - Ghi Ch\u00fa Ph\u00e1t H\u00e0nh

> **Phi\u00ean B\u1ea3n T\u00e0i Li\u1ec7u:** 4.2  
> **C\u1eadp Nh\u1eadt L\u1ea7n Cu\u1ed1i:** 01/03/2026

---

## \uD83C\uDD95 Phi\u00ean B\u1ea3n 4.2

_01/03/2026_

### \u0110i\u1ec3m N\u1ed5i B\u1eadt
- Thanh t\u00e1c v\u1ee5 n\u1ed5i (Floating Action Bar) \u2014 thao t\u00e1c nhanh L\u01b0u, PDF, Chia s\u1ebb, K\u1ef7 ni\u1ec7m
- Chia s\u1ebb chuy\u1ebfn \u0111i qua link & m\u00e3 QR kh\u00f4ng c\u1ea7n server
- Ch\u1ebf \u0111\u1ed9 Live Trip \u2014 theo d\u00f5i ho\u1ea1t \u0111\u1ed9ng th\u1eddi gian th\u1ef1c
- So s\u00e1nh 2 chuy\u1ebfn \u0111i c\u1ea1nh nhau
- K\u1ef7 ni\u1ec7m chuy\u1ebfn \u0111i \u2014 th\u1ebb recap \u0111\u1eb9p \u0111\u1ec3 chia s\u1ebb

### T\u00ednh N\u0103ng M\u1edbi

| T\u00ednh N\u0103ng | M\u00f4 T\u1ea3 |
| --- | --- |
| Floating Action Bar | Thanh n\u1ed5i c\u1ed1 \u0111\u1ecbnh d\u01b0\u1edbi m\u00e0n h\u00ecnh v\u1edbi c\u00e1c nút L\u01b0u, PDF, Chia s\u1ebb, K\u1ef7 ni\u1ec7m, Chuy\u1ebfn m\u1edbi |
| Gallery chuy\u1ebfn \u0111i | Trang ch\u1ee7 hi\u1ec3n th\u1ecb l\u1ecbch s\u1eed chuy\u1ebfn \u0111i d\u1ea1ng th\u1ebb card m\u00e0u gradient, h\u1ed7 tr\u1ee3 x\u00f3a |
| Tab \u0111i\u1ec1u h\u01b0\u1edbng | Thanh tab ngang cu\u1ed9n \u0111\u01b0\u1ee3c \u0111\u1ec3 nh\u1ea3y nhanh \u0111\u1ebfn t\u1eebng m\u1ee5c l\u1ecbch tr\u00ecnh |
| Chia s\u1ebb qua link | N\u00e9n l\u1ecbch tr\u00ecnh v\u00e0o URL, ng\u01b0\u1eddi nh\u1eadn m\u1edf xem kh\u00f4ng c\u1ea7n \u0111\u0103ng nh\u1eadp |
| M\u00e3 QR | T\u1ea1o m\u00e3 QR t\u1ef1 \u0111\u1ed9ng t\u1eeb link chia s\u1ebb, d\u1ec5 qu\u00e9t b\u1eb1ng \u0111i\u1ec7n tho\u1ea1i |
| Live Trip Mode | \u0110\u00e1nh d\u1ea5u ho\u1ea1t \u0111\u1ed9ng \u0111ang di\u1ec5n ra v\u1edbi badge LIVE xanh l\u00e1 nh\u1ea5p nh\u00e1y |
| Confetti & Haptic | Hi\u1ec7u \u1ee9ng ph\u00e1o hoa + rung khi l\u01b0u l\u1ecbch tr\u00ecnh th\u00e0nh c\u00f4ng |
| Skeleton Loading | M\u00e0n h\u00ecnh ch\u1edd d\u1ea1ng khung x\u01b0\u01a1ng thay v\u00ec spinner, gi\u1ed1ng layout th\u1eadt |
| K\u1ef7 ni\u1ec7m chuy\u1ebfn \u0111i | Th\u1ebb recap \u0111\u1eb9p v\u1edbi th\u00f4ng tin t\u00f3m t\u1eaft, d\u1ec5 ch\u1ee5p m\u00e0n h\u00ecnh chia s\u1ebb |
| So s\u00e1nh chuy\u1ebfn \u0111i | \u0110\u1eb7t 2 chuy\u1ebfn c\u1ea1nh nhau so s\u00e1nh ng\u00e0y, m\u00f3n \u0103n, chi ph\u00ed |
| Haptic n\u00e2ng cao | Nhi\u1ec1u ki\u1ec3u rung ph\u1ea3n h\u1ed3i cho c\u00e1c thao t\u00e1c kh\u00e1c nhau (nh\u1ea5n, ch\u1ecdn, c\u1ea3nh b\u00e1o) |

### C\u1ea3i Ti\u1ebfn

| C\u1ea3i Ti\u1ebfn | M\u00f4 T\u1ea3 |
| --- | --- |
| UX t\u1ed1i \u01b0u | Thao t\u00e1c ch\u00ednh \u0111\u01b0\u1ee3c gom v\u00e0o FAB, gi\u1ea3m r\u1ed1i m\u1eaft |
| \u0110\u1ebfm ng\u01b0\u1ee3c ho\u1ea1t \u0111\u1ed9ng | Hi\u1ec3n th\u1ecb th\u1eddi gian c\u00f2n l\u1ea1i \u0111\u1ebfn ho\u1ea1t \u0111\u1ed9ng ti\u1ebfp theo |
| Gallery responsive | Card grid t\u1ef1 \u0111\u1ed9ng 1/2/3 c\u1ed9t theo m\u00e0n h\u00ecnh |
| Kh\u00f4ng c\u1ea7n server | Chia s\u1ebb v\u00e0 QR ho\u00e0n to\u00e0n client-side, kh\u00f4ng l\u01b0u d\u1eef li\u1ec7u \u1edf server |

---

## Phi\u00ean B\u1ea3n 4.1

_28/02/2026_

### Điểm Nổi Bật
- Chế độ Ngắn hạn mới — lên kế hoạch khám phá thành phố trong vài giờ
- Gợi ý địa điểm trending với badge 🔥 trên các điểm hot
- Sửa lỗi responsive cho nút chọn ngày/đêm trên mobile

### Tính Năng Mới

| Tính Năng | Mô Tả |
| --- | --- |
| Chế độ Dài hạn / Ngắn hạn | Toggle chuyển đổi giữa chuyến đi dài ngày và khám phá ngắn trong nội ô |
| 6 Phong cách mới | Hẹn hò, Cà phê, Food Tour, Nightlife, Vui chơi, Chill |
| Chọn giờ bắt đầu / kết thúc | Time picker cho chế độ ngắn hạn thay vì chọn ngày |
| Ngân sách 100K - 5M | Phạm vi ngân sách phù hợp cho chuyến ngắn |
| Trending Badge | Đánh dấu 🔥 và lý do trending cho địa điểm hot |
| Ẩn thông tin không cần thiết | Tự động ẩn chỗ nghỉ và gợi ý trang phục khi đi ngắn |

### Sửa Lỗi

| Sửa Lỗi | Mô Tả |
| --- | --- |
| Stepper responsive | Thu nhỏ nút +/- chọn ngày/đêm trên mobile để không bị tràn |
| Unicode PDF header | Sửa hiển thị tiếng Việt bị lỗi trong header xuất PDF |

---

## Phiên Bản 4.0

_25/02/2026_

### Điểm Nổi Bật
- Nâng cấp toàn diện giao diện và trải nghiệm người dùng
- Trợ Lý Du Lịch AI — tính năng chat thông minh hỗ trợ mọi thắc mắc về du lịch
- Cải thiện hiệu ứng 3D với mây, hạt sáng và hiệu ứng cực quang
- Thêm trang Mẹo Du Lịch, Giới Thiệu và Footer chung

### Tính Năng Mới

| Tính Năng | Mô Tả |
| --- | --- |
| Trợ Lý Du Lịch AI | Chat trực tiếp với AI để hỏi đáp về điểm đến, gợi ý, mẹo du lịch |
| Trang Mẹo Du Lịch | Hướng dẫn chi tiết về hành lý, an toàn, tiết kiệm, văn hóa, ẩm thực |
| Trang Giới Thiệu | Thông tin về MoodTrip, công nghệ sử dụng và nhà phát triển |
| Footer | Thanh điều hướng chung với liên kết nhanh và bản quyền |
| Icon SVG | Thay thế toàn bộ emoji bằng biểu tượng SVG chuyên nghiệp |
| Tiếng Việt có dấu | Toàn bộ nội dung được cập nhật tiếng Việt chuẩn có dấu |

### Cải Tiến

| Cải Tiến | Mô Tả |
| --- | --- |
| Hiệu ứng 3D | Mây khí quyển, hệ thống hạt sáng nâng cấp, vòng cực quang |
| Camera động | Camera theo dõi chuột với chuyển động mượt mà |
| Tải PDF | Không còn đóng băng giao diện khi xuất PDF |
| Hiệu năng | Tự động giảm chất lượng 3D trên thiết bị yếu (AdaptiveDpr) |
| Responsive | Giao diện tương thích tốt hơn với mọi kích thước màn hình |
---

## Phiên Bản 3.0

_25/02/2026_

### Điểm Nổi Bật
- Nâng cấp toàn diện giao diện với hiệu ứng 3D và thiên nhiên
- Tích hợp Proxy API thay thế cho API key trực tiếp
- Thêm intro screen với hiệu ứng loading tuyệt đẹp

### Tính Năng Mới

| Tính Năng | Mô Tả |
| --- | --- |
| 3D Nature Scene | Hiệu ứng 3D toàn màn hình với cấu trúc núi, mây và hạt sáng |
| Intro Screen | Màn hình chào đón với animation và progress bar |
| Glassmorphism UI | Giao diện kính trong suốt hiện đại, tối giản |
| Motion Animations | Chuyển động mượt mà giữa các trang với motion/react |
| Proxy API | Không cần API key — sử dụng proxy để gọi AI tự động |
| Dark Nature Theme | Giao diện tối với màu sắc thiên nhiên (teal, cyan, green) |

### Cải Tiến

| Cải Tiến | Mô Tả |
| --- | --- |
| Tailwind CSS v4 | Nâng cấp từ CDN sang build tool chính thức |
| Performance | Tối ưu hiệu năng với React Three Fiber và lazy loading |
| Responsive | Giao diện tương thích tốt hơn với mọi kích thước màn hình |

---

## Phiên Bản 2.0

_12/07/2025_

### Điểm Nổi Bật
- Nhiều tính năng mới cho quản lý chuyến đi và cá nhân hóa
- Trải nghiệm người dùng được cải thiện và mở rộng hỗ trợ điểm đến

### Tính Năng Mới

| Tính Năng | Mô Tả |
| --- | --- |
| Lưu Thông Tin Chuyến Đi | Người dùng giờ đây có thể lưu lịch trình đã tạo để tham khảo sau này. |
| Mẹo Du Lịch Theo Địa Điểm | Bổ sung mẹo du lịch chi tiết cho từng điểm dừng trong lịch trình. |
| Lịch Sử Chuyến Đi | Phần mới trên trang chính để xem tất cả các chuyến đi đã lưu. |

---

## Phiên Bản 1.0

_01/07/2025_

### Điểm Nổi Bật
- Ra mắt lần đầu với các tính năng lập kế hoạch chuyến đi cơ bản

### Tính Năng

| Tính Năng | Mô Tả |
| --- | --- |
| Tạo Chuyến Đi Nhanh | Lập kế hoạch chuyến đi dựa trên tâm trạng, ngân sách và thời gian. |
| Hiển Thị Lịch Trình Chi Tiết | Xem lịch trình du lịch chi tiết, dễ đọc. |
| Giao Diện Hoạt Ảnh | Chuyển đổi và hoạt ảnh mượt mà để có trải nghiệm tốt hơn. |
| Tải Xuống Lịch Trình | Xuất kế hoạch du lịch của bạn dưới dạng PDF. |

---

_Bản quyền © 2025-2026 MoodTrip. Phát triển bởi Hoài Nhớ. Mọi quyền được bảo lưu._`;

export const Release: React.FC<ReleaseProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-30 glass-dark border-b border-white/5">
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-2xl font-bold text-gradient-nature">MoodTrip</div>
          <motion.button
            onClick={onGoHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-sm font-medium text-teal-400 hover:text-teal-300 flex items-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <IconChevronLeft className="w-5 h-5 mr-1" />
            Quay lại trang chủ
          </motion.button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 tracking-tight text-gradient-aurora text-shadow-md">
            Ghi Chú Phát Hành
          </h1>
          <div className="prose prose-invert max-w-none markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 className="text-3xl font-bold text-gradient-nature mt-8 mb-4">{children}</h1>,
                h2: ({children}) => <h2 className="text-2xl font-bold text-teal-400 mt-8 mb-3 border-l-4 border-teal-500 pl-4 bg-teal-500/5 py-2 rounded-r-lg">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-semibold text-cyan-400 mt-6 mb-2 bg-cyan-500/5 px-3 py-1 rounded-lg inline-block">{children}</h3>,
                p: ({children}) => <p className="text-slate-300 mb-3">{children}</p>,
                li: ({children}) => <li className="text-slate-300">{children}</li>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-teal-500/50 pl-4 py-2 text-slate-400 italic bg-white/5 rounded-r-lg">{children}</blockquote>,
                table: ({children}) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse rounded-xl overflow-hidden">{children}</table></div>,
                thead: ({children}) => <thead className="bg-teal-500/10">{children}</thead>,
                th: ({children}) => <th className="text-left px-4 py-3 text-teal-300 font-semibold border-b border-white/10">{children}</th>,
                td: ({children}) => <td className="px-4 py-3 text-slate-300 border-b border-white/5">{children}</td>,
                hr: () => <hr className="my-8 border-white/10" />,
                em: ({children}) => <em className="text-slate-500 not-italic">{children}</em>,
                strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
              }}
            >
              {CHANGELOG_CONTENT}
            </ReactMarkdown>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
