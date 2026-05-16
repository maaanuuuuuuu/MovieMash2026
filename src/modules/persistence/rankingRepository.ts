import type { ComparableItem, RankingItemState } from '../../domain/item';
import type { ComparisonOutcome, DecidedOutcome } from '../../domain/outcome';
import { createInitialRankingState, updateRatings } from '../rankingEngine/rating';
import { db, type ComparisonRecord, type DatabaseSnapshot, type RatingChangeRecord } from './db';

const MINIMUM_ACTIVE_ITEMS = 10;

export type RankingCatalogScope = {
  catalogId: string;
  items: ComparableItem[];
};

export type PersistOutcomeResult =
  | {
      applied: true;
      states: RankingItemState[];
    }
  | {
      applied: false;
      reason: 'minimumActiveItems' | 'missingState';
      states: RankingItemState[];
    };

function createRecord(
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
        leftId: outcome.itemId,
        rightId: outcome.otherId,
        createdAt: now,
      };
    default:
      return outcome satisfies never;
  }
}

function idsForOutcome(outcome: ComparisonOutcome) {
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

function ratingChangesForUpdate(
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

function getScopedStates(states: RankingItemState[], itemIds?: readonly string[]) {
  if (!itemIds) {
    return states;
  }

  const itemIdSet = new Set(itemIds);
  return states.filter((state) => itemIdSet.has(state.itemId));
}

async function listCatalogStates(catalogId: string, itemIds?: readonly string[]) {
  const states = await db.catalogRankingStates.where('catalogId').equals(catalogId).toArray();
  return getScopedStates(states, itemIds);
}

export async function initializeRankingStates(scopes: RankingCatalogScope[]) {
  const now = Date.now();
  const missingStates: RankingItemState[] = [];

  await db.transaction('rw', db.catalogRankingStates, async () => {
    for (const scope of scopes) {
      const existingStates = await listCatalogStates(scope.catalogId);
      const existingIds = new Set(existingStates.map((state) => state.itemId));
      const missingIds = new Set<string>();

      for (const item of scope.items) {
        if (existingIds.has(item.id) || missingIds.has(item.id)) {
          continue;
        }

        missingIds.add(item.id);
        missingStates.push(createInitialRankingState(scope.catalogId, item.id, now));
      }
    }

    if (missingStates.length > 0) {
      await db.catalogRankingStates.bulkPut(missingStates);
    }
  });
}

export function listRankingStates(catalogId: string, itemIds?: readonly string[]) {
  return listCatalogStates(catalogId, itemIds);
}

export function listComparisonRecords(catalogId?: string) {
  if (!catalogId) {
    return db.comparisons.toArray();
  }

  return db.comparisons.where('catalogId').equals(catalogId).toArray();
}

export async function exportDatabaseSnapshot(): Promise<DatabaseSnapshot> {
  return db.transaction('r', db.catalogRankingStates, db.comparisons, db.meta, async () => ({
    version: 2,
    exportedAt: Date.now(),
    rankingStates: await db.catalogRankingStates.toArray(),
    comparisons: await db.comparisons.toArray(),
    meta: await db.meta.toArray(),
  }));
}

export async function importDatabaseSnapshot(snapshot: DatabaseSnapshot) {
  await db.transaction('rw', db.catalogRankingStates, db.comparisons, db.meta, async () => {
    await db.catalogRankingStates.clear();
    await db.comparisons.clear();
    await db.meta.clear();

    await db.catalogRankingStates.bulkPut(snapshot.rankingStates);
    await db.comparisons.bulkPut(snapshot.comparisons);
    await db.meta.bulkPut(snapshot.meta);
  });
}

export async function getMetaBoolean(key: string) {
  const record = await db.meta.get(key);
  return record?.value === true;
}

export async function setMetaBoolean(key: string, value: boolean) {
  await db.meta.put({ key, value });
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
    const outcomeIds = idsForOutcome(outcome);

    if (outcomeIds.some((id) => !statesById.has(id))) {
      return { applied: false, reason: 'missingState', states: scopedStates };
    }

    if (outcome.type === 'notSeen') {
      const activeCount = scopedStates.filter((state) => state.active).length;

      if (activeCount <= MINIMUM_ACTIVE_ITEMS) {
        return { applied: false, reason: 'minimumActiveItems', states: scopedStates };
      }

      const itemState = statesById.get(outcome.itemId);

      if (!itemState) {
        return { applied: false, reason: 'missingState', states: scopedStates };
      }

      await db.catalogRankingStates.put({
        ...itemState,
        active: false,
        notSeen: true,
        updatedAt: now,
      });
      await db.comparisons.put(createRecord(catalogId, outcome, now));
      return { applied: true, states: getScopedStates(await listCatalogStates(catalogId), activeScopeItemIds) };
    }

    const beforeStates = idsForOutcome(outcome).map((itemId) => statesById.get(itemId));
    const updated = applyDecidedOutcome(statesById, outcome, now);

    if (!updated || !beforeStates[0] || !beforeStates[1]) {
      return { applied: false, reason: 'missingState', states: scopedStates };
    }

    await db.catalogRankingStates.bulkPut([updated.left, updated.right]);
    await db.comparisons.put(
      createRecord(
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

    const activeCount = scopedStates.filter((state) => state.active).length;

    if (activeCount <= MINIMUM_ACTIVE_ITEMS) {
      return { applied: false, reason: 'minimumActiveItems', states: scopedStates };
    }

    await db.catalogRankingStates.put({
      ...itemState,
      active: false,
      notSeen: true,
      updatedAt: now,
    });
    await db.comparisons.put({
      id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(16).slice(2)}`,
      catalogId,
      outcomeType: 'notSeen',
      notSeenId: itemId,
      leftId: itemId,
      createdAt: now,
    });

    return { applied: true, states: getScopedStates(await listCatalogStates(catalogId), activeScopeItemIds) };
  });
}

export { MINIMUM_ACTIVE_ITEMS };
