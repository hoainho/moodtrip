import { Component, useEffect, useState, type ReactNode } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

// ─── Shared error boundary ───────────────────────────────────────────────────
// Catches Three.js crashes without killing the whole app. Used by both the
// fullscreen NatureScene background (App.tsx) and the PersonalWorld modal.
export class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[MoodTrip] 3D scene error (non-fatal):', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

// ─── Reduced-motion live subscription ────────────────────────────────────────
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Live subscription (not one-shot): respects an OS reduce-motion toggle while the scene is open.
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduce;
}

// ─── WebGL availability guard ────────────────────────────────────────────────
// Cached + leak-free: the probe context is RELEASED immediately (WEBGL_lose_context) and the result is
// memoised module-level. The old version leaked a context on every call — and React StrictMode double-invokes
// useState initializers in dev, so repeated modal opens exhausted the GPU context limit and the probe began
// reporting "no WebGL" on devices that actually support it (false negative).
let _webglAvailable: boolean | undefined;
export function isWebGLAvailable(): boolean {
  if (_webglAvailable !== undefined) return _webglAvailable;
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (ctx) {
      (ctx as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
      _webglAvailable = true;
    } else {
      _webglAvailable = false;
    }
  } catch {
    _webglAvailable = false;
  }
  return _webglAvailable;
}

// ─── Pause-when-hidden ───────────────────────────────────────────────────────
// Sits inside a Canvas. Flips the R3F frameloop to 'never' while the tab is
// hidden (document.visibilitychange) and back to 'always' when visible — so the
// render loop stops doing work the user cannot see. We deliberately do NOT use a
// permanent frameloop="demand" (that would freeze auto-rotate / orbit / fog).
export function PauseOnHidden() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.hidden) {
        setFrameloop('never');
      } else {
        setFrameloop('always');
        invalidate();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    // Apply current state immediately (tab may already be hidden).
    onVisibility();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      setFrameloop('always');
    };
  }, [setFrameloop, invalidate]);
  return null;
}

// ─── Dev/test render counter ─────────────────────────────────────────────────
// Only active under import.meta.env.DEV (or an explicit window flag). Writes the
// renderer's per-frame draw count to window.__r3fRenderCount each frame so E2E
// can assert the loop is paused when the scene isn't seen.
declare global {
  interface Window {
    __r3fRenderCount?: number;
    __r3fForceRenderCount?: boolean;
  }
  interface ImportMeta {
    readonly env?: { readonly DEV?: boolean };
  }
}

export function RenderCountProbe() {
  const gl = useThree((s) => s.gl);
  const enabled =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
    (typeof window !== 'undefined' && window.__r3fForceRenderCount === true);
  useFrame(() => {
    if (!enabled || typeof window === 'undefined') return;
    window.__r3fRenderCount = gl.info.render.frame;
  });
  return null;
}
