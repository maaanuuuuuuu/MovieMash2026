import { beforeEach, describe, expect, it } from 'vitest';
import { db, resetDatabase } from './db';
import {
  initializeRankingStates,
  listComparisonRecords,
  listRankingStates,
  persistOutcome,
  undoDecidedOutcome,
} from './rankingRepository';
import { item, items } from './rankingRepository.testUtils';

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
      { type: 'notSeen', itemId: scopedIds[0], otherId: scopedIds[1], disposition: 'removed' },
      scopedIds,
    );

    expect(result.applied).toBe(true);
    expect(result.states.map((state) => state.itemId).sort()).toEqual([...scopedIds].sort());
    expect(result.states.find((state) => state.itemId === scopedIds[0])?.active).toBe(false);
    expect((await listRankingStates('action')).every((state) => state.active)).toBe(true);
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

  it('undoes the latest winner outcome and restores both ranking states', async () => {
    const scopedItems = items('scope', 11);
    const scopedIds = scopedItems.map((scopedItem) => scopedItem.id);
    await initializeRankingStates([{ catalogId: 'default', items: scopedItems }]);

    const outcomeResult = await persistOutcome(
      'default',
      { type: 'winner', winnerId: scopedIds[0], loserId: scopedIds[1] },
      scopedIds,
    );

    if (!outcomeResult.applied) {
      throw new Error('Expected winner outcome to apply.');
    }

    const undoResult = await undoDecidedOutcome('default', outcomeResult.comparisonId, scopedIds);
    const winnerState = await db.catalogRankingStates.get(['default', scopedIds[0]]);
    const loserState = await db.catalogRankingStates.get(['default', scopedIds[1]]);

    expect(undoResult.applied).toBe(true);
    expect(winnerState).toMatchObject({ rating: 1000, appearances: 0, wins: 0, losses: 0, ties: 0 });
    expect(loserState).toMatchObject({ rating: 1000, appearances: 0, wins: 0, losses: 0, ties: 0 });
    expect(await listComparisonRecords('default')).toHaveLength(0);
  });

  it('undoes the latest tie outcome and restores tie counters', async () => {
    const scopedItems = items('scope', 11);
    const scopedIds = scopedItems.map((scopedItem) => scopedItem.id);
    await initializeRankingStates([{ catalogId: 'default', items: scopedItems }]);

    const outcomeResult = await persistOutcome(
      'default',
      { type: 'tie', leftId: scopedIds[0], rightId: scopedIds[1] },
      scopedIds,
    );

    if (!outcomeResult.applied) {
      throw new Error('Expected tie outcome to apply.');
    }

    const undoResult = await undoDecidedOutcome('default', outcomeResult.comparisonId, scopedIds);
    const leftState = await db.catalogRankingStates.get(['default', scopedIds[0]]);
    const rightState = await db.catalogRankingStates.get(['default', scopedIds[1]]);

    expect(undoResult.applied).toBe(true);
    expect(leftState).toMatchObject({ rating: 1000, appearances: 0, wins: 0, losses: 0, ties: 0 });
    expect(rightState).toMatchObject({ rating: 1000, appearances: 0, wins: 0, losses: 0, ties: 0 });
    expect(await listComparisonRecords('default')).toHaveLength(0);
  });

  it('does not undo an older decided outcome after another comparison is recorded', async () => {
    const scopedItems = items('scope', 11);
    const scopedIds = scopedItems.map((scopedItem) => scopedItem.id);
    await initializeRankingStates([{ catalogId: 'default', items: scopedItems }]);

    const firstResult = await persistOutcome(
      'default',
      { type: 'winner', winnerId: scopedIds[0], loserId: scopedIds[1] },
      scopedIds,
    );

    if (!firstResult.applied) {
      throw new Error('Expected first outcome to apply.');
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });
    const secondResult = await persistOutcome(
      'default',
      { type: 'winner', winnerId: scopedIds[2], loserId: scopedIds[3] },
      scopedIds,
    );

    if (!secondResult.applied) {
      throw new Error('Expected second outcome to apply.');
    }

    const undoResult = await undoDecidedOutcome('default', firstResult.comparisonId, scopedIds);

    expect(undoResult).toMatchObject({ applied: false, reason: 'staleRecord' });
    expect(await listComparisonRecords('default')).toHaveLength(2);
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
