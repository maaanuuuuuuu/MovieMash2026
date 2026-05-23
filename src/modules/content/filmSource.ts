import { frozenFilms } from '../../data/films';
import type { Film, FilmGenre, FilmItem } from './types';

const basePath = import.meta.env.BASE_URL;

export const GLOBAL_FILM_SCOPE_ID = 'default';

export const COVERING_FILM_FILTER_GENRES = [
  'action',
  'adventure',
  'animation',
  'comedy',
  'drama',
  'horror',
  'science-fiction',
  'thriller',
  'war',
  'western',
] as const satisfies readonly FilmGenre[];

export type CoveringFilmFilterGenre = (typeof COVERING_FILM_FILTER_GENRES)[number];
export const EXPOSED_DECADE_FILTER_STARTS = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;

export type ExposedDecadeFilterStart = (typeof EXPOSED_DECADE_FILTER_STARTS)[number];
export type DecadeFilmFilterId = `${ExposedDecadeFilterStart}s`;
export type FilmFilterId = 'all' | CoveringFilmFilterGenre | DecadeFilmFilterId;

export type FilmFilter = {
  id: FilmFilterId;
  title: string;
  shortLabel: string;
  eyebrow: string;
  comparisonPath: string;
  rankingPath: string;
  savedPath: string;
  films: Film[];
};

function toFilmItems(films: Film[]): FilmItem[] {
  return films.map((film) => ({
    id: film.id,
    category: 'film',
    label: film.title,
    subtitle: String(film.year),
    imageSrc: `${basePath}${film.posterPath}`,
    posterPath: film.posterPath,
    year: film.year,
    genres: film.genres,
  }));
}

function filmsWithGenre(genre: FilmGenre) {
  return frozenFilms.filter((film) => film.genres.includes(genre));
}

function filmsWithDecadeStart(decadeStart: ExposedDecadeFilterStart) {
  return frozenFilms.filter((film) => Math.floor(film.year / 10) * 10 === decadeStart);
}

function getGenreLabel(genre: CoveringFilmFilterGenre) {
  if (genre === 'science-fiction') {
    return 'Science Fiction';
  }

  return genre
    .split('-')
    .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
    .join(' ');
}

function createGenreFilter(genre: CoveringFilmFilterGenre): FilmFilter {
  const label = getGenreLabel(genre);
  const comparisonPath = `/${genre}`;

  return {
    id: genre,
    title: `${label} movies`,
    shortLabel: label,
    eyebrow: `${label} filter`,
    comparisonPath,
    rankingPath: `${comparisonPath}/ranking`,
    savedPath: `${comparisonPath}/saved`,
    films: filmsWithGenre(genre),
  };
}

function createDecadeFilter(decadeStart: ExposedDecadeFilterStart): FilmFilter {
  const label = `${decadeStart}s` as DecadeFilmFilterId;
  const comparisonPath = `/${label}`;

  return {
    id: label,
    title: `${label} movies`,
    shortLabel: label,
    eyebrow: `${label} filter`,
    comparisonPath,
    rankingPath: `${comparisonPath}/ranking`,
    savedPath: `${comparisonPath}/saved`,
    films: filmsWithDecadeStart(decadeStart),
  };
}

export const allFilms = frozenFilms;
export const genreFilmsByFilterId = Object.fromEntries(
  COVERING_FILM_FILTER_GENRES.map((genre) => [genre, filmsWithGenre(genre)]),
) as Record<CoveringFilmFilterGenre, Film[]>;
export const actionFilms = genreFilmsByFilterId.action;
export const comedyFilms = genreFilmsByFilterId.comedy;

export const allFilmFilter: FilmFilter = {
  id: 'all',
  title: 'All movies',
  shortLabel: 'All',
  eyebrow: 'Global ranking',
  comparisonPath: '/',
  rankingPath: '/ranking',
  savedPath: '/saved',
  films: allFilms,
};

export const genreFilmFilters = COVERING_FILM_FILTER_GENRES.map(createGenreFilter);
export const decadeFilmFilters = EXPOSED_DECADE_FILTER_STARTS.map(createDecadeFilter);

function getGenreFilmFilter(genre: CoveringFilmFilterGenre) {
  const filter = genreFilmFilters.find((candidate) => candidate.id === genre);

  if (!filter) {
    throw new Error(`Missing film filter for genre ${genre}`);
  }

  return filter;
}

export const actionFilmFilter = getGenreFilmFilter('action');
export const comedyFilmFilter = getGenreFilmFilter('comedy');
export const filmFilters = [allFilmFilter, ...genreFilmFilters, ...decadeFilmFilters];
export const filmFilterById = new Map(filmFilters.map((filter) => [filter.id, filter]));

export const filmItems = toFilmItems(allFilms);
export const allFilmItems = filmItems;
export const genreFilmItemsByFilterId = Object.fromEntries(
  COVERING_FILM_FILTER_GENRES.map((genre) => [genre, toFilmItems(genreFilmsByFilterId[genre])]),
) as Record<CoveringFilmFilterGenre, FilmItem[]>;
export const decadeFilmItemsByFilterId = Object.fromEntries(
  EXPOSED_DECADE_FILTER_STARTS.map((decadeStart) => {
    const filterId = `${decadeStart}s` as DecadeFilmFilterId;

    return [filterId, toFilmItems(filmsWithDecadeStart(decadeStart))];
  }),
) as Record<DecadeFilmFilterId, FilmItem[]>;
export const actionFilmItems = genreFilmItemsByFilterId.action;
export const comedyFilmItems = genreFilmItemsByFilterId.comedy;

export const filmItemsByFilterId = {
  all: filmItems,
  ...genreFilmItemsByFilterId,
  ...decadeFilmItemsByFilterId,
} satisfies Record<FilmFilterId, FilmItem[]>;

export const filmItemById = new Map(allFilmItems.map((item) => [item.id, item]));
export const offlineFilmAssetUrls = allFilmItems.map((item) => item.imageSrc);
