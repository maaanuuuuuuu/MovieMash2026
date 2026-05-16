import { beforeEach, describe, expect, it } from 'vitest';
import type { ComparableItem } from '../../domain/item';
import { db, resetDatabase } from './db';
import {
  initializeRankingStates,
  listComparisonRecords,
  listRankingStates,
  markRankingItemNotSeen,
  persistOutcome,
} from './rankingRepository';

function item(id: string): ComparableItem {
  return {
    id,
    category: 'test',
    label: id,
    subtitle: id,
    imageSrc: `/posters/${id}.jpg`,
  };
}

function items(prefix: string, count: number) {
  return Array.from({ length: count }, (_value, index) => item(`${prefix}-${index}`));
}

describe('ranking repository catalog scopes', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('initializes each item once inside each catalog', async () => {
    await initializeRankingStates([
      { catalogId: 'default', items: [item('shared'), item('shared'), item('unique')] },
      { catalogId: 'action', items: [item('shared'), item('action-only')] },
    ]);

    const defaultStates = await listRankingStates('default');
    const actionStates = await listRankingStates('action');

    expect(defaultStates.map((state) => state.itemId).sort()).toEqual(['shared', 'unique']);
    expect(actionStates.map((state) => state.itemId).sort()).toEqual(['action-only', 'shared']);
    expect(defaultStates.every((state) => state.catalogId === 'default')).toBe(true);
    expect(actionStates.every((state) => state.catalogId === 'action')).toBe(true);
  });

  it('lists only the requested item IDs for a catalog scope', async () => {
    await initializeRankingStates([{ catalogId: 'default', items: [item('a'), item('b'), item('c')] }]);

    const scopedStates = await listRankingStates('default', ['c', 'a']);

    expect(scopedStates.map((state) => state.itemId).sort()).toEqual(['a', 'c']);
  });

  it('returns scoped states after a scoped outcome', async () => {
    const scopedItems = items('scope', 11);
    const outsideItems = items('outside', 4);
    const scopedIds = scopedItems.map((scopedItem) => scopedItem.id);
    await initializeRankingStates([
      { catalogId: 'default', items: scopedItems },
      { catalogId: 'action', items: outsideItems },
    ]);

    const result = await persistOutcome(
      'default',
      { type: 'notSeen', itemId: scopedIds[0], otherId: scopedIds[1] },
      scopedIds,
    );

    expect(result.applied).toBe(true);
    expect(result.states.map((state) => state.itemId).sort()).toEqual([...scopedIds].sort());
    expect(result.states.find((state) => state.itemId === scopedIds[0])?.active).toBe(false);
    expect((await listRankingStates('action')).every((state) => state.active)).toBe(true);
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

    const smallResult = await markRankingItemNotSeen('small', smallIds[0], smallIds);
    const largeResult = await markRankingItemNotSeen('large', smallIds[0], largeIds);
    const smallState = await db.catalogRankingStates.get(['small', smallIds[0]]);
    const largeState = await db.catalogRankingStates.get(['large', smallIds[0]]);

    expect(smallResult).toMatchObject({ applied: false, reason: 'minimumActiveItems' });
    expect(largeResult.applied).toBe(true);
    expect(smallState?.active).toBe(true);
    expect(largeState?.active).toBe(false);
  });

  it('records scoped decided outcomes with point changes', async () => {
    const scopedItems = items('scope', 11);
    const scopedIds = scopedItems.map((scopedItem) => scopedItem.id);
    await initializeRankingStates([{ catalogId: 'default', items: scopedItems }]);

    const result = await persistOutcome(
      'default',
      { type: 'winner', winnerId: scopedIds[0], loserId: scopedIds[1] },
      scopedIds,
    );
    const records = await listComparisonRecords('default');

    expect(result.applied).toBe(true);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      catalogId: 'default',
      outcomeType: 'winner',
      winnerId: scopedIds[0],
      loserId: scopedIds[1],
    });
    expect(records[0].ratingChanges?.map((change) => change.itemId).sort()).toEqual([scopedIds[0], scopedIds[1]].sort());
  });

  it('does not leak shared item ratings between catalogs', async () => {
    const sharedItems = [item('shared'), item('opponent')];
    await initializeRankingStates([
      { catalogId: 'default', items: sharedItems },
      { catalogId: 'action', items: sharedItems },
    ]);

    await persistOutcome('action', { type: 'winner', winnerId: 'shared', loserId: 'opponent' }, ['shared', 'opponent']);

    const defaultShared = await db.catalogRankingStates.get(['default', 'shared']);
    const actionShared = await db.catalogRankingStates.get(['action', 'shared']);
    const defaultRecords = await listComparisonRecords('default');
    const actionRecords = await listComparisonRecords('action');

    expect(defaultShared).toMatchObject({ catalogId: 'default', itemId: 'shared', rating: 1000, appearances: 0 });
    expect(actionShared).toMatchObject({ catalogId: 'action', itemId: 'shared', rating: 1022, appearances: 1 });
    expect(defaultRecords).toHaveLength(0);
    expect(actionRecords).toHaveLength(1);
  });
});
