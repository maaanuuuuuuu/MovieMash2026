import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ItemId, RankingItemState } from '../../domain/item';
import type { ComparisonOutcome } from '../../domain/outcome';
import type { FilmItem } from '../content/types';
import { buildMatchupQueue, type Matchup } from '../pairing/selectMatchup';
import {
  MINIMUM_ACTIVE_ITEMS,
  getMetaBoolean,
  listComparisonRecords,
  listRankingStates,
  persistOutcome,
  setMetaBoolean,
} from '../persistence/rankingRepository';
import { hasReachedCelebrationThreshold } from '../rankingEngine/stability';

type FeedbackKind = 'picked' | 'tie' | 'notSeen' | 'blocked';

export type FlowFeedback = {
  id: number;
  kind: FeedbackKind;
  label: string;
};

type PendingNotSeen = {
  id: number;
  matchup: Matchup;
  outcome: Extract<ComparisonOutcome, { type: 'notSeen' }>;
};

const CELEBRATION_META_KEY = 'celebrationShown';
const MATCHUP_QUEUE_SIZE = 4;
const NOT_SEEN_UNDO_WINDOW_MS = 10000;

function otherItemId(matchup: Matchup, itemId: ItemId) {
  return matchup.leftId === itemId ? matchup.rightId : matchup.leftId;
}

function matchupKey(matchup: Matchup) {
  return [matchup.leftId, matchup.rightId].sort().join('::');
}

function matchupIsActive(matchup: Matchup, activeIds: Set<string>) {
  return activeIds.has(matchup.leftId) && activeIds.has(matchup.rightId);
}

export function useComparisonFlow(rankingScopeId: string, items: FilmItem[]) {
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const states = useLiveQuery(() => listRankingStates(rankingScopeId, itemIds), [rankingScopeId, itemIds], []);
  const comparisons = useLiveQuery(() => listComparisonRecords(rankingScopeId), [rankingScopeId], []);
  const [queue, setQueue] = useState<Matchup[]>([]);
  const queueRef = useRef<Matchup[]>([]);
  const [feedback, setFeedback] = useState<FlowFeedback | undefined>();
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [pendingNotSeen, setPendingNotSeenState] = useState<PendingNotSeen | undefined>();
  const pendingNotSeenRef = useRef<PendingNotSeen | undefined>(undefined);
  const pendingNotSeenTimeoutRef = useRef<number | undefined>(undefined);

  const activeStates = states.filter((state) => state.active);
  const currentMatchup = queue[0];
  const nextMatchup = queue[1];
  const leftItem = currentMatchup ? itemById.get(currentMatchup.leftId) : undefined;
  const rightItem = currentMatchup ? itemById.get(currentMatchup.rightId) : undefined;
  const nextLeftItem = nextMatchup ? itemById.get(nextMatchup.leftId) : undefined;
  const nextRightItem = nextMatchup ? itemById.get(nextMatchup.rightId) : undefined;
  const canMarkNotSeen = activeStates.length > MINIMUM_ACTIVE_ITEMS;

  function getItem(itemId: ItemId) {
    return itemById.get(itemId);
  }

  function titleForLog(itemId: ItemId) {
    return getItem(itemId)?.label ?? itemId;
  }

  function outcomeLogMessage(outcome: ComparisonOutcome) {
    switch (outcome.type) {
      case 'winner':
        return `${titleForLog(outcome.winnerId)} wins against ${titleForLog(outcome.loserId)}`;
      case 'tie':
        return `Tie between ${titleForLog(outcome.leftId)} and ${titleForLog(outcome.rightId)}`;
      case 'notSeen':
        return `${titleForLog(outcome.itemId)} not seen`;
      default:
        return outcome satisfies never;
    }
  }

  // Keep the speculative queue fresh when IndexedDB changes after each action.
  useEffect(() => {
    const nextActiveStates = states.filter((state) => state.active);
    const activeIds = new Set(nextActiveStates.map((state) => state.itemId));
    const previewedNextMatchup = queueRef.current[0];
    const freshQueue = nextActiveStates.length < 2 ? [] : buildMatchupQueue(nextActiveStates, MATCHUP_QUEUE_SIZE);
    const nextQueue =
      previewedNextMatchup && matchupIsActive(previewedNextMatchup, activeIds)
        ? [
            previewedNextMatchup,
            ...freshQueue.filter((matchup) => matchupKey(matchup) !== matchupKey(previewedNextMatchup)),
          ].slice(0, MATCHUP_QUEUE_SIZE)
        : freshQueue;
    const timeoutId = window.setTimeout(() => {
      queueRef.current = nextQueue;
      setQueue(nextQueue);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [states]);

  // Clear the pending undo timer if the comparison flow unmounts.
  useEffect(() => {
    return () => {
      if (pendingNotSeenTimeoutRef.current !== undefined) {
        window.clearTimeout(pendingNotSeenTimeoutRef.current);
      }
    };
  }, []);

  async function maybeShowCelebration(nextStates: RankingItemState[]) {
    if (!hasReachedCelebrationThreshold(nextStates)) {
      return;
    }

    const alreadyShown = await getMetaBoolean(CELEBRATION_META_KEY);

    if (!alreadyShown) {
      await setMetaBoolean(CELEBRATION_META_KEY, true);
      setCelebrationVisible(true);
    }
  }

  function showFeedback(kind: FeedbackKind, label: string) {
    setFeedback({ id: Date.now(), kind, label });
  }

  function clearPendingNotSeenTimeout() {
    if (pendingNotSeenTimeoutRef.current !== undefined) {
      window.clearTimeout(pendingNotSeenTimeoutRef.current);
      pendingNotSeenTimeoutRef.current = undefined;
    }
  }

  function setPendingNotSeen(nextPending: PendingNotSeen | undefined) {
    pendingNotSeenRef.current = nextPending;
    setPendingNotSeenState(nextPending);
  }

  async function flushPendingNotSeen() {
    const pending = pendingNotSeenRef.current;

    if (!pending) {
      return;
    }

    clearPendingNotSeenTimeout();
    setPendingNotSeen(undefined);
    const result = await persistOutcome(rankingScopeId, pending.outcome, itemIds);
    console.log(
      result.applied
        ? outcomeLogMessage(pending.outcome)
        : `${outcomeLogMessage(pending.outcome)} blocked: ${result.reason}`,
    );

    if (result.applied) {
      await maybeShowCelebration(result.states);
      return;
    }

    if (result.reason === 'minimumActiveItems') {
      showFeedback('blocked', 'Last 10 stay');
    }
  }

  function schedulePendingNotSeen(pending: PendingNotSeen) {
    setPendingNotSeen(pending);
    clearPendingNotSeenTimeout();
    pendingNotSeenTimeoutRef.current = window.setTimeout(() => {
      void flushPendingNotSeen();
    }, NOT_SEEN_UNDO_WINDOW_MS);
  }

  async function commitOutcome(outcome: ComparisonOutcome, kind: FeedbackKind, label: string) {
    await flushPendingNotSeen();
    const nextQueue = queueRef.current.slice(1);
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    showFeedback(kind, label);
    const result = await persistOutcome(rankingScopeId, outcome, itemIds);
    console.log(
      result.applied ? outcomeLogMessage(outcome) : `${outcomeLogMessage(outcome)} blocked: ${result.reason}`,
    );

    if (result.applied) {
      await maybeShowCelebration(result.states);
      return;
    }

    if (result.reason === 'minimumActiveItems') {
      showFeedback('blocked', 'Last 10 stay');
    }
  }

  function chooseLeft() {
    if (!currentMatchup) {
      return;
    }

    void commitOutcome(
      { type: 'winner', winnerId: currentMatchup.leftId, loserId: currentMatchup.rightId },
      'picked',
      'Picked',
    );
  }

  function chooseRight() {
    if (!currentMatchup) {
      return;
    }

    void commitOutcome(
      { type: 'winner', winnerId: currentMatchup.rightId, loserId: currentMatchup.leftId },
      'picked',
      'Picked',
    );
  }

  function tie() {
    if (!currentMatchup) {
      return;
    }

    void commitOutcome(
      { type: 'tie', leftId: currentMatchup.leftId, rightId: currentMatchup.rightId },
      'tie',
      'Tie',
    );
  }

  function markNotSeen(itemId: ItemId) {
    if (!currentMatchup) {
      return;
    }

    if (!canMarkNotSeen) {
      showFeedback('blocked', 'Last 10 stay');
      return;
    }

    void flushPendingNotSeen().then(() => {
      const pendingMatchup = currentMatchup;
      const remainingQueue = queueRef.current
        .slice(1)
        .filter((matchup) => matchup.leftId !== itemId && matchup.rightId !== itemId);
      const refillQueue = buildMatchupQueue(
        activeStates.filter((state) => state.itemId !== itemId),
        MATCHUP_QUEUE_SIZE,
      ).filter(
        (matchup) =>
          matchup.leftId !== itemId &&
          matchup.rightId !== itemId &&
          !remainingQueue.some((queuedMatchup) => matchupKey(queuedMatchup) === matchupKey(matchup)),
      );
      const nextQueue = [...remainingQueue, ...refillQueue].slice(0, MATCHUP_QUEUE_SIZE);
      const pending: PendingNotSeen = {
        id: Date.now(),
        matchup: pendingMatchup,
        outcome: { type: 'notSeen', itemId, otherId: otherItemId(pendingMatchup, itemId) },
      };

      queueRef.current = nextQueue;
      setQueue(nextQueue);
      schedulePendingNotSeen(pending);
      showFeedback('notSeen', 'Gone');
    });
  }

  function undoNotSeen() {
    const pending = pendingNotSeenRef.current;

    if (!pending) {
      return;
    }

    clearPendingNotSeenTimeout();
    setPendingNotSeen(undefined);
    const restoredQueue = [
      pending.matchup,
      ...queueRef.current.filter((matchup) => matchupKey(matchup) !== matchupKey(pending.matchup)),
    ].slice(0, MATCHUP_QUEUE_SIZE);
    queueRef.current = restoredQueue;
    setQueue(restoredQueue);
  }

  return {
    leftItem: leftItem as FilmItem | undefined,
    rightItem: rightItem as FilmItem | undefined,
    nextLeftItem: nextLeftItem as FilmItem | undefined,
    nextRightItem: nextRightItem as FilmItem | undefined,
    totalCount: states.length,
    activeCount: activeStates.length,
    comparisonCount: comparisons.length,
    feedback,
    pendingNotSeen,
    celebrationVisible,
    isInteracting,
    canMarkNotSeen,
    chooseLeft,
    chooseRight,
    tie,
    markNotSeen,
    undoNotSeen,
    setCelebrationVisible,
    setIsInteracting,
  };
}

export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;
