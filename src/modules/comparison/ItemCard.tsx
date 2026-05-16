import type { ItemId, NotSeenDisposition } from '../../domain/item';
import './ItemCard.css';
import './ItemCard.responsive.css';
import type { FilmItem } from '../content/types';
import {
  dispositionForDirection,
  getItemCardClassName,
  getItemCardStackClassName,
  getItemCardSwipeHintClassName,
  labelForDisposition,
} from './ItemCard.utils';
import type { MatchSwipeZoneState } from './MatchSwipeZones';
import { PreviewItemCard } from './PreviewItemCard';
import { useDismissDrag } from './useDismissDrag';

type ItemCardProps = {
  item: FilmItem;
  previewItem?: FilmItem;
  side: 'left' | 'right';
  onChoose: () => void;
  onNotSeen: (itemId: ItemId, disposition: NotSeenDisposition) => void;
  onInteractionChange: (active: boolean) => void;
  onSwipeZoneChange: (state: MatchSwipeZoneState | undefined) => void;
};

export function ItemCard({
  item,
  previewItem,
  side,
  onChoose,
  onNotSeen,
  onInteractionChange,
  onSwipeZoneChange,
}: ItemCardProps) {
  const drag = useDismissDrag(
    (direction) => onNotSeen(item.id, dispositionForDirection(direction)),
    onInteractionChange,
    (state) =>
      onSwipeZoneChange(
        state
          ? {
              disposition: state.direction ? dispositionForDirection(state.direction) : undefined,
              ready: state.ready,
            }
          : undefined,
      ),
  );
  const dragDisposition = drag.direction ? dispositionForDirection(drag.direction) : undefined;
  const cardClass = getItemCardClassName(side, drag.isDragging, drag.isReturning, dragDisposition, drag.dismissReady);
  const stackClass = getItemCardStackClassName(drag.isDragging);

  function handleClick() {
    if (drag.shouldIgnoreClick()) {
      return;
    }

    onChoose();
  }

  return (
    <div className={stackClass}>
      {previewItem ? <PreviewItemCard item={previewItem} /> : null}
      <button
        type="button"
        className={cardClass}
        style={drag.style}
        onClick={handleClick}
        aria-label={`Choose ${item.label}`}
      >
        <span
          className={getItemCardSwipeHintClassName(dragDisposition, drag.dismissReady)}
          aria-hidden="true"
        >
          {labelForDisposition(dragDisposition)}
        </span>
        <span className="item-card__poster-wrap" {...drag.pointerHandlers}>
          <img className="item-card__poster" src={item.imageSrc} alt="" draggable="false" />
        </span>
        <span className="item-card__text">
          <span className="item-card__title">{item.label}</span>
          <span className="item-card__year">{item.year}</span>
        </span>
      </button>
    </div>
  );
}
