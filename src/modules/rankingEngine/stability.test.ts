import { describe, expect, it } from 'vitest';
import { createInitialRankingState } from './rating';
import { getReachedStableTopMilestones, getStabilityTier } from './stability';

function stableRankingState(itemId: string, rating: number) {
  return {
    ...createInitialRankingState('test', itemId, 1),
    appearances: 8,
    rating,
  };
}

describe('ranking stability tiers', () => {
  it('marks movies with very little evidence as new', () => {
    expect(getStabilityTier({ ...createInitialRankingState('test', 'film', 1), appearances: 2 })).toBe('new');
  });

  it('keeps mixed early records settling', () => {
    expect(
      getStabilityTier({
        ...createInitialRankingState('test', 'film', 1),
        appearances: 5,
        wins: 2,
        losses: 2,
        ties: 1,
        rating: 1018,
      }),
    ).toBe('settling');
  });

  it('marks decisive early records as stable', () => {
    expect(
      getStabilityTier({
        ...createInitialRankingState('test', 'film', 1),
        appearances: 5,
        wins: 4,
        losses: 1,
        rating: 1076,
      }),
    ).toBe('stable');
  });

  it('marks heavily compared movies as stable', () => {
    expect(getStabilityTier({ ...createInitialRankingState('test', 'film', 1), appearances: 8 })).toBe('stable');
  });

  it('detects a stable top 10 milestone', () => {
    const states = [
      ...Array.from({ length: 10 }, (_value, index) => stableRankingState(`stable-${index}`, 2000 - index)),
      { ...createInitialRankingState('test', 'settling', 1), appearances: 3, rating: 1000 },
    ];

    expect(getReachedStableTopMilestones(states)).toEqual([10]);
  });

  it('requires every movie inside the top milestone to be stable', () => {
    const states = Array.from({ length: 20 }, (_value, index) => stableRankingState(`film-${index}`, 2000 - index));
    states[4] = { ...states[4], appearances: 3 };

    expect(getReachedStableTopMilestones(states)).toEqual([]);
  });

  it('returns every reached stable top milestone', () => {
    const states = Array.from({ length: 20 }, (_value, index) => stableRankingState(`film-${index}`, 2000 - index));

    expect(getReachedStableTopMilestones(states)).toEqual([10, 15, 20]);
  });
});
