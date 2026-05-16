import { useEffect, useRef, useState } from 'react';
import type { RankingItemState } from '../../domain/item';
import type { Matchup } from '../pairing/selectMatchup';
import { MATCHUP_QUEUE_SIZE, getFreshMatchupQueue, matchupKey } from './useComparisonFlow.utils';

export function useMatchupQueue(activeStates: RankingItemState[]) {
  const [queue, setQueue] = useState<Matchup[]>([]);
  const queueRef = useRef<Matchup[]>([]);

  function replaceQueue(nextQueue: Matchup[]) {
    queueRef.current = nextQueue;
    setQueue(nextQueue);
  }

  function advanceQueue() {
    replaceQueue(queueRef.current.slice(1));
  }

  function restoreMatchup(matchup: Matchup) {
    replaceQueue([
      matchup,
      ...queueRef.current.filter((queuedMatchup) => matchupKey(queuedMatchup) !== matchupKey(matchup)),
    ].slice(0, MATCHUP_QUEUE_SIZE));
  }

  // Rebuild the short speculative queue when active ranking state changes.
  useEffect(() => {
    const nextQueue = getFreshMatchupQueue(activeStates, queueRef.current);
    const timeoutId = window.setTimeout(() => {
      replaceQueue(nextQueue);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeStates]);

  return {
    queue,
    replaceQueue,
    advanceQueue,
    restoreMatchup,
  };
}
