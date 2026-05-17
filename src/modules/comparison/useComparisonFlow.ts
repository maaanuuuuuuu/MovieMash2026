import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import type { FilmItem } from '../content/types';
import {
  MINIMUM_ACTIVE_ITEMS,
  listComparisonRecords,
  listRankingStates,
} from '../persistence/rankingRepository';
import type { StableTopMilestone } from '../rankingEngine/stability';
import { createComparisonFlowActions } from './useComparisonFlow.actions';
import type { FlowFeedback, UndoableVote } from './useComparisonFlow.utils';
import { useMatchupQueue } from './useMatchupQueue';
import { usePendingNotSeen } from './usePendingNotSeen';

export type { FlowFeedback } from './useComparisonFlow.utils';

export function useComparisonFlow(rankingScopeId: string, milestoneScopeId: string, items: FilmItem[]) {
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const states = useLiveQuery(() => listRankingStates(rankingScopeId, itemIds), [rankingScopeId, itemIds]);
  const comparisons = useLiveQuery(() => listComparisonRecords(rankingScopeId), [rankingScopeId]);
  const [feedback, setFeedback] = useState<FlowFeedback | undefined>();
  const [undoableVote, setUndoableVote] = useState<UndoableVote | undefined>();
  const [celebrationMilestone, setCelebrationMilestone] = useState<StableTopMilestone | undefined>();
  const [isInteracting, setIsInteracting] = useState(false);
  const loadedStates = useMemo(() => states ?? [], [states]);
  const loadedComparisons = comparisons ?? [];
  const hasLoadedStates = states !== undefined;
  const activeStates = useMemo(() => loadedStates.filter((state) => state.active), [loadedStates]);
  const { queue, replaceQueue, advanceQueue, restoreMatchup } = useMatchupQueue(activeStates, milestoneScopeId);
  const {
    pendingNotSeen,
    pendingNotSeenRef,
    clearPendingNotSeenTimeout,
    setPendingNotSeen,
    schedulePendingNotSeen,
  } = usePendingNotSeen();
  const currentMatchup = hasLoadedStates ? queue[0] : undefined;
  const nextMatchup = hasLoadedStates ? queue[1] : undefined;
  const leftItem = currentMatchup ? itemById.get(currentMatchup.leftId) : undefined;
  const rightItem = currentMatchup ? itemById.get(currentMatchup.rightId) : undefined;
  const nextLeftItem = nextMatchup ? itemById.get(nextMatchup.leftId) : undefined;
  const nextRightItem = nextMatchup ? itemById.get(nextMatchup.rightId) : undefined;
  const canMarkNotSeen = hasLoadedStates && activeStates.length > MINIMUM_ACTIVE_ITEMS;
  const actions = createComparisonFlowActions({
    rankingScopeId,
    milestoneScopeId,
    itemIds,
    itemById,
    activeStates,
    currentMatchup,
    queue,
    canMarkNotSeen,
    setFeedback,
    undoableVote,
    setUndoableVote,
    setCelebrationMilestone,
    pendingNotSeenRef,
    clearPendingNotSeenTimeout,
    setPendingNotSeen,
    schedulePendingNotSeen,
    advanceQueue,
    replaceQueue,
    restoreMatchup,
  });

  return {
    leftItem: leftItem as FilmItem | undefined,
    rightItem: rightItem as FilmItem | undefined,
    nextLeftItem: nextLeftItem as FilmItem | undefined,
    nextRightItem: nextRightItem as FilmItem | undefined,
    totalCount: loadedStates.length,
    activeCount: activeStates.length,
    comparisonCount: loadedComparisons.length,
    feedback,
    pendingNotSeen,
    undoableVote,
    celebrationMilestone,
    isInteracting,
    canMarkNotSeen,
    chooseLeft: actions.chooseLeft,
    chooseRight: actions.chooseRight,
    tie: actions.tie,
    markNotSeen: actions.markNotSeen,
    undoNotSeen: actions.undoNotSeen,
    undoLastVote: actions.undoLastVote,
    setCelebrationMilestone,
    setIsInteracting,
  };
}

export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;
