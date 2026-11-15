import React, { useEffect, useRef } from 'react';

type StealthStage = 'idle' | 'nusantara_window' | 'silent_wait';

/**
 * 4-Stage Stealth Admin Access Sequence on "BANK NUSANTARA" (Zero visual cues):
 * 1. Tap/click "BANK" >= 20 times
 * 2. Within 10s window, tap/click "NUSANTARA" exact 10 times (never > 10)
 * 3. Wait 10 seconds with zero interactions (click, touch, keyboard, wheel, scroll)
 * 4. Invoke onTrigger() silently to open the Admin PIN prompt
 */
export function useSecretAdminSequence(onTrigger: () => void) {
  const stageRef = useRef<StealthStage>('idle');
  const bankClicksRef = useRef<number>(0);
  const nusantaraClicksRef = useRef<number>(0);
  const nusantaraTimerRef = useRef<number | null>(null);
  const silentWaitTimerRef = useRef<number | null>(null);
  const attachListenersTimerRef = useRef<number | null>(null);
  const removeListenersRef = useRef<(() => void) | null>(null);
  const onTriggerRef = useRef(onTrigger);

  onTriggerRef.current = onTrigger;

  const clearAllTimersAndListeners = () => {
    if (nusantaraTimerRef.current !== null) {
      window.clearTimeout(nusantaraTimerRef.current);
      nusantaraTimerRef.current = null;
    }
    if (silentWaitTimerRef.current !== null) {
      window.clearTimeout(silentWaitTimerRef.current);
      silentWaitTimerRef.current = null;
    }
    if (attachListenersTimerRef.current !== null) {
      window.clearTimeout(attachListenersTimerRef.current);
      attachListenersTimerRef.current = null;
    }
    if (removeListenersRef.current) {
      removeListenersRef.current();
      removeListenersRef.current = null;
    }
  };

  const resetSequence = () => {
    clearAllTimersAndListeners();
    stageRef.current = 'idle';
    bankClicksRef.current = 0;
    nusantaraClicksRef.current = 0;
  };

  const startSilentWait = () => {
    if (nusantaraTimerRef.current !== null) {
      window.clearTimeout(nusantaraTimerRef.current);
      nusantaraTimerRef.current = null;
    }
    stageRef.current = 'silent_wait';

    const handleInteraction = () => {
      if (stageRef.current === 'silent_wait') {
        resetSequence();
      }
    };

    attachListenersTimerRef.current = window.setTimeout(() => {
      if (stageRef.current !== 'silent_wait') return;
      const events: Array<keyof WindowEventMap> = [
        'pointerdown',
        'touchstart',
        'keydown',
        'wheel',
        'scroll',
      ];
      events.forEach((ev) => {
        window.addEventListener(ev, handleInteraction, { capture: true, passive: true });
      });
      removeListenersRef.current = () => {
        events.forEach((ev) => {
          window.removeEventListener(ev, handleInteraction, { capture: true });
        });
      };
    }, 80);

    silentWaitTimerRef.current = window.setTimeout(() => {
      if (stageRef.current === 'silent_wait') {
        resetSequence();
        onTriggerRef.current();
      }
    }, 10_000);
  };

  const handleBankClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (stageRef.current === 'silent_wait') {
      resetSequence();
      return;
    }

    if (stageRef.current === 'nusantara_window') {
      if (nusantaraClicksRef.current > 0) {
        resetSequence();
      }
      return;
    }

    bankClicksRef.current += 1;
    if (bankClicksRef.current >= 20) {
      stageRef.current = 'nusantara_window';
      nusantaraClicksRef.current = 0;
      nusantaraTimerRef.current = window.setTimeout(() => {
        if (stageRef.current === 'nusantara_window') {
          resetSequence();
        }
      }, 10_000);
    }
  };

  const handleNusantaraClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (stageRef.current === 'silent_wait') {
      resetSequence();
      return;
    }

    if (stageRef.current !== 'nusantara_window') {
      resetSequence();
      return;
    }

    nusantaraClicksRef.current += 1;
    if (nusantaraClicksRef.current > 10) {
      resetSequence();
      return;
    }

    if (nusantaraClicksRef.current === 10) {
      startSilentWait();
    }
  };

  useEffect(() => {
    return () => {
      resetSequence();
    };
  }, []);

  return {
    handleBankClick,
    handleNusantaraClick,
  };
}
