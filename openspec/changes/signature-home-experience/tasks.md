# Tasks — Signature Home Experience

> Depends on D1 (tokens) + M* (MoodInput). NO PUSH. a11y + reduced-motion + perf là gate cứng. Human aesthetic sign-off cuối.

## US-S1 — Mood Theme Engine
- [ ] `hooks/useMoodTheme.ts`: pure `deriveMoodTheme(mood)` → `{warmth, energy, accent, lightColor, particleSpeed}` (keyword heuristics + intensity scale; rỗng→balanced).
- [ ] `MoodThemeProvider` context; debounce ~250ms; ghi `--mood-accent/-warmth/-energy` lên `:root` qua rAF.
- [ ] Unit: deriveMoodTheme cho các cụm cảm xúc tiêu biểu + intensity + rỗng; debounce ghi CSS var đúng.

## US-S2 — Living ambient home
- [ ] `components/home/AmbientHero.tsx`: aurora mesh "thở" (transform/opacity only, màu từ `--mood-*`), nằm SAU scrim.
- [ ] Fireflies (cap ≤40, tốc độ theo `energy`), cursor parallax (rAF throttle, tắt trên touch), entrance stagger ≤900ms.
- [ ] Fallback không-WebGL (CSS-only) + `prefers-reduced-motion` đóng băng tĩnh.
- [ ] `aria-hidden` cho lớp trang trí.

## US-S3 — Scene 3D phản ứng mood
- [ ] NatureScene/PersonalWorld đọc MoodTheme: light color/intensity, bloom, particle speed theo `warmth/energy`.
- [ ] Giữ PauseOnHidden + WebGL fallback (G002) nguyên vẹn.

## US-S4 — Focal points toàn app
- [ ] Theming: `--mood-accent` cho button/chip/highlight ở Hero/TripForm/ItineraryDisplay; App truyền theme vào result.
- [ ] `TripHeroBanner`: gradient khí quyển (warmth) + tiêu đề animate-in + CTA accent mood.
- [ ] Microinteractions: chip ripple, CTA magnetic, slider intensity→scene energy tức thì, counter (IntersectionObserver).
- [ ] Kinetic mood typography ở headline (dừng khi reduced-motion).

## US-S5 — Verify
- [ ] Unit + worker tests xanh (gồm deriveMoodTheme).
- [ ] e2e: home entrance hoàn tất; reduced-motion→tĩnh (freezeScene); axe 0 serious/critical home/form/result (desktop+mobile); assert `--mood-accent` đổi khi điền cảm xúc khác nhau.
- [ ] Perf: không regress đáng kể; fireflies cap + pause-on-hidden xác minh.
- [ ] `npm run typecheck` + `npm run build` (Node 22) xanh; `E2E_PORT=5180 CI=1 npm run test:e2e` xanh.
- [ ] Render review home (idle + sau gõ 2–3 mood) + result, desktop+mobile → human aesthetic sign-off. NOT pushed.
