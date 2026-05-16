import type { PointerEvent } from 'react';

export type DismissDirection = 'up' | 'down';

const DRAG_START_ZONE_INSET_RATIO = 0.18;
const INTENT_DISTANCE = 16;

export function startsInsideCenterZone(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const horizontalInset = rect.width * DRAG_START_ZONE_INSET_RATIO;
  const verticalInset = rect.height * DRAG_START_ZONE_INSET_RATIO;

  return (
    x >= horizontalInset &&
    x <= rect.width - horizontalInset &&
    y >= verticalInset &&
    y <= rect.height - verticalInset
  );
}

export function getVerticalDirection(x: number, y: number): DismissDirection | undefined {
  if (Math.abs(y) <= INTENT_DISTANCE || Math.abs(y) <= Math.abs(x)) {
    return undefined;
  }

  return y < 0 ? 'up' : 'down';
}

export function isVerticalDismissReady(x: number, y: number, distance: number) {
  return getVerticalDirection(x, y) !== undefined && Math.abs(y) > distance;
}
