import '../comparison/ItemCard.css';
import '../comparison/ItemCard.responsive.css';
import type { FilmItem } from '../content/types';
import { PreviewItemCard } from '../comparison/PreviewItemCard';

type CompetitionItemCardProps = {
  item: FilmItem;
  previewItem?: FilmItem;
  side: 'left' | 'right';
  onChoose: () => void;
  onInteractionChange: (active: boolean) => void;
};

export function CompetitionItemCard({
  item,
  previewItem,
  side,
  onChoose,
  onInteractionChange,
}: CompetitionItemCardProps) {
  return (
    <div className="item-card-stack">
      {previewItem ? <PreviewItemCard item={previewItem} /> : null}
      <button
        type="button"
        className={`item-card item-card--${side}`}
        onClick={onChoose}
        onPointerDown={() => onInteractionChange(true)}
        onPointerUp={() => onInteractionChange(false)}
        onPointerCancel={() => onInteractionChange(false)}
        onPointerLeave={() => onInteractionChange(false)}
        aria-label={`Choose ${item.label}`}
      >
        <span className="item-card__poster-wrap">
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
