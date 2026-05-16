import { type PointerEvent, useRef, useState } from 'react';
import type { NotSeenDisposition, RankingItemState, StabilityTier } from '../../domain/item';
import type { FilmItem } from '../content/types';
import './RankingRow.css';
import './RankingRow.responsive.css';
import {
  getRankingRowButtonClassName,
  getRankingRowHintClassName,
  getRankingRowStyle,
  getRankingSwipeLabel,
  getSwipeDisposition,
  isRankingSwipeReady,
} from './RankingRow.utils';

type RankingRowProps = {
  item: FilmItem;
  state: RankingItemState;
  rank: number;
  tier: StabilityTier;
  canMarkNotSeen: boolean;
  onOpenHistory: () => void;
  onMarkNotSeen: (disposition: NotSeenDisposition) => Promise<boolean>;
};

const SWIPE_THRESHOLD_PX = 96;

export function RankingRow({ item, state, rank, tier, canMarkNotSeen, onOpenHistory, onMarkNotSeen }: RankingRowProps) {
  const pointerIdRef = useRef<number | undefined>(undefined);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const startXRef = useRef(0);
  const dragXRef = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const swipeDisposition = getSwipeDisposition(dragX);
  const isDismissReady = isRankingSwipeReady(dragX, SWIPE_THRESHOLD_PX);
  const isSwipeHintVisible = Math.abs(dragX) > 8;

  function isActivePointer(event: PointerEvent<HTMLButtonElement>) {
    return pointerIdRef.current !== undefined && pointerIdRef.current === event.pointerId;
  }

  function resetDrag() {
    if (
      buttonRef.current &&
      pointerIdRef.current !== undefined &&
      typeof buttonRef.current.hasPointerCapture === 'function' &&
      buttonRef.current.hasPointerCapture(pointerIdRef.current)
    ) {
      buttonRef.current.releasePointerCapture(pointerIdRef.current);
    }

    pointerIdRef.current = undefined;
    dragXRef.current = 0;
    setIsPointerDown(false);
    setDragX(0);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    setIsPointerDown(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!isActivePointer(event) || isRemoving) {
      return;
    }

    const nextDragX = event.clientX - startXRef.current;
    dragXRef.current = nextDragX;
    setDragX(nextDragX);
  }

  async function handlePointerEnd(event: PointerEvent<HTMLButtonElement>) {
    if (!isActivePointer(event)) {
      return;
    }

    const disposition = dragXRef.current < 0 ? 'interested' : 'removed';

    if (Math.abs(dragXRef.current) < SWIPE_THRESHOLD_PX) {
      resetDrag();
      return;
    }

    setIsRemoving(true);
    const removed = await onMarkNotSeen(disposition);
    setIsRemoving(false);
    resetDrag();

    if (!removed) {
      return;
    }
  }

  function handleClick() {
    if (Math.abs(dragX) > 12 || isRemoving) {
      return;
    }

    onOpenHistory();
  }

  return (
    <li className="ranking-row">
      <div
        className={getRankingRowHintClassName(isSwipeHintVisible, swipeDisposition, isDismissReady)}
        aria-hidden="true"
      >
        <span>{getRankingSwipeLabel(canMarkNotSeen, swipeDisposition)}</span>
      </div>
      <button
        ref={buttonRef}
        type="button"
        className={getRankingRowButtonClassName(isPointerDown, swipeDisposition, isDismissReady)}
        style={getRankingRowStyle(dragX)}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        aria-label={`Open fight history for ${item.label}`}
      >
        <span className="ranking-row__rank">{rank}</span>
        <img className="ranking-row__poster" src={item.imageSrc} alt="" />
        <span className="ranking-row__main">
          <span className="ranking-row__title">{item.label}</span>
          <span className="ranking-row__meta">
            {item.year} - {state.rating} pts
          </span>
        </span>
        <span className={`ranking-row__tier ranking-row__tier--${tier}`}>{tier}</span>
      </button>
    </li>
  );
}
