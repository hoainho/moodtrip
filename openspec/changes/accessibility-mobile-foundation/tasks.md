# Tasks — Accessibility Mobile Foundation

## 1. Reduced-motion gate for NatureScene
- [ ] 1.1 Read `matchMedia('(prefers-reduced-motion: reduce)')` in `App.tsx` before the `sceneReady` / `NatureScene` mount block (`App.tsx:676-682`)
- [ ] 1.2 Skip mounting `<NatureScene>` when preference is active; render static gradient fallback div
- [ ] 1.3 Subscribe to the `MediaQueryList` `change` event to handle runtime OS toggle without reload
- [ ] 1.4 Verify no WebGL context is initialised in reduced-motion mode (browser DevTools → Canvas contexts)

## 2. Viewport meta fix
- [ ] 2.1 Remove `maximum-scale=1.0, user-scalable=no` from `index.html:5`; retain `width=device-width, initial-scale=1.0, viewport-fit=cover`
- [ ] 2.2 Smoke-test pinch-zoom on iOS Safari and Android Chrome

## 3. Shared focus-trap primitive and AccessibleDialog
- [ ] 3.1 Create `hooks/useFocusTrap.ts`: accepts `containerRef` + `isActive`; traps Tab/Shift-Tab; restores focus on deactivation; re-queries focusable set on each keydown
- [ ] 3.2 Create `components/AccessibleDialog.tsx`: composes `useFocusTrap`, `useBodyScrollLock`, `useEscapeKey`; renders `role="dialog" aria-modal aria-label`; accepts `isOpen`, `onClose`, `label`, `initialFocusRef`
- [ ] 3.3 Apply `AccessibleDialog` to `ShareModal.tsx` (remove direct hook calls if already present)
- [ ] 3.4 Apply `AccessibleDialog` to `TripReelModal.tsx` (remove now-duplicate direct `useBodyScrollLock`/`useEscapeKey` calls)
- [ ] 3.5 Apply `AccessibleDialog` to `TripComparison.tsx`
- [ ] 3.6 Apply `AccessibleDialog` to `DuongVeQueModal.tsx`
- [ ] 3.7 Apply `AccessibleDialog` to `MoNotebookModal.tsx`
- [ ] 3.8 Move focus to close button (or `initialFocusRef`) on modal open for all five modals

## 4. Touch-target remediation
- [ ] 4.1 `Hero.tsx:246-251` delete-trip button: add `.touch-target`; replace `opacity-0 group-hover:opacity-100` with `sm:opacity-0 sm:group-hover:opacity-100` so it is always visible on touch
- [ ] 4.2 `App.tsx:695-712` top-right icon buttons: increase padding / apply `.touch-target` to reach 44 px
- [ ] 4.3 `TripMap.tsx:329,337,351,359` map control buttons: apply `.touch-target`
- [ ] 4.4 `ShareModal.tsx:60-64` close button: apply `.touch-target`
- [ ] 4.5 `ChatCompanion.tsx:168-175` send/action buttons: apply `.touch-target`

## 5. Hero mobile menu accessibility
- [ ] 5.1 Add `aria-expanded={isMenuOpen}` and `aria-controls="mobile-menu-panel"` to hamburger button (`Hero.tsx:75-121`)
- [ ] 5.2 Add `id="mobile-menu-panel"` to the menu panel element
- [ ] 5.3 Wire `useEscapeKey` to close the menu and return focus to the hamburger button trigger
- [ ] 5.4 Replace non-interactive dismiss div with a `<button>` backdrop (`aria-label="Đóng menu"`, visually transparent full-screen)

## 6. IntroScreen skip + reduced-motion
- [ ] 6.1 Add reduced-motion check on mount in `IntroScreen.tsx:15-48`; call `onComplete()` immediately if active
- [ ] 6.2 Render a "Bỏ qua" `<button>` (bottom-right, absolute) that calls `onComplete()`
- [ ] 6.3 Add `keydown` listener for `Escape` to also call `onComplete()`

## 7. Toast ARIA live region
- [ ] 7.1 Add `role="status" aria-live="polite" aria-atomic="true"` to the toast container at `App.tsx:770-782`
- [ ] 7.2 Use `aria-live="assertive"` for error-category toasts (guard by toast type/variant)

## 8. PWA iOS install guidance
- [ ] 8.1 Add iOS Safari detection in `PWAInstallPrompt.tsx:23-31`: `/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches`
- [ ] 8.2 Render inline instruction card: "Nhấn nút Chia sẻ → Thêm vào Màn hình chính" with share icon
- [ ] 8.3 Store dismiss state in `sessionStorage`; do not re-show after dismiss within the same session

## 9. Validation
- [ ] 9.1 `npm run typecheck` clean
- [ ] 9.2 Unit tests: `useFocusTrap` traps focus; `AccessibleDialog` renders correct ARIA attributes; iOS detection heuristic returns true/false correctly
- [ ] 9.3 Manual keyboard audit: Tab through each modal (focus trap), Escape dismissal, focus return to trigger
- [ ] 9.4 Reduced-motion audit: enable OS preference → confirm NatureScene not mounted, IntroScreen skipped
- [ ] 9.5 Touch-target audit: DevTools mobile emulation → confirm all interactive elements ≥ 44 px
- [ ] 9.6 Screen reader smoke-test: VoiceOver iOS on modal open/close, toast announcement, menu state
- [ ] 9.7 Review gate (fresh reviewer) — per-criterion evidence
