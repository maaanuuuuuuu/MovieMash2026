import type { NotSeenDisposition } from '../../domain/item';
import type { DismissDirection } from './useDismissDrag.utils';

export function dispositionForDirection(direction: DismissDirection): NotSeenDisposition {
  return direction === 'up' ? 'interested' : 'removed';
}

export function labelForDisposition(disposition: NotSeenDisposition | undefined) {
  if (disposition === 'interested') {
    return 'Interested';
  }

  if (disposition === 'removed') {
    return 'Remove';
  }

  return '';
}

export function getItemCardClassName(
  side: 'left' | 'right',
  isDragging: boolean,
  isReturning: boolean,
  disposition: NotSeenDisposition | undefined,
  dismissReady: boolean,
) {
  return [
    'item-card',
    `item-card--${side}`,
    isDragging ? 'item-card--dragging' : '',
    isReturning ? 'item-card--returning' : '',
    disposition ? `item-card--${disposition}` : '',
    dismissReady ? 'item-card--dismiss-ready' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function getItemCardStackClassName(isDragging: boolean) {
  return ['item-card-stack', isDragging ? 'item-card-stack--revealing' : ''].filter(Boolean).join(' ');
}

export function getItemCardSwipeHintClassName(
  disposition: NotSeenDisposition | undefined,
  dismissReady: boolean,
) {
  return [
    'item-card__swipe-hint',
    disposition ? `item-card__swipe-hint--${disposition}` : '',
    dismissReady ? 'item-card__swipe-hint--ready' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
