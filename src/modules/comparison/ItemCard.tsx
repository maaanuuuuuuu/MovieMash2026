import type { ItemId } from '../../domain/item';
import type { FilmItem } from '../content/types';
import { PreviewItemCard } from './PreviewItemCard';
import { useDismissDrag } from './useDismissDrag';

type ItemCardProps = {
  item: FilmItem;
  previewItem?: FilmItem;
  side: 'left' | 'right';
  onChoose: () => void;
  onNotSeen: (itemId: ItemId) => void;
  onInteractionChange: (active: boolean) => void;
};

export function ItemCard({
  item,
  previewItem,
  side,
  onChoose,
  onNotSeen,
  onInteractionChange,
}: ItemCardProps) {
  const drag = useDismissDrag(() => onNotSeen(item.id), onInteractionChange);
  const cardClass = [
    'item-card',
    `item-card--${side}`,
    drag.isDragging ? 'item-card--dragging' : '',
    drag.isReturning ? 'item-card--returning' : '',
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
