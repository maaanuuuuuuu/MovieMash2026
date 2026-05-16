import { useEffect, useRef, useState } from 'react';
import type { PendingNotSeen } from './useComparisonFlow.utils';

export function usePendingNotSeen() {
  const [pendingNotSeen, setPendingNotSeenState] = useState<PendingNotSeen | undefined>();
  const pendingNotSeenRef = useRef<PendingNotSeen | undefined>(undefined);
  const timeoutRef = useRef<number | undefined>(undefined);

  function clearPendingNotSeenTimeout() {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }

  function setPendingNotSeen(nextPending: PendingNotSeen | undefined) {
    pendingNotSeenRef.current = nextPending;
    setPendingNotSeenState(nextPending);
  }

  function schedulePendingNotSeen(pending: PendingNotSeen, delayMs: number, onTimeout: () => void) {
    setPendingNotSeen(pending);
    clearPendingNotSeenTimeout();
    timeoutRef.current = window.setTimeout(onTimeout, delayMs);
  }

  // Clear the pending undo timer if the comparison flow unmounts.
  useEffect(() => {
    return () => {
      clearPendingNotSeenTimeout();
    };
  }, []);

  return {
    pendingNotSeen,
    pendingNotSeenRef,
    clearPendingNotSeenTimeout,
    setPendingNotSeen,
    schedulePendingNotSeen,
  };
}
