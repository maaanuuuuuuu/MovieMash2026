import { Check, ChevronDown, ListFilter, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './FilmFilterSwitch.css';
import { filmFilters, type FilmFilter } from './filmSource';

export type FilmFilterSwitchView = 'comparison' | 'ranking' | 'saved';

type FilmFilterSwitchProps = {
  activeFilter: FilmFilter;
  view: FilmFilterSwitchView;
};

function getFilterPath(filter: FilmFilter, view: FilmFilterSwitchView) {
  switch (view) {
    case 'comparison':
      return filter.comparisonPath;
    case 'ranking':
      return filter.rankingPath;
    case 'saved':
      return filter.savedPath;
    default:
      return view satisfies never;
  }
}

function getMovieCountLabel(count: number) {
  return `${count} movie${count === 1 ? '' : 's'}`;
}

export function FilmFilterSwitch({ activeFilter, view }: FilmFilterSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const panelTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Let keyboard users close the open filter menu without moving focus away.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <nav className="film-filter-switch" aria-label="Movie filter">
      <button
        ref={triggerRef}
        type="button"
        className="film-filter-switch__trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`Change movie filter. Current filter: ${activeFilter.shortLabel}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="film-filter-switch__trigger-icon">
          <ListFilter aria-hidden="true" size={18} />
        </span>
        <span className="film-filter-switch__current">
          <span className="film-filter-switch__current-label">Filter</span>
          <span className="film-filter-switch__current-value">{activeFilter.shortLabel}</span>
        </span>
        <span className="film-filter-switch__current-count">{getMovieCountLabel(activeFilter.films.length)}</span>
        <ChevronDown
          aria-hidden="true"
          className={isOpen ? 'film-filter-switch__chevron film-filter-switch__chevron--open' : 'film-filter-switch__chevron'}
          size={18}
        />
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className="film-filter-switch__backdrop"
            aria-label="Close filter overlay"
            onClick={() => setIsOpen(false)}
          />
          <div
            id={panelId}
            className="film-filter-switch__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={panelTitleId}
          >
            <div className="film-filter-switch__panel-header">
              <h2 id={panelTitleId}>Filter movies</h2>
              <span>{activeFilter.shortLabel}</span>
              <button
                type="button"
                className="film-filter-switch__close"
                aria-label="Close movie filters"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="film-filter-switch__options">
              {filmFilters.map((availableFilter) => {
                const isActive = availableFilter.id === activeFilter.id;

                return (
                  <Link
                    key={availableFilter.id}
                    to={getFilterPath(availableFilter, view)}
                    aria-label={`${availableFilter.shortLabel}, ${getMovieCountLabel(availableFilter.films.length)}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      isActive
                        ? 'film-filter-switch__option film-filter-switch__option--active'
                        : 'film-filter-switch__option'
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="film-filter-switch__option-main">
                      <span className="film-filter-switch__option-label">{availableFilter.shortLabel}</span>
                      <span className="film-filter-switch__option-count">
                        {getMovieCountLabel(availableFilter.films.length)}
                      </span>
                    </span>
                    {isActive ? <Check aria-hidden="true" size={18} /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </nav>
  );
}
