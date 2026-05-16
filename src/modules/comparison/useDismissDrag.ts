import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';

type DragState = {
  x: number;
  y: number;
  active: boolean;
  returning: boolean;
};

const DISMISS_DISTANCE = 132;
const CLICK_CANCEL_DISTANCE = 8;
const DRAG_START_ZONE_INSET_RATIO = 0.18;

function startsInsideCenterZone(event: PointerEvent<HTMLElement>) {
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

export function useDismissDrag(onDismiss: () => void, onInteractionChange: (active: boolean) => void) {
  const originRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const [dragState, setDragState] = useState<DragState>({ x: 0, y: 0, active: false, returning: false });
  const distance = Math.hypot(dragState.x, dragState.y);
  const dismissReady = distance > DISMISS_DISTANCE;

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

    if (dismissReady) {
      onDismiss();
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
    transform: `translate3d(${dragState.x}px, ${dragState.y}px, 0) rotate(${dragState.x / 16}deg)`,
  };

  return {
    style,
    dismissReady,
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
