# Design — Accessibility Mobile Foundation

## Decision 1: Reduced-motion gate for NatureScene

Two options exist for honouring `prefers-reduced-motion` in the WebGL scene:

- **A. Conditional mount (recommended).** In `App.tsx:676-682`, read
  `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before setting `sceneReady` / before
  rendering `<NatureScene>`. When true, render a static CSS gradient background instead. Zero overhead for
  affected users; the Three.js bundle is not initialised.
- **B. `frameloop="demand"`.** Pass `frameloop="demand"` to the R3F `<Canvas>` and skip `useFrame`
  animation when the media query matches. The scene is still mounted but does not tick. Simpler diff but
  Three.js still initialises.

**Choice:** A. The gradient fallback already visually approximates the scene well enough, and not
initialising the WebGL context is the correct outcome for this user group. Subscribe to the
`MediaQueryList` `change` event so the scene appears/disappears if the user toggles the OS setting at
runtime without a reload.

## Decision 2: Viewport meta

Remove exactly `maximum-scale=1.0, user-scalable=no` from the `<meta name="viewport">` tag at
`index.html:5`. Retain `width=device-width, initial-scale=1.0, viewport-fit=cover`. No other change.
`viewport-fit=cover` is required for safe-area inset handling on notched devices and must be preserved.

## Decision 3: Focus trap strategy

All modals currently set `aria-modal` without trapping Tab. The correct fix is a single shared primitive:

`hooks/useFocusTrap.ts` — accepts a `containerRef` and an `isActive` boolean. On activation: collect all
focusable elements inside the container, focus the first one (or a designated initial-focus target),
intercept `keydown Tab`/`Shift-Tab` to cycle within the set, and restore focus to the previously-focused
element on deactivation. Standard algorithm; no library dependency required.

`components/AccessibleDialog.tsx` — thin wrapper that renders a `<div role="dialog" aria-modal="true"
aria-label={label}>`, composes `useFocusTrap`, `useBodyScrollLock`, and `useEscapeKey`. Accepts
`isOpen`, `onClose`, `label`, and `initialFocusRef` props. All five modals replace their ad-hoc
overlay divs with `<AccessibleDialog>`.

Backwards compatibility: existing `useBodyScrollLock` and `useEscapeKey` usage in `TripReelModal` is
subsumed by `AccessibleDialog`; remove the direct hook calls there to avoid double-registration.

## Decision 4: Touch-target remediation

The existing `.touch-target` class at `index.css:451-457` sets `min-width: 44px; min-height: 44px` and is
the canonical solution. Apply it (or inline equivalent Tailwind `min-w-[44px] min-h-[44px]`) to every
interactive element identified below threshold:

- `Hero.tsx:246-251` delete-trip button: add `.touch-target` + remove `opacity-0 group-hover:opacity-100`
  on mobile (use `sm:opacity-0 sm:group-hover:opacity-100` so it is always visible on touch devices).
- `App.tsx:695-712` top-right icon buttons: increase padding to reach 44 px.
- `TripMap.tsx:329,337,351,359` map control buttons: add `.touch-target`.
- `ShareModal.tsx:60-64` close button: add `.touch-target`.
- `ChatCompanion.tsx:168-175` send/action buttons: add `.touch-target`.

## Decision 5: Hero mobile menu accessibility

`Hero.tsx:75-121` — the hamburger button gets `aria-expanded={isMenuOpen}` and
`aria-controls="mobile-menu-panel"`. The menu panel gets `id="mobile-menu-panel"`. The `useEscapeKey`
hook (already in the repo) closes the menu and returns focus to the trigger. The non-interactive
`onClick` dismiss div is replaced with a full-screen `<button>` backdrop (visually transparent,
`aria-label="Đóng menu"`).

## Decision 6: IntroScreen skip + reduced-motion

`IntroScreen.tsx:15-48` — two changes:

1. Read `prefers-reduced-motion` on mount; if active, call `onComplete()` immediately (skip the entire
   animation) and render nothing or a static splash.
2. Render a "Bỏ qua" `<button>` (visually bottom-right, absolute) that calls `onComplete()`.
   Keyboard: `Space`/`Enter` on the button, plus a raw `keydown` listener for `Escape`.

This also resolves the known E2E flakiness caused by the fixed animation duration.

## Decision 7: Toast ARIA

`App.tsx:770-782` — the toast container div gets `role="status" aria-live="polite" aria-atomic="true"`.
For error-category toasts (identifiable by toast type/variant), use `aria-live="assertive"` instead.
If the toast renders as a single element, a single container with the correct live-region role suffices;
no additional wrapper needed.

## Decision 8: PWA iOS install guidance

`PWAInstallPrompt.tsx:23-31` — the component currently renders nothing on iOS Safari because
`beforeinstallprompt` never fires. Add an iOS detection heuristic:
`/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches`.
When true, render an inline instruction card: "Nhấn nút Chia sẻ → Thêm vào Màn hình chính" with the
relevant iOS share icon. Dismiss is stored in `sessionStorage` to avoid showing on every page. This
requires no new dependency.

## Risks

- Focus trap must handle dynamically-added focusable children (e.g. conditional buttons inside modals);
  re-query the focusable set on each Tab keydown rather than caching at activation time.
- Removing `user-scalable=no` can cause double-tap zoom on some Android browsers; the standard mitigation
  (`touch-action: manipulation` on interactive elements) is already widely applied via Tailwind's button
  reset and should be verified.
- The `AccessibleDialog` refactor touches five modals simultaneously; each must be smoke-tested to confirm
  scroll-lock, Escape, and focus-return still work after removing direct hook calls.
