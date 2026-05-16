import { describe, expect, it } from 'vitest';
import { getVerticalDirection, isVerticalDismissReady } from './useDismissDrag.utils';

describe('vertical dismiss drag helpers', () => {
  it('requires vertical movement to dominate horizontal movement', () => {
    expect(getVerticalDirection(170, 20)).toBeUndefined();
    expect(getVerticalDirection(30, -132)).toBe('up');
    expect(getVerticalDirection(20, 132)).toBe('down');
  });

  it('ignores tiny vertical movement', () => {
    expect(getVerticalDirection(0, 12)).toBeUndefined();
  });

  it('requires the final vertical position to pass the dismiss distance', () => {
    expect(isVerticalDismissReady(0, -90, 132)).toBe(false);
    expect(isVerticalDismissReady(0, -150, 132)).toBe(true);
  });
});
