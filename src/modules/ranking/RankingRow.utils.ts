import type { NotSeenDisposition } from '../../domain/item';
import type { CSSProperties } from 'react';

const SWIPE_INTENT_PX = 8;

export function getSwipeDisposition(dragX: number): NotSeenDisposition | undefined {
  if (dragX < -SWIPE_INTENT_PX) {
    return 'interested';
  }

  if (dragX > SWIPE_INTENT_PX) {
    return 'removed';
  }

  return undefined;
}

export function isRankingSwipeReady(dragX: number, threshold: number) {
  const disposition = getSwipeDisposition(dragX);

  if (disposition === 'interested') {
    return dragX <= -threshold;
  }

  if (disposition === 'removed') {
    return dragX >= threshold;
  }

  return false;
}

export function getRankingSwipeLabel(
  canMarkNotSeen: boolean,
  disposition: NotSeenDisposition | undefined,
) {
  if (!canMarkNotSeen) {
    return 'Last 10 stay';
  }

  return disposition === 'interested' ? 'Interested' : 'Remove';
}

export function getRankingRowStyle(dragX: number): CSSProperties | undefined {
  return dragX === 0 ? undefined : { transform: `translateX(${dragX}px)` };
}

export function getRankingRowHintClassName(
  isVisible: boolean,
  disposition: NotSeenDisposition | undefined,
  isDismissReady: boolean,
) {
  return [
    'ranking-row__swipe-hint',
    isVisible ? 'ranking-row__swipe-hint--visible' : '',
    disposition ? `ranking-row__swipe-hint--${disposition}` : '',
    isDismissReady ? 'ranking-row__swipe-hint--ready' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function getRankingRowButtonClassName(
  isPointerDown: boolean,
  disposition: NotSeenDisposition | undefined,
  isDismissReady: boolean,
) {
  return [
    'ranking-row__button',
    isPointerDown ? 'ranking-row__button--dragging' : '',
    disposition ? `ranking-row__button--${disposition}` : '',
    isDismissReady ? 'ranking-row__button--dismiss-ready' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
