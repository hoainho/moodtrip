# Accessibility — Mobile Foundation

## Why

The app has several WCAG 2.1 AA violations that actively harm or exclude users on mobile, and three of them
are critical with no workaround:

`NatureScene.tsx` (mounted unconditionally at `App.tsx:676-682`) runs a continuous WebGL render loop
regardless of the OS `prefers-reduced-motion` preference. The CSS reduced-motion block at `index.css:31-40`
suppresses CSS animations but cannot reach the WebGL render loop; users who depend on this setting for
vestibular safety receive no protection. This violates WCAG 2.3.3 (Animation from Interactions, AAA) and in
practice WCAG 2.3.1/2.2.2 for strongly affected users.

`index.html:5` sets `maximum-scale=1.0, user-scalable=no`, which hard-blocks the OS-level pinch-zoom used
by low-vision users. This is a WCAG 1.4.4 AA (Resize Text) violation and is also prohibited by App Store
review guidelines on accessibility grounds.

Beyond these critical items, every modal in the app (`ShareModal`, `TripReelModal`, `TripComparison`,
`DuongVeQueModal`, `MoNotebookModal`) sets `aria-modal` without a real focus trap, meaning Tab exits the
modal overlay in all screen-reader/keyboard scenarios. The repo already has `hooks/useBodyScrollLock.ts` and
`hooks/useEscapeKey.ts` (used inconsistently) but no shared `useFocusTrap` hook and no standard Dialog
wrapper. Touch targets throughout the UI (`Hero.tsx:246-251`, `App.tsx:695-712`, `TripMap.tsx`, `ShareModal`,
`ChatCompanion`) fall below the 44 px WCAG 2.5.8 / Apple HIG minimum; a `.touch-target` helper class
already exists at `index.css:451-457` but is not applied. The mobile navigation menu (`Hero.tsx:75-121`)
lacks `aria-expanded`/`aria-controls` and keyboard management. The intro animation (`IntroScreen.tsx:15-48`)
is unskippable at ~3.3 s and does not honour reduced-motion. Toast notifications (`App.tsx:770-782`) have no
`role="status"` / `aria-live`. The PWA install prompt (`PWAInstallPrompt.tsx:23-31`) relies solely on
`beforeinstallprompt`, which never fires on iOS Safari, leaving the large Vietnamese iOS segment with no
install path.

## What Changes

- **Reduced-motion gate for NatureScene**: read `matchMedia('(prefers-reduced-motion: reduce)')` before
  mounting; skip `NatureScene` entirely and render a static gradient fallback (or switch Three.js
  `frameloop` to `"demand"`) when the preference is active.
- **Viewport meta fix**: remove `maximum-scale=1.0, user-scalable=no` from `index.html`; keep
  `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- **Shared `useFocusTrap` hook + accessible Dialog wrapper**: a single `useFocusTrap` hook traps Tab/
  Shift-Tab within the modal container; a thin `AccessibleDialog` wrapper composes the hook with
  `role="dialog" aria-modal aria-label`; all five modals adopt it.
- **`ShareModal` scroll-lock + Escape**: apply `useBodyScrollLock` + `useEscapeKey` (already exist) and the
  new `AccessibleDialog` wrapper; move close-button focus on open.
- **Touch-target audit**: apply `.touch-target` (min 44 px) to all interactive elements below threshold;
  make the Hero delete-trip button visible on touch (remove hover-only constraint).
- **Mobile menu accessibility (`Hero.tsx`)**: add `aria-expanded`, `aria-controls`, Escape handling, focus
  return, and replace non-interactive dismiss div with a backdrop button.
- **IntroScreen skip + reduced-motion**: add a "Bỏ qua" button and keyboard dismiss; skip animation
  entirely when reduced-motion is active.
- **Toast ARIA**: add `role="status"` / `aria-live="polite"` (or `"assertive"` for errors) to the toast
  container at `App.tsx:770-782`.
- **PWA iOS install guidance**: detect iOS Safari (no `beforeinstallprompt`) and show an inline "Add to
  Home Screen" instruction sheet as a fallback.

## Impact

- Affected specs: `accessibility` (new capability).
- Affected code: `index.html`, `App.tsx` (NatureScene mount, toast, top-right buttons),
  `components/NatureScene.tsx` (or `components/three/NatureScene.tsx`), `components/Hero.tsx`,
  `components/ShareModal.tsx`, `components/TripReelModal.tsx`, `components/TripComparison.tsx`,
  `components/DuongVeQueModal.tsx`, `components/MoNotebookModal.tsx`, `components/IntroScreen.tsx`,
  `components/PWAInstallPrompt.tsx`, `components/TripMap.tsx`, `components/ChatCompanion.tsx`,
  `hooks/useFocusTrap.ts` (new), `components/AccessibleDialog.tsx` (new).
- Risk lane: **high-risk** (broad UI behaviour, affects every modal, the entry animation, and the 3-D scene
  mount path) → validate:quick + accessibility audit + E2E (keyboard + reduced-motion) + review gate before
  archive.
- No data-model or API-contract changes; all changes are presentational / event-handling.
