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
export type FilmFilterId = 'all' | CoveringFilmFilterGenre;

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

function getGenreFilmFilter(genre: CoveringFilmFilterGenre) {
  const filter = genreFilmFilters.find((candidate) => candidate.id === genre);

  if (!filter) {
    throw new Error(`Missing film filter for genre ${genre}`);
  }

  return filter;
}

export const actionFilmFilter = getGenreFilmFilter('action');
export const comedyFilmFilter = getGenreFilmFilter('comedy');
export const filmFilters = [allFilmFilter, ...genreFilmFilters];

export const filmItems = toFilmItems(allFilms);
export const allFilmItems = filmItems;
export const genreFilmItemsByFilterId = Object.fromEntries(
  COVERING_FILM_FILTER_GENRES.map((genre) => [genre, toFilmItems(genreFilmsByFilterId[genre])]),
) as Record<CoveringFilmFilterGenre, FilmItem[]>;
export const actionFilmItems = genreFilmItemsByFilterId.action;
export const comedyFilmItems = genreFilmItemsByFilterId.comedy;

export const filmItemsByFilterId = {
  all: filmItems,
  ...genreFilmItemsByFilterId,
} satisfies Record<FilmFilterId, FilmItem[]>;

export const filmItemById = new Map(allFilmItems.map((item) => [item.id, item]));
export const offlineFilmAssetUrls = allFilmItems.map((item) => item.imageSrc);
