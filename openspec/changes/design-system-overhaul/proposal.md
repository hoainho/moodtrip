# Design System Overhaul — color harmony, blur/scrim, readability

## Why
Sau G003 (layout/a11y/scrim), người dùng vẫn thấy *"UI chưa đủ ấn tượng, màu sắc chưa hài hòa, một số background chưa đủ blur khiến text khó đọc."* Tự kiểm tra render thực tế (form) xác nhận:

- **Đơn điệu**: toàn bộ form là chuỗi card dark-glass xếp dọc *giống hệt nhau* — không nhịp điệu, không điểm nhấn, không phân cấp thị giác. Cảm giác "chưa được review".
- **Màu chưa hài hòa**: gần như chỉ teal/cyan trên navy; nền 3D xanh lá ở đầu trang tạo "đường nối" gắt với form navy; thiếu tông ấm để cân bằng → cảm xúc lạnh, phẳng.
- **Đọc khó**: nhãn uppercase nhỏ màu slate (ĐỊA ĐIỂM/THỜI GIAN…) và nhãn mood tí hon độ tương phản thấp; vài chỗ text nằm trên 3D/gradient chưa đủ scrim.
- Màu/scrim hiện rải rác bằng class Tailwind tuỳ tiện, **không có nguồn chân lý** (design tokens) → mỗi screen lệch nhau, khó giữ nhất quán & khó đạt AA đồng đều.

Người dùng đã chốt: **đại tu hệ thống (design tokens + toàn bộ surfaces)**.

## What Changes
1. **Design tokens (nguồn chân lý)** trong `index.css` (Tailwind v4 `@theme`/CSS vars): palette ngữ nghĩa cân bằng ấm↔lạnh, thang tương phản đạt AA; type scale; spacing rhythm; elevation/blur levels; scrim levels. Mọi component tiêu thụ token, không hardcode hex rời rạc.
2. **Palette hài hòa**: giữ cảm giác "mơ/ban đêm" nhưng thêm accent ấm (amber/terracotta) làm điểm nhấn cảm xúc, định nghĩa rõ surface/elevated/border/accent-cool/accent-warm/success/warn; loại bỏ teal-tràn-lan. Khớp với palette 3D (G002: warm `#f59e0b` + indigo `#1e3a5f`) để 3D ↔ UI liền mạch.
3. **Phá đơn điệu form**: tạo nhịp — section hero (mood) nổi bật hơn các section logistics; varied weight/elevation thay vì N card giống nhau; xử lý seam 3D↔form (chuyển tiếp gradient/scrim mềm).
4. **Blur/scrim đủ mạnh & nhất quán**: scrim utility theo cấp (token), áp cho MỌI text-trên-nền (3D, ảnh hero, gradient); audit từng bề mặt đạt ≥4.5:1.
5. **Readability**: nâng nhãn nhỏ uppercase slate → cấp token đọc được (size/contrast); body ≥14px (giữ chuẩn G003); hệ thống hoá thay vì sửa lẻ.
6. **Áp lại toàn bộ surfaces**: landing/Hero, TripForm, result (ItineraryDisplay + sticky map), card-pull, 3D overlays, Footer — đồng bộ token.

### Out of scope
- Cấu trúc & hành vi khu mood do change **flexible-mood-input** lo; change này chỉ cấp *token + lớp visual* cho khu đó.
- Không đổi layout 2-col/sticky-map (G003) — chỉ tinh chỉnh màu/độ tương phản/nhịp.
- Không đụng logic 3D scene (G002) ngoài việc đồng bộ palette token.

## Impact
- Affected: `index.css` (tokens — trung tâm), `components/{Hero,TripForm,ItineraryDisplay,CardPullOnboarding,ChatCompanion,Footer,PersonalWorldBadge,IntroScreen,TripHeroBanner,TripMap}.tsx`, có thể `tailwind`/`vite` config nếu cần `@theme`.
- Risk: thay đổi diện rộng về màu → dễ regress a11y contrast. Lưới an toàn: `e2e/a11y.spec` (axe 0 serious/critical) + visual baseline + render review. Token hoá giúp *giảm* rủi ro dài hạn.
- Phối hợp: nên làm **sau/song song** flexible-mood-input để khu mood mới hưởng token mới ngay (tránh sửa hai lần). Đề xuất thứ tự: tokens (D1) → mood-input (M*) → áp visual còn lại (D2+).
