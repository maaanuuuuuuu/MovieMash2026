import { db, type DatabaseSnapshot } from './db';
import { normalizeComparisonRecord, normalizeRankingState } from './rankingRepository.utils';

export async function exportDatabaseSnapshot(): Promise<DatabaseSnapshot> {
  return db.transaction('r', db.catalogRankingStates, db.comparisons, db.meta, async () => ({
    version: 4,
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

    await db.catalogRankingStates.bulkPut(snapshot.rankingStates.map(normalizeRankingState));
    await db.comparisons.bulkPut(snapshot.comparisons.map(normalizeComparisonRecord));
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
