import type { RankingItemState } from '../../domain/item';
import type { DecidedOutcome } from '../../domain/outcome';

export const DEFAULT_RATING = 1000;

export function expectedScore(rating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

function kFactor(appearances: number) {
  if (appearances < 5) {
    return 44;
  }

  if (appearances < 15) {
    return 30;
  }

  return 20;
}

function scoreForItem(outcome: DecidedOutcome, itemId: string) {
  switch (outcome.type) {
    case 'winner':
      return outcome.winnerId === itemId ? 1 : 0;
    case 'tie':
      return 0.5;
    default:
      return outcome satisfies never;
  }
}

function resultDelta(outcome: DecidedOutcome, itemId: string) {
  switch (outcome.type) {
    case 'winner':
      return {
        wins: outcome.winnerId === itemId ? 1 : 0,
        losses: outcome.loserId === itemId ? 1 : 0,
        ties: 0,
      };
    case 'tie':
      return { wins: 0, losses: 0, ties: 1 };
    default:
      return outcome satisfies never;
  }
}

export function updateRatings(
  left: RankingItemState,
  right: RankingItemState,
  outcome: DecidedOutcome,
  now: number,
) {
  const leftExpected = expectedScore(left.rating, right.rating);
  const rightExpected = expectedScore(right.rating, left.rating);
  const leftScore = scoreForItem(outcome, left.itemId);
  const rightScore = scoreForItem(outcome, right.itemId);
  const leftDelta = resultDelta(outcome, left.itemId);
  const rightDelta = resultDelta(outcome, right.itemId);

  return {
    left: {
      ...left,
      rating: Math.round(left.rating + kFactor(left.appearances) * (leftScore - leftExpected)),
      appearances: left.appearances + 1,
      wins: left.wins + leftDelta.wins,
      losses: left.losses + leftDelta.losses,
      ties: left.ties + leftDelta.ties,
      updatedAt: now,
    },
    right: {
      ...right,
      rating: Math.round(right.rating + kFactor(right.appearances) * (rightScore - rightExpected)),
      appearances: right.appearances + 1,
      wins: right.wins + rightDelta.wins,
      losses: right.losses + rightDelta.losses,
      ties: right.ties + rightDelta.ties,
      updatedAt: now,
    },
  };
}

export function createInitialRankingState(catalogId: string, itemId: string, now: number): RankingItemState {
  return {
    catalogId,
    itemId,
    rating: DEFAULT_RATING,
    appearances: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    active: true,
    notSeen: false,
    createdAt: now,
    updatedAt: now,
  };
}
