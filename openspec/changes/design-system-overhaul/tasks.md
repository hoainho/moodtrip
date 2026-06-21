# Tasks — Design System Overhaul

> NO PUSH. a11y gate cứng (axe 0 serious/critical). Human aesthetic sign-off ở cuối.

## US-D1 — Token foundation (làm TRƯỚC)
- [ ] `index.css`: định nghĩa color/text/accent/elevation/blur/type/spacing tokens (`@theme` + CSS vars) đạt AA.
- [ ] Scrim levels token hoá `.scrim-1/-2/-3`.
- [ ] tsc + build xanh; chưa đổi component → app vẫn chạy (token mới chưa dùng OK).

## US-D2 — Palette + rhythm cho form (sau mood-input M*)
- [ ] Mood = hero section (elevated + ring accent-warm), logistics nhẹ hơn (surface).
- [ ] Seam 3D↔form: dải chuyển mềm 3D→bg (không cắt gắt).
- [ ] Nhãn uppercase nhỏ → `--text-muted` (đọc được), bỏ slate-500/600 còn sót trong TripForm.

## US-D3 — Áp token cho landing/Hero + card-pull
- [ ] Hero: scrim-2 sau text, accent-warm CTA, giữ grid G003.
- [ ] CardPullOnboarding: panel/scrim/warm ambient theo token (giữ hành vi G003).

## US-D4 — Áp token cho result + phần còn lại
- [ ] ItineraryDisplay + sticky map: màu token, contrast nhãn giờ/giá; giữ layout 2-col G003.
- [ ] ChatCompanion / Footer / PersonalWorldBadge / IntroScreen / TripHeroBanner: text token, xoá slate-500/600 còn sót.
- [ ] 3D overlays đồng bộ amber/indigo (G002).

## US-D5 — Verify
- [ ] `e2e/a11y.spec` xanh: axe 0 serious/critical landing/form/result (desktop + mobile) — gate cứng.
- [ ] Visual baseline cập nhật có chủ đích; diff được review.
- [ ] `npm run typecheck` + `npm run build` (Node 22) xanh; `E2E_PORT=5180 CI=1 npm run test:e2e` xanh (no regression).
- [ ] Render review desktop+mobile landing/form/result/card-pull → human aesthetic sign-off. NOT pushed.
