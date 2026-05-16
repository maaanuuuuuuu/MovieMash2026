import type { ItemId, RankingItemState } from '../../domain/item';
import type { ComparisonOutcome } from '../../domain/outcome';
import { buildMatchupQueue, type Matchup } from '../pairing/selectMatchup';
import type { FilmItem } from '../content/types';

export const MATCHUP_QUEUE_SIZE = 4;

export type FeedbackKind = 'picked' | 'tie' | 'interested' | 'removed' | 'blocked' | 'undo';

export type FlowFeedback = {
  id: number;
  kind: FeedbackKind;
  label: string;
};

export type PendingNotSeen = {
  id: number;
  matchup: Matchup;
  outcome: Extract<ComparisonOutcome, { type: 'notSeen' }>;
};

export type UndoableVote = {
  id: number;
  comparisonId: string;
  matchup: Matchup;
};

export function otherItemId(matchup: Matchup, itemId: ItemId) {
  return matchup.leftId === itemId ? matchup.rightId : matchup.leftId;
}

export function matchupKey(matchup: Matchup) {
  return [matchup.leftId, matchup.rightId].sort().join('::');
}

export function matchupIsActive(matchup: Matchup, activeIds: Set<string>) {
  return activeIds.has(matchup.leftId) && activeIds.has(matchup.rightId);
}

export function getOutcomeLogMessage(outcome: ComparisonOutcome, itemById: Map<string, FilmItem>) {
  function titleForLog(itemId: ItemId) {
    return itemById.get(itemId)?.label ?? itemId;
  }

  switch (outcome.type) {
    case 'winner':
      return `${titleForLog(outcome.winnerId)} wins against ${titleForLog(outcome.loserId)}`;
    case 'tie':
      return `Tie between ${titleForLog(outcome.leftId)} and ${titleForLog(outcome.rightId)}`;
    case 'notSeen':
      return `${titleForLog(outcome.itemId)} marked ${outcome.disposition}`;
    default:
      return outcome satisfies never;
  }
}

export function getFreshMatchupQueue(states: RankingItemState[], currentQueue: Matchup[]) {
  const activeIds = new Set(states.map((state) => state.itemId));
  const previewedNextMatchup = currentQueue[0];
  const freshQueue = states.length < 2 ? [] : buildMatchupQueue(states, MATCHUP_QUEUE_SIZE);

  // Keep the next previewed pair stable when both movies are still active.
  if (!previewedNextMatchup || !matchupIsActive(previewedNextMatchup, activeIds)) {
    return freshQueue;
  }

  return [
    previewedNextMatchup,
    ...freshQueue.filter((matchup) => matchupKey(matchup) !== matchupKey(previewedNextMatchup)),
  ].slice(0, MATCHUP_QUEUE_SIZE);
}

// Remove the swiped item from queued pairs, then top the short queue back up.
export function getQueueAfterNotSeen(itemId: ItemId, activeStates: RankingItemState[], currentQueue: Matchup[]) {
  const remainingQueue = currentQueue
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

  return [...remainingQueue, ...refillQueue].slice(0, MATCHUP_QUEUE_SIZE);
}
