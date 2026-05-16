import type { NotSeenDisposition, RankingItemState } from '../../domain/item';
import type { ComparisonOutcome, DecidedOutcome } from '../../domain/outcome';
import { updateRatings } from '../rankingEngine/rating';
import { db, type ComparisonRecord, type RatingChangeRecord } from './db';
import { listCatalogStates } from './rankingRepository.reads';
import {
  MINIMUM_ACTIVE_ITEMS,
  type PersistOutcomeResult,
  type RestoreRankingItemResult,
  type UndoDecidedOutcomeResult,
} from './rankingRepository.types';
import {
  createComparisonRecord,
  createRankingNotSeenRecord,
  getScopedStates,
  idsForOutcome,
  markStateNotSeen,
  ratingChangesForUpdate,
} from './rankingRepository.utils';

function applyDecidedOutcome(
  statesById: Map<string, RankingItemState>,
  outcome: DecidedOutcome,
  now: number,
) {
  const leftId = outcome.type === 'tie' ? outcome.leftId : outcome.winnerId;
  const rightId = outcome.type === 'tie' ? outcome.rightId : outcome.loserId;
  const leftState = statesById.get(leftId);
  const rightState = statesById.get(rightId);

  if (!leftState || !rightState) {
    return undefined;
  }

  return updateRatings(leftState, rightState, outcome, now);
}

function idsForDecidedRecord(record: ComparisonRecord) {
  switch (record.outcomeType) {
    case 'winner':
      return record.winnerId && record.loserId ? [record.winnerId, record.loserId] : [];
    case 'tie':
      return record.leftId && record.rightId ? [record.leftId, record.rightId] : [];
    case 'notSeen':
      return [];
    default:
      return record.outcomeType satisfies never;
  }
}

function getOutcomeRemovalDelta(record: ComparisonRecord, itemId: string) {
  switch (record.outcomeType) {
    case 'winner':
      return {
        wins: record.winnerId === itemId ? 1 : 0,
        losses: record.loserId === itemId ? 1 : 0,
        ties: 0,
      };
    case 'tie':
      return { wins: 0, losses: 0, ties: 1 };
    case 'notSeen':
      return { wins: 0, losses: 0, ties: 0 };
    default:
      return record.outcomeType satisfies never;
  }
}

function restoreStateBeforeOutcome(
  state: RankingItemState,
  record: ComparisonRecord,
  change: RatingChangeRecord,
  now: number,
): RankingItemState | undefined {
  const delta = getOutcomeRemovalDelta(record, state.itemId);

  if (
    state.rating !== change.afterRating ||
    state.appearances <= 0 ||
    state.wins < delta.wins ||
    state.losses < delta.losses ||
    state.ties < delta.ties
  ) {
    return undefined;
  }

  return {
    ...state,
    rating: change.beforeRating,
    appearances: state.appearances - 1,
    wins: state.wins - delta.wins,
    losses: state.losses - delta.losses,
    ties: state.ties - delta.ties,
    updatedAt: now,
  };
}

function isLatestCatalogRecord(record: ComparisonRecord, records: ComparisonRecord[]) {
  const latestCreatedAt = Math.max(...records.map((catalogRecord) => catalogRecord.createdAt));
  return record.createdAt === latestCreatedAt;
}

// Not-seen actions remove one movie without changing ratings.
async function persistNotSeenOutcome(
  catalogId: string,
  outcome: Extract<ComparisonOutcome, { type: 'notSeen' }>,
  states: RankingItemState[],
  activeScopeItemIds: readonly string[] | undefined,
  now: number,
): Promise<PersistOutcomeResult> {
  const scopedStates = getScopedStates(states, activeScopeItemIds);
  const activeCount = scopedStates.filter((state) => state.active).length;
  const itemState = states.find((state) => state.itemId === outcome.itemId);

  if (!itemState) {
    return { applied: false, reason: 'missingState', states: scopedStates };
  }

  if (activeCount <= MINIMUM_ACTIVE_ITEMS) {
    return { applied: false, reason: 'minimumActiveItems', states: scopedStates };
  }

  const record = createComparisonRecord(catalogId, outcome, now);
  await db.catalogRankingStates.put(markStateNotSeen(itemState, outcome.disposition, now));
  await db.comparisons.put(record);
  return {
    applied: true,
    comparisonId: record.id,
    states: getScopedStates(await listCatalogStates(catalogId), activeScopeItemIds),
  };
}

export async function persistOutcome(
  catalogId: string,
  outcome: ComparisonOutcome,
  activeScopeItemIds?: readonly string[],
): Promise<PersistOutcomeResult> {
  return db.transaction('rw', db.catalogRankingStates, db.comparisons, async () => {
    const now = Date.now();
    const states = await listCatalogStates(catalogId);
    const scopedStates = getScopedStates(states, activeScopeItemIds);
    const statesById = new Map(states.map((state) => [state.itemId, state]));

    if (idsForOutcome(outcome).some((id) => !statesById.has(id))) {
      return { applied: false, reason: 'missingState', states: scopedStates };
    }

    if (outcome.type === 'notSeen') {
      return persistNotSeenOutcome(catalogId, outcome, states, activeScopeItemIds, now);
    }

    const beforeStates = idsForOutcome(outcome).map((itemId) => statesById.get(itemId));
    const updated = applyDecidedOutcome(statesById, outcome, now);

    if (!updated || !beforeStates[0] || !beforeStates[1]) {
      return { applied: false, reason: 'missingState', states: scopedStates };
    }

    await db.catalogRankingStates.bulkPut([updated.left, updated.right]);
    const record = createComparisonRecord(
      catalogId,
      outcome,
      now,
      ratingChangesForUpdate(beforeStates[0], beforeStates[1], updated.left, updated.right),
    );

    await db.comparisons.put(record);
    return {
      applied: true,
      comparisonId: record.id,
      states: getScopedStates(await listCatalogStates(catalogId), activeScopeItemIds),
    };
  });
}

export async function undoDecidedOutcome(
  catalogId: string,
  comparisonId: string,
  activeScopeItemIds?: readonly string[],
): Promise<UndoDecidedOutcomeResult> {
  return db.transaction('rw', db.catalogRankingStates, db.comparisons, async () => {
    const now = Date.now();
    const states = await listCatalogStates(catalogId);
    const scopedStates = getScopedStates(states, activeScopeItemIds);
    const record = await db.comparisons.get(comparisonId);

    if (!record || record.catalogId !== catalogId) {
      return { applied: false, reason: 'missingRecord', states: scopedStates };
    }

    if (record.outcomeType === 'notSeen') {
      return { applied: false, reason: 'notUndoable', states: scopedStates };
    }

    const catalogRecords = await db.comparisons.where('catalogId').equals(catalogId).toArray();

    if (!isLatestCatalogRecord(record, catalogRecords)) {
      return { applied: false, reason: 'staleRecord', states: scopedStates };
    }

    const outcomeIds = idsForDecidedRecord(record);
    const ratingChanges = record.ratingChanges ?? [];

    if (outcomeIds.length !== 2 || ratingChanges.length < 2) {
      return { applied: false, reason: 'notUndoable', states: scopedStates };
    }

    const statesById = new Map(states.map((state) => [state.itemId, state]));
    const changesById = new Map(ratingChanges.map((change) => [change.itemId, change]));
    const restoredStates = outcomeIds.map((itemId) => {
      const state = statesById.get(itemId);
      const change = changesById.get(itemId);

      return state && change ? restoreStateBeforeOutcome(state, record, change, now) : undefined;
    });

    if (!restoredStates[0] || !restoredStates[1]) {
      return { applied: false, reason: 'missingState', states: scopedStates };
    }

    await db.catalogRankingStates.bulkPut([restoredStates[0], restoredStates[1]]);
    await db.comparisons.delete(record.id);

    return { applied: true, states: getScopedStates(await listCatalogStates(catalogId), activeScopeItemIds) };
  });
}

export async function markRankingItemNotSeen(
  catalogId: string,
  itemId: string,
  disposition: NotSeenDisposition,
  activeScopeItemIds?: readonly string[],
): Promise<PersistOutcomeResult> {
  return db.transaction('rw', db.catalogRankingStates, db.comparisons, async () => {
    const now = Date.now();
    const states = await listCatalogStates(catalogId);
    const scopedStates = getScopedStates(states, activeScopeItemIds);
    const itemState = states.find((state) => state.itemId === itemId);

    if (!itemState) {
      return { applied: false, reason: 'missingState', states: scopedStates };
    }

    if (scopedStates.filter((state) => state.active).length <= MINIMUM_ACTIVE_ITEMS) {
      return { applied: false, reason: 'minimumActiveItems', states: scopedStates };
    }

    const record = createRankingNotSeenRecord(catalogId, itemId, disposition, now);

    await db.catalogRankingStates.put(markStateNotSeen(itemState, disposition, now));
    await db.comparisons.put(record);
    return {
      applied: true,
      comparisonId: record.id,
      states: getScopedStates(await listCatalogStates(catalogId), activeScopeItemIds),
    };
  });
}

export async function restoreRankingItem(
  catalogId: string,
  itemId: string,
): Promise<RestoreRankingItemResult> {
  return db.transaction('rw', db.catalogRankingStates, async () => {
    const itemState = await db.catalogRankingStates.get([catalogId, itemId]);

    if (!itemState) {
      return { applied: false, reason: 'missingState' };
    }

    const restoredState: RankingItemState = {
      ...itemState,
      active: true,
      notSeen: false,
      notSeenDisposition: null,
      updatedAt: Date.now(),
    };

    await db.catalogRankingStates.put(restoredState);
    return { applied: true, state: restoredState };
  });
}
