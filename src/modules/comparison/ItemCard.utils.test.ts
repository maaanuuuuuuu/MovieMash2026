import { describe, expect, it } from 'vitest';
import {
  dispositionForDirection,
  getItemCardClassName,
  getItemCardSwipeHintClassName,
  labelForDisposition,
} from './ItemCard.utils';

describe('item card helpers', () => {
  it('maps vertical directions to saved states', () => {
    expect(dispositionForDirection('up')).toBe('interested');
    expect(dispositionForDirection('down')).toBe('removed');
  });

  it('formats swipe labels and class names', () => {
    expect(labelForDisposition('interested')).toBe('Interested');
    expect(labelForDisposition('removed')).toBe('Remove');
    expect(getItemCardClassName('left', true, false, 'interested', true)).toContain(
      'item-card--interested',
    );
    expect(getItemCardSwipeHintClassName('removed', true)).toContain('item-card__swipe-hint--ready');
  });
});
