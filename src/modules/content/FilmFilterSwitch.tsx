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

export function FilmFilterSwitch({ activeFilter, view }: FilmFilterSwitchProps) {
  return (
    <nav className="film-filter-switch" aria-label="Genre filter">
      {filmFilters.map((availableFilter) => (
        <Link
          key={availableFilter.id}
          to={getFilterPath(availableFilter, view)}
          className={
            availableFilter.id === activeFilter.id
              ? 'film-filter-switch__link film-filter-switch__link--active'
              : 'film-filter-switch__link'
          }
        >
          {availableFilter.shortLabel}
        </Link>
      ))}
    </nav>
  );
}
