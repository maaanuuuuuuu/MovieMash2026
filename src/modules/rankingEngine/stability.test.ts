import { describe, expect, it } from 'vitest';
import { createInitialRankingState } from './rating';
import { getStabilityTier } from './stability';

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
});
