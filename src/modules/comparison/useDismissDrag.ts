import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import {
  type DismissDirection,
  getVerticalDirection,
  isVerticalDismissReady,
  startsInsideCenterZone,
} from './useDismissDrag.utils';

type DragState = {
  x: number;
  y: number;
  active: boolean;
  returning: boolean;
};

export type DismissDragIndicatorState = {
  direction: DismissDirection | undefined;
  ready: boolean;
};

const DISMISS_DISTANCE = 132;
const CLICK_CANCEL_DISTANCE = 8;

export function useDismissDrag(
  onDismiss: (direction: DismissDirection) => void,
  onInteractionChange: (active: boolean) => void,
  onIndicatorChange?: (state: DismissDragIndicatorState | undefined) => void,
) {
  const originRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | undefined>(undefined);
  const movedRef = useRef(false);
  const [dragState, setDragState] = useState<DragState>({ x: 0, y: 0, active: false, returning: false });
  const direction = getVerticalDirection(dragState.x, dragState.y);
  const dismissReady = isVerticalDismissReady(dragState.x, dragState.y, DISMISS_DISTANCE);

  function isActivePointer(event: PointerEvent<HTMLElement>) {
    return pointerIdRef.current !== undefined && pointerIdRef.current === event.pointerId;
  }

  function clearPointer(event: PointerEvent<HTMLElement>) {
    if (
      pointerIdRef.current !== undefined &&
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(pointerIdRef.current)
    ) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }

    pointerIdRef.current = undefined;
  }

  function setIndicator(x: number, y: number) {
    onIndicatorChange?.({
      direction: getVerticalDirection(x, y),
      ready: isVerticalDismissReady(x, y, DISMISS_DISTANCE),
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (!startsInsideCenterZone(event)) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    originRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onInteractionChange(true);
    setDragState({ x: 0, y: 0, active: true, returning: false });
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!isActivePointer(event)) {
      return;
    }

    const x = event.clientX - originRef.current.x;
    const y = event.clientY - originRef.current.y;
    movedRef.current = movedRef.current || Math.hypot(x, y) > CLICK_CANCEL_DISTANCE;
    if (movedRef.current) {
      setIndicator(x, y);
    }
    setDragState({ x, y, active: true, returning: false });
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (!isActivePointer(event)) {
      return;
    }

    const x = event.clientX - originRef.current.x;
    const y = event.clientY - originRef.current.y;
    const releaseDirection = getVerticalDirection(x, y);
    const releaseReady = isVerticalDismissReady(x, y, DISMISS_DISTANCE);

    clearPointer(event);
    onInteractionChange(false);
    onIndicatorChange?.(undefined);

    if (releaseReady && releaseDirection) {
      onDismiss(releaseDirection);
      setDragState({ x: 0, y: 0, active: false, returning: false });
      return;
    }

    setDragState({ x: 0, y: 0, active: false, returning: true });
  }

  function handlePointerCancel(event: PointerEvent<HTMLElement>) {
    if (!isActivePointer(event)) {
      return;
    }

    clearPointer(event);
    onInteractionChange(false);
    onIndicatorChange?.(undefined);
    setDragState({ x: 0, y: 0, active: false, returning: true });
  }

  function shouldIgnoreClick() {
    if (!movedRef.current) {
      return false;
    }

    movedRef.current = false;
    return true;
  }

  const style: CSSProperties = {
    transform: `translate3d(${dragState.x}px, ${dragState.y}px, 0) rotate(${dragState.x / 28}deg)`,
  };

  return {
    style,
    dismissReady,
    direction,
    isDragging: dragState.active,
    isReturning: dragState.returning,
    shouldIgnoreClick,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
