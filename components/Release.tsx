import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Enables tables and GFM features

interface ReleaseProps {
  onGoHome: () => void;
}

// Nhúng nội dung CHANGELOG trực tiếp vào component
const CHANGELOG_CONTENT = `# MoodTrip – Ghi Chú Phát Hành

> **Phiên Bản Tài Liệu:** 2.0  
> **Cập Nhật Lần Cuối:** 12/07/2025

---

## Phiên Bản 2.0

_12/07/2025_

### Điểm Nổi Bật
- Nhiều tính năng mới cho quản lý chuyến đi và cá nhân hóa
- Trải nghiệm người dùng được cải thiện và mở rộng hỗ trợ điểm đến

### Tính Năng Mới

| Tính Năng                                   | Mô Tả                                                                                             |
|-----------------------------------------------|---------------------------------------------------------------------------------------------------|
| Lưu Thông Tin Chuyến Đi                     | Người dùng giờ đây có thể lưu lịch trình đã tạo để tham khảo sau này.                            |
| Mẹo Du Lịch Theo Địa Điểm                  | Bổ sung mẹo du lịch chi tiết cho từng điểm dừng trong lịch trình.                                |
| Lịch Sử Chuyến Đi                           | Phần mới trên trang chính để xem tất cả các chuyến đi đã lưu.                                    |

### Cải Tiến

| Cải Tiến                                    | Mô Tả                                                                                             |
|-----------------------------------------------|---------------------------------------------------------------------------------------------------|
| Lịch Trình Cá Nhân Hóa                      | Người dùng có thể dễ dàng chỉnh sửa thời gian cho từng hoạt động trong lịch trình.               |
| Nhập Địa Điểm Xuất Phát                    | Thêm trường nhập liệu để người dùng chỉ định địa điểm xuất phát để lập kế hoạch chính xác hơn.   |
| Hỗ Trợ Điểm Đến Toàn Cầu                    | Giờ đây hỗ trợ các điểm đến trên toàn thế giới.                                                   |
| Chọn Ngày Khởi Hành                         | Người dùng có thể chọn ngày khởi hành cụ thể cho chuyến đi của họ.                               |

---

## Phiên Bản 1.0

_01/07/2025_

### Điểm Nổi Bật
- Ra mắt lần đầu với các tính năng lập kế hoạch chuyến đi cơ bản

### Tính Năng

| Tính Năng                                   | Mô Tả                                                                                             |
|-----------------------------------------------|---------------------------------------------------------------------------------------------------|
| Tạo Chuyến Đi Nhanh                         | Lập kế hoạch chuyến đi dựa trên tâm trạng, ngân sách và thời gian.                              |
| Hiển Thị Lịch Trình Chi Tiết               | Xem lịch trình du lịch chi tiết, dễ đọc.                                                         |
| Giao Diện Hoạt Ảnh                          | Chuyển đổi và hoạt ảnh mượt mà để có trải nghiệm tốt hơn.                                       |
| Mẹo Du Lịch Chung                           | Mẹo hữu ích cho từng điểm đến.                                                                   |
| Lập Kế Hoạch Lộ Trình Cụ Thể               | Bao gồm thời gian, ngày tháng và địa điểm cho tất cả các hoạt động.                             |
| Tải Xuống Lịch Trình                        | Xuất kế hoạch du lịch của bạn dưới dạng PDF.                                                     |

---

_Bản quyền © 2025 MoodTrip. Đã đăng ký bản quyền._`;

export const Release: React.FC<ReleaseProps> = ({ onGoHome }) => {
  // Không cần fetch từ file nữa, sử dụng nội dung đã nhúng
  const changelogContent = CHANGELOG_CONTENT;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">MoodTrip</div>
          <button
            onClick={onGoHome}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Quay lại trang chủ
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-2 tracking-tight text-blue-700">
            MoodTrip – Ghi Chú Phát Hành
          </h1>
          {/* Render Markdown Content */}
            <div className="prose max-w-none dark:prose-invert markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  span: ({className, children}) => {
                    if (className === 'release-date') {
                      return <>{children}</>;
                    }
                    return <span>{children}</span>;
                  },
                  sub: ({children}) => <>{children}</>,
                  sup: ({children}) => <>{children}</>,
                }}
              >
                {changelogContent}
              </ReactMarkdown>
            </div>
        </div>
      </main>
    </div>
  );
};

document.addEventListener('DOMContentLoaded', function () {
  const style = document.createElement('style');
  style.innerHTML = `
    .markdown-body table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1rem;
    }
    .markdown-body th, .markdown-body td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    .markdown-body th {
      background-color: #f4f4f4;
      font-weight: bold;
      text-align: left;
    }
    /* Custom style for release headings */
    .markdown-body h1 {
      font-size: 2.5rem;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      color: #1d4ed8;
      text-align: left;
      font-weight: 900;
      background: linear-gradient(90deg, #38bdf8 0%, #6366f1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .markdown-body h2 {
      font-size: 2rem;
      margin-top: 2.5rem;
      margin-bottom: 0.5rem;
      color: #2563eb;
      text-align: left;
      font-weight: 800;
      border-left: 6px solid #38bdf8;
      padding-left: 0.75rem;
      background-color: #f0f9ff;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .markdown-body h3 {
      font-size: 1.35rem;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: #0ea5e9;
      font-weight: 700;
      background-color: #f0f9ff;
      padding: 0.25rem 0.75rem;
      border-radius: 0.5rem;
      display: inline-block;
    }
    /* Custom style for release date */
    .markdown-body .release-date {
      display: block;
      color: #64748b;
      font-size: 1rem;
      margin-bottom: 1.5rem;
      margin-top: -1rem;
      text-align: left;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);
});
