import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { NotSeenDisposition } from '../../domain/item';
import { GLOBAL_FILM_SCOPE_ID, filmItemById, filmItems, filmItemsByFilterId, type FilmFilter } from '../content/filmSource';
import { listRankingStates, restoreRankingItem } from '../persistence/rankingRepository';

type SavedMoviesPageProps = {
  filter: FilmFilter;
};

const savedViews: { id: NotSeenDisposition; label: string }[] = [
  { id: 'interested', label: 'Interested' },
  { id: 'removed', label: 'Removed' },
];

function messageForRestore(label: string) {
  return `${label} restored`;
}

export function SavedMoviesPage({ filter }: SavedMoviesPageProps) {
  const [activeView, setActiveView] = useState<NotSeenDisposition>('interested');
  const [message, setMessage] = useState<string | undefined>();
  const items = filmItemsByFilterId[filter.id];
  const allItemIds = useMemo(() => filmItems.map((item) => item.id), []);
  const filterItemIds = useMemo(() => items.map((item) => item.id), [items]);
  const filterItemIdSet = useMemo(() => new Set(filterItemIds), [filterItemIds]);
  const states = useLiveQuery(() => listRankingStates(GLOBAL_FILM_SCOPE_ID, allItemIds), [allItemIds], []);
  const savedRows = states
    .filter((state) => filterItemIdSet.has(state.itemId))
    .filter((state) => state.notSeenDisposition === activeView)
    .sort((first, second) => second.updatedAt - first.updatedAt || first.itemId.localeCompare(second.itemId));

  async function handleRestore(itemId: string, itemLabel: string) {
    const result = await restoreRankingItem(GLOBAL_FILM_SCOPE_ID, itemId);

    if (result.applied) {
      setMessage(messageForRestore(itemLabel));
      return;
    }

    setMessage('Could not restore this movie');
  }

  return (
    <main className="saved-page">
      <header className="saved-page__header">
        <Link
          to={filter.rankingPath}
          className="ranking-page__back"
          aria-label="Back to ranking"
          title="Back to ranking"
        >
          <ArrowLeft aria-hidden="true" size={23} />
        </Link>
        <div>
          <p className="eyebrow">{filter.eyebrow}</p>
          <h1>Saved movies</h1>
          {message ? <p className="ranking-page__message">{message}</p> : null}
        </div>
      </header>

      <div className="saved-page__tabs" role="tablist" aria-label="Saved movie state">
        {savedViews.map((view) => {
          const count = states.filter(
            (state) => filterItemIdSet.has(state.itemId) && state.notSeenDisposition === view.id,
          ).length;

          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              className={activeView === view.id ? 'saved-page__tab saved-page__tab--active' : 'saved-page__tab'}
              onClick={() => setActiveView(view.id)}
            >
              {view.label}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {savedRows.length === 0 ? (
        <p className="saved-page__empty">No movies here yet.</p>
      ) : (
        <ol className="saved-page__list" aria-label={`${activeView} movies`}>
          {savedRows.map((state) => {
            const item = filmItemById.get(state.itemId);

            if (!item) {
              return null;
            }

            return (
              <li key={state.itemId} className="saved-page__row">
                <img className="saved-page__poster" src={item.imageSrc} alt="" />
                <span className="saved-page__main">
                  <span className="saved-page__title">{item.label}</span>
                  <span className="saved-page__meta">{item.year}</span>
                </span>
                <button
                  type="button"
                  className="saved-page__restore"
                  onClick={() => {
                    void handleRestore(item.id, item.label);
                  }}
                >
                  <RotateCcw aria-hidden="true" size={17} />
                  Restore
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
