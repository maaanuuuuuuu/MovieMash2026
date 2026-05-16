import type { ComparisonRecord } from '../persistence/db';
import type { FilmItem } from '../content/types';

type FightHistoryModalProps = {
  item: FilmItem;
  records: ComparisonRecord[];
  itemById: Map<string, FilmItem>;
  onClose: () => void;
};

type FightHistoryEntry = {
  record: ComparisonRecord;
  text: string;
  change: NonNullable<ComparisonRecord['ratingChanges']>[number] | undefined;
};

function pointsLabel(delta: number) {
  return `${delta >= 0 ? '+' : ''}${delta} pts`;
}

function titleForItem(itemId: string, itemById: Map<string, FilmItem>) {
  return itemById.get(itemId)?.label ?? itemId;
}

function getFightHistoryEntry(
  record: ComparisonRecord,
  item: FilmItem,
  itemById: Map<string, FilmItem>,
): FightHistoryEntry | undefined {
  const change = record.ratingChanges?.find((ratingChange) => ratingChange.itemId === item.id);

  switch (record.outcomeType) {
    case 'winner':
      if (record.winnerId === item.id && record.loserId) {
        return {
          record,
          text: `${item.label} won against ${titleForItem(record.loserId, itemById)}`,
          change,
        };
      }

      if (record.loserId === item.id && record.winnerId) {
        return {
          record,
          text: `${item.label} lost to ${titleForItem(record.winnerId, itemById)}`,
          change,
        };
      }

      return undefined;
    case 'tie':
      if (record.leftId === item.id && record.rightId) {
        return {
          record,
          text: `${item.label} tied with ${titleForItem(record.rightId, itemById)}`,
          change,
        };
      }

      if (record.rightId === item.id && record.leftId) {
        return {
          record,
          text: `${item.label} tied with ${titleForItem(record.leftId, itemById)}`,
          change,
        };
      }

      return undefined;
    case 'notSeen':
      return undefined;
    default:
      return record.outcomeType satisfies never;
  }
}

export function FightHistoryModal({ item, records, itemById, onClose }: FightHistoryModalProps) {
  const fights = records
    .map((record) => getFightHistoryEntry(record, item, itemById))
    .filter((entry) => entry !== undefined)
    .sort((first, second) => second.record.createdAt - first.record.createdAt);

  return (
    <div className="fight-modal-backdrop" role="presentation">
      <section
        className="fight-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fight-modal-title"
      >
        <header className="fight-modal__header">
          <div>
            <p className="eyebrow">Fight history</p>
            <h2 id="fight-modal-title">{item.label}</h2>
          </div>
          <button type="button" className="fight-modal__close" onClick={onClose} aria-label="Close fight history">
            Close
          </button>
        </header>

        {fights.length === 0 ? (
          <p className="fight-modal__empty">No logged fights with point changes yet.</p>
        ) : (
          <ol className="fight-modal__list">
            {fights.map((fight) => {
              return (
                <li key={fight.record.id} className="fight-modal__row">
                  <span>{fight.text}</span>
                  <strong className={fight.change && fight.change.delta < 0 ? 'fight-modal__points--negative' : ''}>
                    {fight.change ? pointsLabel(fight.change.delta) : 'No point log'}
                  </strong>
                  {fight.change ? (
                    <small>
                      {fight.change.beforeRating} to {fight.change.afterRating}
                    </small>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <button
        type="button"
        className="fight-modal-backdrop__dismiss"
        onClick={onClose}
        aria-label="Close fight history from backdrop"
      />
    </div>
  );
}
