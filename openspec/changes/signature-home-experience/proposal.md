# Signature Home Experience — Mood-Reactive + Living Ambient

## Why
Hai change kia (design tokens + flexible mood) giải quyết "hài hoà & linh động" nhưng vẫn **an toàn, thiếu khoảnh khắc wow**, và home còn tĩnh. Người dùng muốn *"điểm nhấn mạnh mẽ hơn"* và *"home sinh động đặc biệt"*.

Cơ hội độc nhất của MoodTrip: app lấy **cảm xúc** làm trung tâm và đã có sẵn **scene 3D** (G002). Thay vì thêm hiệu ứng trang trí rời rạc, biến chính cảm xúc người dùng thành **động cơ thị giác sống** — thứ app du lịch khác không làm được. Đây là điểm nhấn lớn nhất, đồng thời *nối* hai track còn lại thành một trải nghiệm.

## What Changes (đã chốt với người dùng)
**Flagship — Mood-Reactive + Living Ambient home:**
1. **Mood Theme Engine** — từ `MoodInput` (text + seeds + intensity) suy ra một "theme cảm xúc" `{ warmth, energy, accent, lightColor, particleSpeed }`; cập nhật real-time (debounced) khi người dùng gõ/chọn. Ghi vào CSS vars (`--mood-*`) + truyền vào scene 3D.
2. **Living ambient home** — nền aurora/mesh-gradient "thở", đốm sáng trôi (fireflies) parallax theo con trỏ, entrance điện ảnh khi tải. Có fallback CSS khi không có WebGL.
3. **Scene 3D phản ứng** — ánh sáng/bloom/tốc độ hạt của NatureScene đổi theo mood theme.

**Focal points toàn app (đã chốt — cả 4):**
4. **Mood-driven theming toàn app** — accent + ambient theo mood xuyên home→form→result; trang kết quả mang "tone" của cảm xúc đã chọn.
5. **Result hero banner sống động** — mở trang kết quả bằng banner điểm đến (gradient khí quyển + tiêu đề động) trước khi vào chi tiết.
6. **Microinteractions** — chip ripple, CTA "magnetic", slider cường độ làm scene mạnh/nhẹ tức thì, counter đếm số khi hiện.
7. **Kinetic mood typography** — từ khoá headline morph qua các cảm xúc.

## Kỷ luật bắt buộc (không thương lượng)
- **Readability là tối thượng** (đúng phàn nàn gốc): mood theming chỉ đổi accent/ambient/ánh sáng — **không bao giờ** giảm scrim/contrast của text. Aurora luôn nằm SAU scrim. a11y axe 0 serious/critical vẫn là **gate cứng**.
- **`prefers-reduced-motion: reduce`** → đóng băng mọi animation về trạng thái tĩnh đẹp (đồng thời thoả mãn `freezeScene` của harness + visual baseline ổn định).
- **Perf 60fps**: số hạt giới hạn; pause khi tab ẩn (tái dùng `PauseOnHidden` G002); reactive update debounce/throttle; chỉ animate `transform`/`opacity`/CSS-var (không layout thrash); degrade graceful khi không WebGL.

## Out of scope
- Token màu nền/scrim cơ bản: do `design-system-overhaul` (D1) cấp; change này thêm lớp `--mood-*` động phía trên.
- Cấu trúc mood input: do `flexible-mood-input` (M*) cấp; change này *tiêu thụ* `MoodInput`.

## Impact
- New: `hooks/useMoodTheme.ts` + `MoodThemeProvider` (context), `components/home/AmbientHero.tsx` (+ helpers), có thể `components/three/*` cho hạt/light uniforms.
- Affected: `App.tsx` (provider + truyền mood theme vào result), `components/{Hero,TripForm,ItineraryDisplay,TripHeroBanner,ChatCompanion}.tsx`, scene 3D (G002 files), `index.css` (`--mood-*` vars + reduced-motion).
- Depends on: `flexible-mood-input` (MoodInput) + `design-system-overhaul` (tokens). Thứ tự: D1 → M* → **S*** (change này) → áp visual D2–D4.
- Risk: perf + a11y. Lưới an toàn: e2e perf-aware (freezeScene), axe gate, visual baseline, render review. NO PUSH tới khi human aesthetic sign-off.
