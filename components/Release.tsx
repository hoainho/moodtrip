import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import { IconChevronLeft } from './icons';

interface ReleaseProps {
  onGoHome: () => void;
}

const CHANGELOG_CONTENT = `# MoodTrip - Ghi Chú Phát Hành

> **Phiên Bản Tài Liệu:** 4.0  
> **Cập Nhật Lần Cuối:** 25/02/2026

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
