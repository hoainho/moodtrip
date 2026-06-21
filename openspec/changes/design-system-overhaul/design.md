# Design — Design System Overhaul

## Token layer (index.css, Tailwind v4 `@theme` + CSS vars)
Một nguồn chân lý. Ví dụ (tinh chỉnh khi triển khai, giữ AA):

```css
@theme {
  /* Surfaces — đêm/mơ, ấm hơn navy thuần */
  --color-bg:        #0b0f1a;   /* nền sâu */
  --color-surface:   #141a2b;   /* card */
  --color-elevated:  #1c2438;   /* card nổi / hero section */
  --color-border:    #2a3349;

  /* Accents — cân bằng ấm↔lạnh (khớp 3D G002) */
  --color-accent-cool: #38bdf8;  /* xanh (giữ, nhưng có kỷ luật) */
  --color-accent-warm: #f59e0b;  /* amber — điểm nhấn cảm xúc, khớp 3D */
  --color-accent-warm-2:#e8795a; /* terracotta phụ */

  /* Text — thang đạt ≥4.5:1 trên surface */
  --color-text:       #f1f5f9;   /* primary */
  --color-text-muted: #aab4c6;   /* nhãn/secondary — KHÔNG dùng slate-500/600 */
  --color-text-faint: #8b96aa;   /* chỉ cho non-essential, ≥4.5 trên bg */

  --color-success:#34d399; --color-warn:#fbbf24;

  /* Elevation / blur levels */
  --blur-1: 8px; --blur-2: 16px; --blur-3: 28px;
  --shadow-1: 0 2px 8px rgb(0 0 0 / .25);
  --shadow-2: 0 8px 28px rgb(0 0 0 / .35);

  /* Type scale (rem) */
  --text-eyebrow: .8125rem;  /* 13px, +tracking, NHƯNG đủ contrast */
  --text-body: .9375rem;     /* 15px */
  --text-h3: 1.25rem; --text-h2: 1.75rem; --text-h1: 2.5rem;

  /* Spacing rhythm */
  --space-section: 1.5rem; --radius-card: 1rem;
}
```
Scrim levels (token hoá utility hiện có): `.scrim-1/-2/-3` = radial/linear overlay tăng dần cho text-trên-nền, đảm bảo ≥4.5:1.

## Palette rationale (chống "AI default blue/purple")
- Không dùng tím-xanh mặc định tràn lan. Chủ đạo: navy ấm + **một** accent ấm (amber) cho hành động/điểm nhấn cảm xúc + accent lạnh có kỷ luật cho thông tin. Đây là *brand* (du lịch theo cảm xúc, ban đêm/mơ) → có lý do rõ ràng, không phải default.
- Gradient: giữ kỷ luật G003 (tối đa 1 gradient CTA/màn).

## Phá đơn điệu (form rhythm)
- **Mood = hero section**: nền `--color-elevated`, ring accent-warm nhẹ, lớn hơn — là điểm rơi thị giác đầu tiên.
- Các section logistics (địa điểm/thời gian/ngân sách) nhẹ hơn (`--color-surface`), gọn, không cạnh tranh với hero.
- Seam 3D↔form: thêm dải gradient/scrim mềm chuyển từ xanh-3D → `--color-bg` (không cắt gắt).
- Nhịp: không phải N card đồng kích thước — biến hoá weight/spacing để mắt có điểm dừng.

## Surfaces cần áp token (D2)
| Surface | Điểm chính |
|---|---|
| Hero/landing | grid headline+3D (giữ G003), scrim-2 sau text, accent-warm CTA |
| TripForm | rhythm trên, nhãn → `--text-muted`, hero mood |
| ItineraryDisplay + sticky map | màu token, contrast nhãn giờ/giá, giữ layout G003 |
| CardPullOnboarding | panel token, scrim, warm ambient (giữ G003) |
| ChatCompanion/Footer/PersonalWorldBadge/IntroScreen | text token (xoá slate-500/600 còn sót) |
| 3D overlays | đồng bộ amber/indigo G002 |

## a11y (lưới an toàn — không thoả hiệp)
- Mọi cặp text/nền touched đạt ≥4.5:1 (≥3:1 cho ≥24px/bold). Xác minh bằng `e2e/a11y.spec` (axe 0 serious/critical landing/form/result, desktop+mobile) — **đây là gate cứng**.
- `--text-faint` chỉ cho non-essential và vẫn phải ≥4.5 trên `--color-bg`.

## Testing
- `e2e/a11y.spec` (đã có) phải xanh sau đổi màu — đây là regression chính.
- Visual baseline (chromium-visual) cập nhật có chủ đích; diff được review, không tự nuốt.
- Render review desktop+mobile cho landing/form/result/card-pull → human aesthetic sign-off.
- tsc + build xanh.

## Sequencing
D1 (tokens) → [flexible-mood-input M*] → D2 (áp visual surfaces) → D-verify. Token trước để mood mới và các surface dùng chung, tránh sửa hai lần.
