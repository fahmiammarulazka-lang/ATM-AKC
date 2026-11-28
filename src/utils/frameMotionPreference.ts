import { useEffect, useState } from 'react';

export type FrameMotionMode = 'always-full' | 'battery-saver';

const FRAME_MOTION_STORAGE_KEY = 'bn_frame_motion_mode';
const FRAME_MOTION_EVENT = 'bn-frame-motion-change';

function normalizeMode(raw: string | null | undefined): FrameMotionMode {
  return raw === 'battery-saver' ? 'battery-saver' : 'always-full';
}

export function getFrameMotionMode(): FrameMotionMode {
  if (typeof window === 'undefined') return 'always-full';
  try {
    return normalizeMode(window.localStorage.getItem(FRAME_MOTION_STORAGE_KEY));
  } catch {
    return 'always-full';
  }
}

export function syncFrameMotionRootAttr(mode: FrameMotionMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.bnFrameMotion = mode;
}

export function setFrameMotionMode(mode: FrameMotionMode): void {
  const normalized = normalizeMode(mode);
  syncFrameMotionRootAttr(normalized);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FRAME_MOTION_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage write errors in private/restricted browsers
  }
  window.dispatchEvent(
    new CustomEvent<FrameMotionMode>(FRAME_MOTION_EVENT, { detail: normalized })
  );
}

export function isOsReducedMotionActive(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function shouldRunFrameAnimation(mode: FrameMotionMode): boolean {
  if (mode === 'always-full') return true;
  return !isOsReducedMotionActive();
}

// Synchronize root DOM attribute immediately on import so CSS exemptions apply before first paint
syncFrameMotionRootAttr(getFrameMotionMode());

export function useFrameMotionMode(): [
  FrameMotionMode,
  (next: FrameMotionMode) => void
] {
  const [mode, setMode] = useState<FrameMotionMode>(() => getFrameMotionMode());

  useEffect(() => {
    const initial = getFrameMotionMode();
    syncFrameMotionRootAttr(initial);
    setMode(initial);

    const handleCustom = (ev: Event) => {
      const customEv = ev as CustomEvent<FrameMotionMode>;
      const next = normalizeMode(customEv.detail || getFrameMotionMode());
      syncFrameMotionRootAttr(next);
      setMode(next);
    };

    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === FRAME_MOTION_STORAGE_KEY) {
        const next = normalizeMode(ev.newValue);
        syncFrameMotionRootAttr(next);
        setMode(next);
      }
    };

    window.addEventListener(FRAME_MOTION_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(FRAME_MOTION_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return [mode, setFrameMotionMode];
}
