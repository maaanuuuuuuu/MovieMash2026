import type { RankingItemState, NotSeenDisposition } from '../../domain/item';
import type { ComparisonOutcome } from '../../domain/outcome';
import type { ComparisonRecord, RatingChangeRecord, SnapshotComparisonRecord, SnapshotRankingItemState } from './db';

export function idsForOutcome(outcome: ComparisonOutcome) {
  switch (outcome.type) {
    case 'winner':
      return [outcome.winnerId, outcome.loserId];
    case 'tie':
      return [outcome.leftId, outcome.rightId];
    case 'notSeen':
      return [outcome.itemId, outcome.otherId];
    default:
      return outcome satisfies never;
  }
}

export function getScopedStates(states: RankingItemState[], itemIds?: readonly string[]) {
  if (!itemIds) {
    return states;
  }

  const itemIdSet = new Set(itemIds);
  return states.filter((state) => itemIdSet.has(state.itemId));
}

export function createComparisonRecord(
  catalogId: string,
  outcome: ComparisonOutcome,
  now: number,
  ratingChanges?: RatingChangeRecord[],
): ComparisonRecord {
  const id = globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(16).slice(2)}`;

  switch (outcome.type) {
    case 'winner':
      return {
        id,
        catalogId,
        outcomeType: outcome.type,
        winnerId: outcome.winnerId,
        loserId: outcome.loserId,
        ratingChanges,
        createdAt: now,
      };
    case 'tie':
      return {
        id,
        catalogId,
        outcomeType: outcome.type,
        leftId: outcome.leftId,
        rightId: outcome.rightId,
        ratingChanges,
        createdAt: now,
      };
    case 'notSeen':
      return {
        id,
        catalogId,
        outcomeType: outcome.type,
        notSeenId: outcome.itemId,
        notSeenDisposition: outcome.disposition,
        leftId: outcome.itemId,
        rightId: outcome.otherId,
        createdAt: now,
      };
    default:
      return outcome satisfies never;
  }
}

export function createRankingNotSeenRecord(
  catalogId: string,
  itemId: string,
  disposition: NotSeenDisposition,
  now: number,
): ComparisonRecord {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(16).slice(2)}`,
    catalogId,
    outcomeType: 'notSeen',
    notSeenId: itemId,
    notSeenDisposition: disposition,
    leftId: itemId,
    createdAt: now,
  };
}

export function ratingChangesForUpdate(
  leftBefore: RankingItemState,
  rightBefore: RankingItemState,
  leftAfter: RankingItemState,
  rightAfter: RankingItemState,
): RatingChangeRecord[] {
  return [
    {
      itemId: leftBefore.itemId,
      beforeRating: leftBefore.rating,
      afterRating: leftAfter.rating,
      delta: leftAfter.rating - leftBefore.rating,
    },
    {
      itemId: rightBefore.itemId,
      beforeRating: rightBefore.rating,
      afterRating: rightAfter.rating,
      delta: rightAfter.rating - rightBefore.rating,
    },
  ];
}

// Old snapshots did not store why a movie was not seen, so removed is the safest default.
export function normalizeRankingState(state: SnapshotRankingItemState): RankingItemState {
  const disposition = state.active ? null : state.notSeenDisposition ?? (state.notSeen ? 'removed' : null);

  return {
    ...state,
    active: disposition ? false : state.active,
    notSeen: disposition ? true : state.notSeen,
    notSeenDisposition: disposition,
  };
}

// Old not-seen records are kept readable by giving them the removed disposition.
export function normalizeComparisonRecord(record: SnapshotComparisonRecord): ComparisonRecord {
  if (record.outcomeType !== 'notSeen' || record.notSeenDisposition) {
    return record;
  }

  return {
    ...record,
    notSeenDisposition: 'removed',
  };
}

export function markStateNotSeen(
  state: RankingItemState,
  disposition: NotSeenDisposition,
  now: number,
): RankingItemState {
  return {
    ...state,
    active: false,
    notSeen: true,
    notSeenDisposition: disposition,
    updatedAt: now,
  };
}
