import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

const getWakeLock = (): WakeLockLike | null =>
  (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock ?? null;

/**
 * Holds the screen awake while the metronome is running — a phone propped up
 * next to an instrument gets no touch input for minutes at a time and would
 * otherwise dim and lock.
 *
 * The lock is dropped by the browser whenever the tab is hidden, so it has to
 * be re-taken on the way back. Unsupported browsers (Safari before 16.4) just
 * do nothing.
 */
export default function useWakeLock(active: boolean): void {
  useEffect(() => {
    const wakeLock = getWakeLock();
    if (!active || !wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let released = false;

    const acquire = async () => {
      try {
        const next = await wakeLock.request('screen');
        if (released) {
          void next.release();
          return;
        }
        sentinel = next;
      } catch {
        // Denied (low battery, no user activation). Not worth surfacing.
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      void sentinel?.release();
    };
  }, [active]);
}
