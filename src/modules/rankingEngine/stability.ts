import type { RankingItemState, StabilityTier } from '../../domain/item';
import { DEFAULT_RATING } from './rating';

const NEW_APPEARANCE_LIMIT = 3;
const STABLE_APPEARANCE_LIMIT = 8;
const EARLY_STABLE_APPEARANCE_LIMIT = 5;
const DECISIVE_RATING_MOVE = 70;
const DECISIVE_RECORD_GAP = 3;
export const STABLE_TOP_MILESTONES = [10, 15, 20] as const;

export type StableTopMilestone = (typeof STABLE_TOP_MILESTONES)[number];

export function getStabilityTier(state: RankingItemState): StabilityTier {
  if (state.appearances < NEW_APPEARANCE_LIMIT) {
    return 'new';
  }

  if (state.appearances >= STABLE_APPEARANCE_LIMIT) {
    return 'stable';
  }

  const ratingMove = Math.abs(state.rating - DEFAULT_RATING);
  const recordGap = Math.abs(state.wins - state.losses);

  if (
    state.appearances >= EARLY_STABLE_APPEARANCE_LIMIT &&
    (ratingMove >= DECISIVE_RATING_MOVE || recordGap >= DECISIVE_RECORD_GAP)
  ) {
    return 'stable';
  }

  return 'settling';
}

export function getOrderedRanking(states: RankingItemState[]) {
  return [...states]
    .filter((state) => state.active)
    .sort((first, second) => second.rating - first.rating || first.itemId.localeCompare(second.itemId));
}

export function getReachedStableTopMilestones(states: RankingItemState[]) {
  const orderedStates = getOrderedRanking(states);

  return STABLE_TOP_MILESTONES.filter((milestone) => {
    const topStates = orderedStates.slice(0, milestone);

    return topStates.length === milestone && topStates.every((state) => getStabilityTier(state) === 'stable');
  });
}
