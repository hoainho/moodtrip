# Design — Flexible Mood Input (Hybrid)

## Data model

```ts
// types.ts — NEW flexible model (replaces enum-only)
export interface MoodInput {
  /** Free-text emotional description — PRIMARY signal. */
  text: string;
  /** Suggestion chips the user tapped (labels appended into text or kept as tags). */
  seeds: string[];
  /** 0..1 how strongly the mood should drive the plan. Default 0.5. */
  intensity: number;
}

export interface FormData {
  // ...unchanged fields...
  mood: MoodInput;            // NEW
  // moods / shortMoods: REMOVED from the active form path
  personalNote: string;       // kept — now "ghi chú thêm" (logistics/constraints), distinct from mood
}
```

`Mood` / `ShortTripMood` string-literal types: **kept exported** only for the localStorage migration shim (reading old saved trips), marked `@deprecated`. Not used in the form.

### Why keep `personalNote` separate from `mood.text`?
Mood = *cảm xúc/phong cách mong muốn*. `personalNote` = *ràng buộc cụ thể* ("đi với trẻ nhỏ", "không ăn cay", "tránh leo trèo"). Gộp lại sẽ làm prompt mơ hồ. Giữ hai field, label rõ: mood là hero, note là phụ.

## Seeds (constants.ts)
Thay `MOOD_OPTIONS`/`SHORT_TRIP_MOOD_OPTIONS` bằng *gợi ý* (mỗi cái là một cụm cảm xúc tiếng Việt tự nhiên, không phải enum khoá cứng):

```ts
export const MOOD_SEEDS: string[] = [
  'chữa lành', 'chậm rãi nghỉ dưỡng', 'gần thiên nhiên', 'phiêu lưu nhẹ',
  'một mình tĩnh lặng', 'lãng mạn đôi lứa', 'đắm mình văn hoá', 'sôi động khám phá',
];
export const SHORT_MOOD_SEEDS: string[] = [
  'hẹn hò', 'cafe đẹp check-in', 'food tour', 'nightlife', 'vui chơi nhóm', 'chill dạo phố',
];
```
Seeds là *gợi ý mở* — người dùng có thể bỏ qua hoàn toàn và tự gõ. Không có ràng buộc "phải chọn ≥1". Đây là điểm khác biệt cốt lõi với 6-mood cũ.

## Prompt building (geminiService.ts)
Bỏ `moodTextMap` / `shortMoodTextMap`. Xây mood block từ `MoodInput`:

```ts
function buildMoodText(mood: MoodInput): string {
  const parts: string[] = [];
  const seeds = mood.seeds.filter(Boolean);
  if (seeds.length) parts.push(`Gợi ý cảm xúc: ${seeds.join(', ')}.`);
  const free = mood.text?.trim();
  // free-text is USER DATA → fence it (anti prompt-injection), same as personalNote
  if (free) parts.push(fenceUserText('CẢM XÚC NGƯỜI DÙNG', free));
  if (!parts.length) return 'Không nêu cảm xúc cụ thể — hãy tạo lịch trình cân bằng, đa dạng.';
  const level = mood.intensity >= 0.66 ? 'RẤT ĐẬM (hãy để cảm xúc này chi phối mạnh toàn bộ lịch trình)'
              : mood.intensity <= 0.33 ? 'nhẹ (chỉ là sắc thái phụ)'
              : 'vừa phải';
  parts.push(`Mức độ mong muốn cảm xúc này dẫn dắt: ${level}.`);
  return parts.join('\n    ');
}
```
Inject vào `- Tâm trạng & cảm xúc mong muốn:\n    ${buildMoodText(data.mood)}`. AI tự diễn giải sắc thái thay vì nhận câu khuôn. Short-trip dùng cùng helper.

### Security
Free-text mood đi qua `fenceUserText` (giống `personalNote` hiện tại) — không nối thẳng vào instruction. Giữ nguyên `sanitizeInline` cho `destination`. Không nới lỏng bất kỳ guard nào đã có.

## UI (TripForm.tsx)
- State: `const [mood, setMood] = useState<MoodInput>({ text: '', seeds: [], intensity: 0.5 })`.
- Layout khu mood (hero của form):
  - Tiêu đề lớn, dễ đọc (dùng tokens từ design-system-overhaul): "Hôm nay bạn muốn chuyến đi thế nào?"
  - `textarea` cảm xúc lớn (2–3 dòng), placeholder ví dụ cảm xúc thật.
  - Hàng chip seeds (MOOD_SEEDS hoặc SHORT_MOOD_SEEDS theo tripMode): tap → toggle vào `mood.seeds` *và* append gợi ý vào cuối textarea nếu chưa có (người dùng sửa tự do). Chip có trạng thái selected rõ (aria-pressed).
  - Slider intensity (nhẹ→mạnh) với nhãn text, `aria-label`, bàn phím điều khiển được.
- **Validation mới**: không bắt buộc — nếu cả `text` rỗng và `seeds` rỗng, vẫn cho submit (prompt fallback "cân bằng đa dạng"). Bỏ `moodError`. (Giảm ma sát = linh động hơn.)
- a11y: textarea có `<label>`, slider có nhãn, chip là `<button aria-pressed>`; đạt 0 serious/critical trên axe (giữ chuẩn G003).

## Migration (saved trips)
Khi đọc `SAVED_ITINERARIES_LS_KEY`/`ITINERARY_LS_KEY`: các bản ghi cũ chỉ lưu `ItineraryPlan` (không lưu FormData mood), nên rủi ro thấp. Nếu có FormData cũ với `moods: Mood[]`, shim `migrateMood(old): MoodInput` map enum→seed-label (`{relax:'chậm rãi nghỉ dưỡng', explore:'sôi động khám phá', ...}`) để không mất dữ liệu. Đặt shim cạnh nơi parse localStorage.

## Testing
- Unit (geminiService): `buildMoodText` — seeds-only, text-only, cả hai, rỗng (fallback), 3 mức intensity; free-text được fence; không còn tham chiếu `moodTextMap`.
- Unit (TripForm): submit khi mood rỗng vẫn hợp lệ; chip toggle cập nhật state + textarea; slider đổi intensity.
- E2E: cập nhật `_helpers` + `create-trip`/`a11y`/`layout` specs để điền ô cảm xúc thay vì click nút mood; mock-itinerary path vẫn xanh; axe 0 serious/critical trên form.

## Rollout
Behind không cần flag (UI thuần + prompt). Gỡ enum trong cùng PR; typecheck là lưới an toàn. NO PUSH cho tới khi người dùng duyệt thẩm mỹ (giống G002/G003).
