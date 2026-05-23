import type { ComparisonRecord } from '../persistence/db';
import type { FilmItem } from '../content/types';
import './FightHistoryModal.css';
import { getFightHistoryEntry, pointsLabel } from './FightHistoryModal.utils';

type FightHistoryModalProps = {
  item: FilmItem;
  records: ComparisonRecord[];
  itemById: Map<string, FilmItem>;
  socialProofLines: string[];
  socialProofLoading: boolean;
  onClose: () => void;
};

export function FightHistoryModal({
  item,
  records,
  itemById,
  socialProofLines,
  socialProofLoading,
  onClose,
}: FightHistoryModalProps) {
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
        {socialProofLines.length > 0 ? (
          <section className="fight-modal__social-proof" aria-label="Friend interest signals">
            <p className="eyebrow">Friends ranked this high</p>
            <ul className="fight-modal__social-proof-list">
              {socialProofLines.map((line) => (
                <li key={line} className="fight-modal__social-proof-line">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ) : socialProofLoading ? (
          <p className="fight-modal__social-proof-loading">Checking followed rankings...</p>
        ) : null}

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
