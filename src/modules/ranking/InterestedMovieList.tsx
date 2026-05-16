import { Lightbulb, RotateCcw } from 'lucide-react';
import type { RankingItemState } from '../../domain/item';
import type { FilmItem } from '../content/types';
import './InterestedMovieList.css';

type InterestedMovieListProps = {
  rows: RankingItemState[];
  itemById: ReadonlyMap<string, FilmItem>;
  onRestore: (itemId: string, itemLabel: string) => void;
};

export function InterestedMovieList({ rows, itemById, onRestore }: InterestedMovieListProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="interested-movie-list" aria-labelledby="interested-movie-list-heading">
      <div className="interested-movie-list__header">
        <span className="interested-movie-list__icon">
          <Lightbulb aria-hidden="true" size={21} strokeWidth={2.5} />
        </span>
        <div>
          <h2 id="interested-movie-list-heading">Interested</h2>
          <p>{rows.length} saved for later</p>
        </div>
      </div>
      <ol className="interested-movie-list__rows" aria-label="Interested movies">
        {rows.map((state) => {
          const item = itemById.get(state.itemId);

          if (!item) {
            return null;
          }

          return (
            <li key={state.itemId} className="interested-movie-list__row">
              <img className="interested-movie-list__poster" src={item.imageSrc} alt="" />
              <span className="interested-movie-list__main">
                <span className="interested-movie-list__title">{item.label}</span>
                <span className="interested-movie-list__meta">{item.year}</span>
              </span>
              <button
                type="button"
                className="interested-movie-list__restore"
                onClick={() => onRestore(item.id, item.label)}
                aria-label={`Restore ${item.label}`}
              >
                <RotateCcw aria-hidden="true" size={16} />
                Restore
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
