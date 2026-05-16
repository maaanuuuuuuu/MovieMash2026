import { describe, expect, it } from 'vitest';
import {
  getRankingRowButtonClassName,
  getRankingRowStyle,
  getRankingSwipeLabel,
  getSwipeDisposition,
  isRankingSwipeReady,
} from './RankingRow.utils';

describe('ranking row swipe helpers', () => {
  it('maps left and right movement to saved states', () => {
    expect(getSwipeDisposition(-12)).toBe('interested');
    expect(getSwipeDisposition(12)).toBe('removed');
    expect(getSwipeDisposition(4)).toBeUndefined();
  });

  it('uses the threshold before committing a swipe', () => {
    expect(isRankingSwipeReady(-95, 96)).toBe(false);
    expect(isRankingSwipeReady(-96, 96)).toBe(true);
    expect(isRankingSwipeReady(96, 96)).toBe(true);
  });

  it('shows the safety label when removal is blocked', () => {
    expect(getRankingSwipeLabel(false, 'interested')).toBe('Last 10 stay');
    expect(getRankingSwipeLabel(true, 'interested')).toBe('Interested');
    expect(getRankingSwipeLabel(true, 'removed')).toBe('Remove');
  });

  it('formats drag state for the row button', () => {
    expect(getRankingRowStyle(24)).toEqual({ transform: 'translateX(24px)' });
    expect(getRankingRowButtonClassName(true, 'removed', true)).toContain('ranking-row__button--removed');
  });
});
