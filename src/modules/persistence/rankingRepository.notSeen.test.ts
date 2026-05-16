import { beforeEach, describe, expect, it } from 'vitest';
import { db, resetDatabase } from './db';
import {
  importDatabaseSnapshot,
  initializeRankingStates,
  listComparisonRecords,
  markRankingItemNotSeen,
  restoreRankingItem,
} from './rankingRepository';
import { items } from './rankingRepository.testUtils';

describe('ranking repository not-seen states', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('stores interested and removed states separately', async () => {
    const scopedItems = items('scope', 12);
    const scopedIds = scopedItems.map((scopedItem) => scopedItem.id);
    await initializeRankingStates([{ catalogId: 'default', items: scopedItems }]);

    const interestedResult = await markRankingItemNotSeen('default', scopedIds[0], 'interested', scopedIds);
    const removedResult = await markRankingItemNotSeen('default', scopedIds[1], 'removed', scopedIds);
    const interestedState = await db.catalogRankingStates.get(['default', scopedIds[0]]);
    const removedState = await db.catalogRankingStates.get(['default', scopedIds[1]]);
    const records = await listComparisonRecords('default');

    expect(interestedResult.applied).toBe(true);
    expect(removedResult.applied).toBe(true);
    expect(interestedState).toMatchObject({ active: false, notSeen: true, notSeenDisposition: 'interested' });
    expect(removedState).toMatchObject({ active: false, notSeen: true, notSeenDisposition: 'removed' });
    expect(records.map((record) => record.notSeenDisposition).sort()).toEqual(['interested', 'removed']);
  });

  it('uses the active item count from the current scope for not-seen blocking', async () => {
    const smallItems = items('scope', 10);
    const largeItems = items('scope', 11);
    const smallIds = smallItems.map((scopedItem) => scopedItem.id);
    const largeIds = largeItems.map((scopedItem) => scopedItem.id);
    await initializeRankingStates([
      { catalogId: 'small', items: smallItems },
      { catalogId: 'large', items: largeItems },
    ]);

    const smallResult = await markRankingItemNotSeen('small', smallIds[0], 'interested', smallIds);
    const smallRemovedResult = await markRankingItemNotSeen('small', smallIds[1], 'removed', smallIds);
    const largeResult = await markRankingItemNotSeen('large', smallIds[0], 'interested', largeIds);
    const smallState = await db.catalogRankingStates.get(['small', smallIds[0]]);
    const largeState = await db.catalogRankingStates.get(['large', smallIds[0]]);

    expect(smallResult).toMatchObject({ applied: false, reason: 'minimumActiveItems' });
    expect(smallRemovedResult).toMatchObject({ applied: false, reason: 'minimumActiveItems' });
    expect(largeResult.applied).toBe(true);
    expect(smallState?.active).toBe(true);
    expect(largeState?.active).toBe(false);
    expect(largeState?.notSeenDisposition).toBe('interested');
  });

  it('restores an interested or removed item to the active pool', async () => {
    const scopedItems = items('scope', 11);
    const scopedIds = scopedItems.map((scopedItem) => scopedItem.id);
    await initializeRankingStates([{ catalogId: 'default', items: scopedItems }]);

    await markRankingItemNotSeen('default', scopedIds[0], 'interested', scopedIds);

    const result = await restoreRankingItem('default', scopedIds[0]);
    const state = await db.catalogRankingStates.get(['default', scopedIds[0]]);

    expect(result.applied).toBe(true);
    expect(state).toMatchObject({ active: true, notSeen: false, notSeenDisposition: null });
  });

  it('imports old not-seen snapshots as removed items', async () => {
    await importDatabaseSnapshot({
      version: 2,
      exportedAt: 1,
      rankingStates: [
        {
          catalogId: 'default',
          itemId: 'old-movie',
          rating: 1000,
          appearances: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          active: false,
          notSeen: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      comparisons: [
        {
          id: 'old-record',
          catalogId: 'default',
          outcomeType: 'notSeen',
          notSeenId: 'old-movie',
          leftId: 'old-movie',
          createdAt: 1,
        },
      ],
      meta: [],
    });

    const state = await db.catalogRankingStates.get(['default', 'old-movie']);
    const [record] = await listComparisonRecords('default');

    expect(state).toMatchObject({ notSeenDisposition: 'removed' });
    expect(record).toMatchObject({ notSeenDisposition: 'removed' });
  });
});
