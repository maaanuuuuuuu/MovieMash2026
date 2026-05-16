import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { type DismissDirection, getVerticalDirection, startsInsideCenterZone } from './useDismissDrag.utils';

type DragState = {
  x: number;
  y: number;
  active: boolean;
  returning: boolean;
};

const DISMISS_DISTANCE = 132;
const CLICK_CANCEL_DISTANCE = 8;

export function useDismissDrag(
  onDismiss: (direction: DismissDirection) => void,
  onInteractionChange: (active: boolean) => void,
) {
  const originRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const [dragState, setDragState] = useState<DragState>({ x: 0, y: 0, active: false, returning: false });
  const direction = getVerticalDirection(dragState.x, dragState.y);
  const dismissReady = direction !== undefined && Math.abs(dragState.y) > DISMISS_DISTANCE;

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (!startsInsideCenterZone(event)) {
      return;
    }

    originRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onInteractionChange(true);
    setDragState({ x: 0, y: 0, active: true, returning: false });
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!dragState.active) {
      return;
    }

    const x = event.clientX - originRef.current.x;
    const y = event.clientY - originRef.current.y;
    movedRef.current = movedRef.current || Math.hypot(x, y) > CLICK_CANCEL_DISTANCE;
    setDragState({ x, y, active: true, returning: false });
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (!dragState.active) {
      return;
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    onInteractionChange(false);

    if (dismissReady && direction) {
      onDismiss(direction);
      setDragState({ x: 0, y: 0, active: false, returning: false });
      return;
    }

    setDragState({ x: 0, y: 0, active: false, returning: true });
  }

  function handlePointerCancel() {
    onInteractionChange(false);
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
