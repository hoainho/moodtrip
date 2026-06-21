# Flexible Mood Input — Hybrid emotion-driven (thay 6 mood cứng)

## Why
MoodTrip lấy *cảm xúc người dùng* làm trung tâm, nhưng UX hiện tại chỉ cho chọn trong **6 mood cố định** (`MOOD_OPTIONS`) + 6 cho short-trip (`SHORT_TRIP_MOOD_OPTIONS`). Đây không phải một feature tốt:

- Cảm xúc con người không rời rạc thành 6 nhãn. "Mệt, cần chậm lại, gần biển, ít người, phiêu lưu nhẹ" không map được vào bất kỳ nút nào.
- Backend càng làm hẹp: `geminiService.buildPrompt` map mỗi mood-id → **một câu cố định** (`moodTextMap`), nối bằng " Kết hợp với: " → AI nhận đúng các câu khuôn, mất hết sắc thái.
- `personalNote` (free-text) đã tồn tại nhưng bị xếp thứ yếu phía dưới, người dùng không coi đó là cách biểu đạt mood chính.
- UI mood = 6 nút icon nhỏ, chật, là phần kém ấn tượng nhất của form (đã tự kiểm tra bằng render thực tế).

Người dùng yêu cầu: *"xây dựng lại hoàn toàn về cách người dùng tiếp cận mood... linh động theo cảm xúc không phải chỉ áp dụng 6 mood."*

## What Changes
Chuyển sang **paradigm Hybrid** (đã chốt với người dùng):

1. **Ô cảm xúc tự do là trung tâm** — "Hôm nay bạn muốn chuyến đi thế nào?" — người dùng mô tả cảm xúc bằng ngôn ngữ tự nhiên; AI diễn giải sắc thái (thay vì map enum).
2. **Chip gợi ý thông minh (seeds)** — vài chip cảm xúc gợi ý (ví dụ: chữa lành, phiêu lưu nhẹ, một mình, gần thiên nhiên) chỉ để *mồi* nhanh: click sẽ chèn/cộng dồn vào ô tự do, **không** phải lựa chọn loại trừ. Seeds khác nhau cho long vs short trip.
3. **Thanh cường độ cảm xúc (intensity)** — nhẹ → mạnh: gợi ý cho AI mức độ mong muốn tâm trạng đó chi phối lịch trình.
4. **Backend diễn giải tự do** — `buildPrompt`/`buildShortTripPrompt` xây mô tả mood từ free-text (chính) + seeds + intensity, đưa nguyên văn cho LLM diễn giải, bỏ `moodTextMap`/`shortMoodTextMap` cứng. Free-text vẫn được fence như user-data (chống prompt injection — giữ nguyên `fenceUserText`).
5. **Mô hình dữ liệu mới, có di trú** — `FormData` thêm mood linh hoạt; giữ tương thích localStorage cũ (trip đã lưu có `moods` enum vẫn đọc được).

### Out of scope
- Visual/màu sắc của khu mood do change **design-system-overhaul** lo (change này chỉ định nghĩa *cấu trúc & hành vi* mood input; bề mặt thị giác sẽ tiêu thụ design tokens từ change kia).
- Không đổi schema `ItineraryPlan` trả về.

## Impact
- Affected: `types.ts` (FormData mood model), `constants.ts` (seeds thay MOOD_OPTIONS/SHORT_TRIP_MOOD_OPTIONS), `components/TripForm.tsx` (UI + state + validation), `services/geminiService.ts` (buildPrompt/buildShortTripPrompt), localStorage migration (saved itineraries), unit tests (geminiService, TripForm), e2e (`create-trip`/`a11y`/`layout` specs gọi mood UI cũ — cần cập nhật selector).
- **BREAKING (nội bộ)**: `Mood`/`ShortTripMood` enum + `moodTextMap` bị gỡ/đổi vai trò → mọi nơi import phải cập nhật (typecheck sẽ bắt). E2E specs hiện click `button:has-text("...")` mood phải đổi sang ô free-text → cập nhật helpers.
- Backward-compat: trip đã lưu (`SAVED_ITINERARIES_LS_KEY`) chứa `moods: Mood[]` cũ → migration map enum→câu seed khi đọc, không vỡ.
