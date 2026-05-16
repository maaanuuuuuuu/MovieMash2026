import { createInitialRankingState } from '../rankingEngine/rating';
import type { RankingItemState } from '../../domain/item';
import { db } from './db';
import type { RankingCatalogScope } from './rankingRepository.types';
import { getScopedStates } from './rankingRepository.utils';

export async function listCatalogStates(catalogId: string, itemIds?: readonly string[]) {
  const states = await db.catalogRankingStates.where('catalogId').equals(catalogId).toArray();
  return getScopedStates(states, itemIds);
}

export async function initializeRankingStates(scopes: RankingCatalogScope[]) {
  const now = Date.now();
  const statesToCreate: RankingItemState[] = [];

  await db.transaction('rw', db.catalogRankingStates, async () => {
    for (const scope of scopes) {
      const existingStates = await listCatalogStates(scope.catalogId);
      const existingIds = new Set(existingStates.map((state) => state.itemId));
      const queuedIds = new Set<string>();

      for (const item of scope.items) {
        if (existingIds.has(item.id) || queuedIds.has(item.id)) {
          continue;
        }

        queuedIds.add(item.id);
        statesToCreate.push(createInitialRankingState(scope.catalogId, item.id, now));
      }
    }

    if (statesToCreate.length > 0) {
      await db.catalogRankingStates.bulkPut(statesToCreate);
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
