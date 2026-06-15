# accessibility

## ADDED Requirements

### Requirement: Reduced-motion safety for animated scene
The system SHALL NOT run a continuous WebGL render loop when the user's OS reports
`prefers-reduced-motion: reduce`. A static visual fallback SHALL be rendered in its place.

#### Scenario: NatureScene is not mounted when reduced-motion is active
- **WHEN** a user has `prefers-reduced-motion: reduce` set in their OS
- **THEN** `NatureScene` is not mounted and no WebGL context is initialised
- **AND** a static gradient background is rendered in its place

#### Scenario: Scene responds to runtime preference change
- **WHEN** the user toggles the reduced-motion OS setting while the app is open
- **THEN** the scene mounts or unmounts accordingly without a page reload

### Requirement: Pinch-zoom is not blocked
The viewport meta tag SHALL NOT include `maximum-scale` or `user-scalable=no`, so that OS-level
text zoom and pinch-zoom remain available to low-vision users. WCAG 1.4.4 AA.

#### Scenario: User can zoom the viewport
- **WHEN** a user pinches to zoom or uses OS accessibility zoom on the app
- **THEN** the browser viewport responds normally and content scales

### Requirement: Modal focus trap
Every modal dialog in the application SHALL trap keyboard focus within its bounds while open.
Pressing Tab or Shift-Tab SHALL cycle only through focusable elements inside the modal. Focus
SHALL return to the triggering element on close. WCAG 2.1.2.

#### Scenario: Tab does not escape an open modal
- **WHEN** a modal is open and the user presses Tab repeatedly
- **THEN** focus cycles within the modal and never reaches elements behind the overlay

#### Scenario: Focus returns to trigger on close
- **WHEN** a modal is closed (via Escape, close button, or backdrop)
- **THEN** focus returns to the element that opened it

#### Scenario: No duplicate hook registration
- **WHEN** `AccessibleDialog` is used
- **THEN** scroll-lock and Escape handling are not registered a second time by the host component

### Requirement: Modal scroll-lock and Escape dismiss
Every modal dialog SHALL lock body scroll while open and SHALL close on Escape key. WCAG 2.1.1.

#### Scenario: Body scroll is locked while a modal is open
- **WHEN** a modal is open on a scrollable page
- **THEN** the document body does not scroll behind the overlay

#### Scenario: Escape closes any open modal
- **WHEN** any modal is open and the user presses Escape
- **THEN** the modal closes and focus returns to its trigger

### Requirement: Touch targets meet minimum size
All interactive elements (buttons, links, icon controls) SHALL have a minimum tap target of 44 × 44 px
on touch devices. Controls that are currently hover-only SHALL be made reachable by touch. WCAG 2.5.8.

#### Scenario: Delete-trip button is reachable on touch
- **WHEN** a user on a touch device views the trip card
- **THEN** the delete button is visible (not hover-only) and has a tap target of at least 44 × 44 px

#### Scenario: Map control buttons meet size requirement
- **WHEN** a user interacts with map controls in `TripMap`
- **THEN** each control button has a touch target of at least 44 × 44 px

### Requirement: Mobile menu keyboard and ARIA
The mobile navigation menu SHALL expose `aria-expanded` and `aria-controls` on its trigger, SHALL
close on Escape with focus returned to the trigger, and SHALL not use a non-interactive element as
its dismiss backdrop. WCAG 4.1.2, 2.1.1.

#### Scenario: Screen reader announces menu state
- **WHEN** the hamburger button is focused and the menu opens or closes
- **THEN** `aria-expanded` reflects the current state and `aria-controls` identifies the panel

#### Scenario: Escape closes the mobile menu
- **WHEN** the mobile menu is open and the user presses Escape
- **THEN** the menu closes and focus returns to the hamburger button

### Requirement: Intro animation is skippable and honours reduced-motion
`IntroScreen` SHALL provide a visible skip control and SHALL honour `prefers-reduced-motion` by
completing immediately when the preference is active. WCAG 2.2.2, 2.3.3.

#### Scenario: User can skip the intro
- **WHEN** the intro animation is playing
- **THEN** a "Bỏ qua" button is visible and activating it (click, Enter, or Space) advances immediately to the app

#### Scenario: Reduced-motion skips the intro automatically
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** `IntroScreen` calls `onComplete` immediately and renders no animation

### Requirement: Toast notifications are announced to assistive technology
The toast container SHALL carry a live-region role so that screen readers announce new messages
without requiring focus to be on the toast. WCAG 4.1.3.

#### Scenario: Informational toast is announced politely
- **WHEN** an informational toast appears
- **THEN** `aria-live="polite"` causes the screen reader to announce it at the next opportunity

#### Scenario: Error toast is announced immediately
- **WHEN** an error toast appears
- **THEN** `aria-live="assertive"` causes the screen reader to interrupt and announce it

### Requirement: PWA install guidance on iOS Safari
The PWA install prompt SHALL display platform-appropriate guidance on iOS Safari where
`beforeinstallprompt` is unavailable, so that iOS users can add the app to their Home Screen.

#### Scenario: iOS user sees install instructions
- **WHEN** a user visits the app on iOS Safari and the app is not already installed (standalone mode)
- **THEN** an instruction card appears explaining the Share → Add to Home Screen flow

#### Scenario: Dismissed instructions do not reappear in the same session
- **WHEN** a user dismisses the iOS install card
- **THEN** the card does not reappear during the same browser session
