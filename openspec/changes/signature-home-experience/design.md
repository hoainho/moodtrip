# Design — Signature Home Experience

## Mood Theme Engine (trái tim của concept)

```ts
// hooks/useMoodTheme.ts
export interface MoodTheme {
  warmth: number;       // 0..1  lạnh→ấm  (hue/temperature)
  energy: number;       // 0..1  tĩnh→động (particle speed, bloom, motion amplitude)
  accent: string;       // hsl() suy từ warmth, ghi vào --mood-accent
  lightColor: string;   // màu ánh sáng scene 3D
  particleSpeed: number;
}

// Suy diễn từ MoodInput: keyword heuristics trên text + seeds, scale bởi intensity.
// vd: 'chữa lành|chậm|nghỉ|thiền|tĩnh' → warmth cao, energy thấp
//     'phiêu lưu|khám phá|sôi động|mạo hiểm' → energy cao, warmth trung tính-ấm
//     'lãng mạn' → warmth cao, energy thấp-vừa ; 'văn hoá' → trung tính
// Không match → theme "cân bằng" mặc định (giống fallback prompt).
export function deriveMoodTheme(mood: MoodInput): MoodTheme { /* pure, testable */ }
```

- `MoodThemeProvider` (context) giữ theme hiện tại; cập nhật **debounce ~250ms** khi `MoodInput` đổi (tránh giật khi gõ).
- Side-effect: ghi `--mood-accent`, `--mood-warmth`, `--mood-energy` lên `:root` (1 lần/đổi, qua `requestAnimationFrame`). Component dùng `var(--mood-accent)` → đổi màu mượt qua CSS `transition` (không re-render React diện rộng).
- Scene 3D đọc theme qua context (uniforms: light color/intensity, bloom, particle speed).
- `deriveMoodTheme` là **pure function** → unit test trực tiếp (đây là phần logic có giá trị nhất để test).

## Living ambient home (components/home/AmbientHero.tsx)
- **Aurora/mesh-gradient "thở"**: 2–3 radial-gradient blob dịch chuyển chậm (CSS `@keyframes`, `transform`/`opacity` only), màu lấy từ `--mood-accent`/`--mood-warmth`. Luôn nằm SAU lớp scrim của text.
- **Fireflies**: ~24–40 đốm sáng (CSS particles hoặc R3F Points nếu scene đã mở) trôi lơ lửng, tốc độ = `--mood-energy`. Cap số lượng theo `energy`.
- **Cursor parallax**: lớp nền dịch nhẹ theo con trỏ (`transform: translate`, throttle qua rAF). Tắt trên touch.
- **Entrance điện ảnh**: stagger reveal headline → 3D world materialize → value chips settle (CSS animation, ≤900ms, chạy 1 lần).
- **Fallback**: không WebGL → bỏ 3D, giữ aurora+fireflies CSS (vẫn sống động). `prefers-reduced-motion` → tất cả đóng băng ở khung đẹp tĩnh.

## Focal points
| # | Cái gì | Triển khai |
|---|---|---|
| 4 | Theming toàn app | `--mood-accent` consumed bởi button/chip/highlight ở Hero, TripForm, ItineraryDisplay; App truyền theme vào result để banner/accent mang tone mood |
| 5 | Result hero banner | `TripHeroBanner`: gradient khí quyển (mood warmth) + tiêu đề điểm đến animate-in; CTA accent mood |
| 6 | Microinteractions | chip ripple (CSS), CTA magnetic (rAF translate nhỏ theo con trỏ), slider intensity → cập nhật `energy` thấy ngay trên scene, counter đếm (IntersectionObserver) |
| 7 | Kinetic typography | từ khoá headline morph qua list cảm xúc (CSS opacity/translate, interval ~2.4s, dừng khi reduced-motion) |

## a11y & perf (gate cứng)
- **Contrast**: mood theming chỉ đổi accent/ambient. Text giữ `--color-text` trên scrim đủ mạnh → axe 0 serious/critical (landing/form/result, desktop+mobile). Aurora/fireflies có `aria-hidden`.
- **Reduced-motion**: `@media (prefers-reduced-motion: reduce)` tắt aurora drift, fireflies, parallax, kinetic type, magnetic, counter (hiện số cuối ngay). Đây cũng là chế độ `freezeScene` dùng cho e2e/visual.
- **Perf**: fireflies cap (~≤40); pause khi `document.hidden` (PauseOnHidden G002); debounce theme; throttle parallax/magnetic qua rAF; chỉ `transform`/`opacity`/CSS-var. Lighthouse/visual không regress đáng kể.

## Testing
- Unit: `deriveMoodTheme` — các cụm cảm xúc tiêu biểu → warmth/energy đúng khoảng; intensity scale; rỗng → balanced. `useMoodTheme` debounce ghi CSS var đúng.
- e2e: home render + entrance hoàn tất; reduced-motion → trạng thái tĩnh (freezeScene) cho visual baseline ổn định; axe 0 serious/critical home/form/result; mood theming đổi `--mood-accent` (assert computed style) khi điền cảm xúc.
- Render review: home (idle + sau khi gõ 2–3 mood khác nhau) + result, desktop+mobile → human aesthetic sign-off.

## Sequencing
D1 (tokens) → M1–M6 (mood input) → **S1–S5 (change này)** → D2–D4 (áp visual) → verify tổng. Engine cần MoodInput + tokens tồn tại trước.
