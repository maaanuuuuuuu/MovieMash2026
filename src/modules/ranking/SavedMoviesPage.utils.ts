import type { NotSeenDisposition, RankingItemState } from '../../domain/item';

export const savedViews: { id: NotSeenDisposition; label: string }[] = [
  { id: 'interested', label: 'Interested' },
  { id: 'removed', label: 'Removed' },
];

export function getSavedRows(
  states: RankingItemState[],
  filterItemIdSet: Set<string>,
  activeView: NotSeenDisposition,
) {
  return states
    .filter((state) => filterItemIdSet.has(state.itemId))
    .filter((state) => state.notSeenDisposition === activeView)
    .sort((first, second) => second.updatedAt - first.updatedAt || first.itemId.localeCompare(second.itemId));
}

export function countSavedRows(
  states: RankingItemState[],
  filterItemIdSet: Set<string>,
  disposition: NotSeenDisposition,
) {
  return states.filter((state) => filterItemIdSet.has(state.itemId) && state.notSeenDisposition === disposition).length;
}

export function restoreMessage(label: string) {
  return `${label} restored`;
}
