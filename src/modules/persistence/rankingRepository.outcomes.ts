import type { NotSeenDisposition, RankingItemState } from '../../domain/item';
import type { ComparisonOutcome, DecidedOutcome } from '../../domain/outcome';
import { updateRatings } from '../rankingEngine/rating';
import { db } from './db';
import { listCatalogStates } from './rankingRepository.reads';
import {
  MINIMUM_ACTIVE_ITEMS,
  type PersistOutcomeResult,
  type RestoreRankingItemResult,
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

  await db.catalogRankingStates.put(markStateNotSeen(itemState, outcome.disposition, now));
  await db.comparisons.put(createComparisonRecord(catalogId, outcome, now));
  return { applied: true, states: getScopedStates(await listCatalogStates(catalogId), activeScopeItemIds) };
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
    await db.comparisons.put(
      createComparisonRecord(
        catalogId,
        outcome,
        now,
        ratingChangesForUpdate(beforeStates[0], beforeStates[1], updated.left, updated.right),
      ),
    );
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

    await db.catalogRankingStates.put(markStateNotSeen(itemState, disposition, now));
    await db.comparisons.put(createRankingNotSeenRecord(catalogId, itemId, disposition, now));
    return { applied: true, states: getScopedStates(await listCatalogStates(catalogId), activeScopeItemIds) };
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
