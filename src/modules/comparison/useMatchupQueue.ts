import { useCallback, useEffect, useRef, useState } from 'react';
import type { RankingItemState } from '../../domain/item';
import type { Matchup } from '../pairing/selectMatchup';
import { MATCHUP_QUEUE_SIZE, getFreshMatchupQueue, matchupKey } from './useComparisonFlow.utils';

const queuesByFilterId = new Map<string, Matchup[]>();

export function useMatchupQueue(activeStates: RankingItemState[], filterId: string) {
  const initialQueue = queuesByFilterId.get(filterId) ?? [];
  const [queue, setQueue] = useState<Matchup[]>(initialQueue);
  const queueRef = useRef<Matchup[]>(initialQueue);

  const replaceQueue = useCallback((nextQueue: Matchup[]) => {
    queuesByFilterId.set(filterId, nextQueue);
    queueRef.current = nextQueue;
    setQueue(nextQueue);
  }, [filterId]);

  const advanceQueue = useCallback(() => {
    replaceQueue(queueRef.current.slice(1));
  }, [replaceQueue]);

  const restoreMatchup = useCallback((matchup: Matchup) => {
    replaceQueue([
      matchup,
      ...queueRef.current.filter((queuedMatchup) => matchupKey(queuedMatchup) !== matchupKey(matchup)),
    ].slice(0, MATCHUP_QUEUE_SIZE));
  }, [replaceQueue]);

  // Rebuild the short speculative queue when loaded active ranking state changes.
  useEffect(() => {
    if (activeStates.length === 0) {
      return;
    }

    const nextQueue = getFreshMatchupQueue(activeStates, queueRef.current);
    const timeoutId = window.setTimeout(() => {
      replaceQueue(nextQueue);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeStates, replaceQueue]);

  return {
    queue,
    replaceQueue,
    advanceQueue,
    restoreMatchup,
  };
}
