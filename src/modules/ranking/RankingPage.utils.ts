import type { NotSeenDisposition, RankingItemState } from '../../domain/item';
import { GLOBAL_FILM_SCOPE_ID } from '../content/filmSource';
import { getOrderedRanking } from '../rankingEngine/stability';

export function createFallbackRankingStates(itemIds: readonly string[]): RankingItemState[] {
  return itemIds.map((itemId) => ({
    itemId,
    rating: 1000,
    appearances: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    active: true,
    notSeen: false,
    notSeenDisposition: null,
    catalogId: GLOBAL_FILM_SCOPE_ID,
    createdAt: 0,
    updatedAt: 0,
  }));
}

export function getFilteredRankingRows(
  states: RankingItemState[],
  filterItemIdSet: Set<string>,
  locallyRemovedItemIds: Set<string>,
) {
  return getOrderedRanking(states)
    .filter((state) => !locallyRemovedItemIds.has(state.itemId))
    .map((state, index) => ({ state, globalRank: index + 1 }))
    .filter((row) => filterItemIdSet.has(row.state.itemId));
}

export function rankingRemovalMessage(label: string, disposition: NotSeenDisposition) {
  return disposition === 'interested' ? `${label} saved as interested` : `${label} removed`;
}
