import { describe, expect, it } from 'vitest';
import { createInitialRankingState, expectedScore, updateRatings } from './rating';

describe('ranking engine', () => {
  it('moves ratings after a winner is chosen', () => {
    const left = createInitialRankingState('test', 'left', 1);
    const right = createInitialRankingState('test', 'right', 1);
    const result = updateRatings(left, right, { type: 'winner', winnerId: 'left', loserId: 'right' }, 2);

    expect(result.left.rating).toBeGreaterThan(left.rating);
    expect(result.right.rating).toBeLessThan(right.rating);
    expect(result.left.appearances).toBe(1);
    expect(result.left.wins).toBe(1);
    expect(result.right.losses).toBe(1);
  });

  it('treats ties as real outcomes', () => {
    const favorite = { ...createInitialRankingState('test', 'favorite', 1), rating: 1200 };
    const underdog = { ...createInitialRankingState('test', 'underdog', 1), rating: 900 };
    const result = updateRatings(favorite, underdog, { type: 'tie', leftId: 'favorite', rightId: 'underdog' }, 2);

    expect(result.left.rating).toBeLessThan(favorite.rating);
    expect(result.right.rating).toBeGreaterThan(underdog.rating);
    expect(result.left.ties).toBe(1);
    expect(result.right.ties).toBe(1);
  });

  it('calculates symmetric expected scores', () => {
    const first = expectedScore(1000, 1100);
    const second = expectedScore(1100, 1000);

    expect(first + second).toBeCloseTo(1, 6);
  });
});
