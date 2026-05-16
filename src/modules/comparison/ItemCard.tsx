import type { ItemId, NotSeenDisposition } from '../../domain/item';
import type { FilmItem } from '../content/types';
import { PreviewItemCard } from './PreviewItemCard';
import { type DismissDirection, useDismissDrag } from './useDismissDrag';

type ItemCardProps = {
  item: FilmItem;
  previewItem?: FilmItem;
  side: 'left' | 'right';
  onChoose: () => void;
  onNotSeen: (itemId: ItemId, disposition: NotSeenDisposition) => void;
  onInteractionChange: (active: boolean) => void;
};

function dispositionForDirection(direction: DismissDirection): NotSeenDisposition {
  return direction === 'up' ? 'interested' : 'removed';
}

function labelForDisposition(disposition: NotSeenDisposition | undefined) {
  if (disposition === 'interested') {
    return 'Interested';
  }

  if (disposition === 'removed') {
    return 'Remove';
  }

  return '';
}

export function ItemCard({
  item,
  previewItem,
  side,
  onChoose,
  onNotSeen,
  onInteractionChange,
}: ItemCardProps) {
  const drag = useDismissDrag((direction) => onNotSeen(item.id, dispositionForDirection(direction)), onInteractionChange);
  const dragDisposition = drag.direction ? dispositionForDirection(drag.direction) : undefined;
  const cardClass = [
    'item-card',
    `item-card--${side}`,
    drag.isDragging ? 'item-card--dragging' : '',
    drag.isReturning ? 'item-card--returning' : '',
    dragDisposition ? `item-card--${dragDisposition}` : '',
    drag.dismissReady ? 'item-card--dismiss-ready' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const stackClass = ['item-card-stack', drag.isDragging ? 'item-card-stack--revealing' : '']
    .filter(Boolean)
    .join(' ');

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
          className={[
            'item-card__swipe-hint',
            dragDisposition ? `item-card__swipe-hint--${dragDisposition}` : '',
            drag.dismissReady ? 'item-card__swipe-hint--ready' : '',
          ]
            .filter(Boolean)
            .join(' ')}
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
