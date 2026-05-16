import { frozenFilms } from '../../data/films';
import type { Film, FilmGenre, FilmItem } from './types';

const basePath = import.meta.env.BASE_URL;

export const GLOBAL_FILM_SCOPE_ID = 'default';

export type FilmFilterId = 'all' | 'action' | 'comedy';

export type FilmFilter = {
  id: FilmFilterId;
  title: string;
  shortLabel: string;
  eyebrow: string;
  comparisonPath: string;
  rankingPath: string;
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

export const allFilms = frozenFilms;
export const actionFilms = filmsWithGenre('action');
export const comedyFilms = filmsWithGenre('comedy');

export const allFilmFilter: FilmFilter = {
  id: 'all',
  title: 'All movies',
  shortLabel: 'All',
  eyebrow: 'Global ranking',
  comparisonPath: '/',
  rankingPath: '/ranking',
  films: allFilms,
};

export const actionFilmFilter: FilmFilter = {
  id: 'action',
  title: 'Action movies',
  shortLabel: 'Action',
  eyebrow: 'Action filter',
  comparisonPath: '/action',
  rankingPath: '/action/ranking',
  films: actionFilms,
};

export const comedyFilmFilter: FilmFilter = {
  id: 'comedy',
  title: 'Comedy movies',
  shortLabel: 'Comedy',
  eyebrow: 'Comedy filter',
  comparisonPath: '/comedy',
  rankingPath: '/comedy/ranking',
  films: comedyFilms,
};

export const filmFilters = [allFilmFilter, actionFilmFilter, comedyFilmFilter] as const;

export const filmItems = toFilmItems(allFilms);
export const actionFilmItems = toFilmItems(actionFilms);
export const comedyFilmItems = toFilmItems(comedyFilms);
export const allFilmItems = filmItems;

export const filmItemsByFilterId = {
  all: filmItems,
  action: actionFilmItems,
  comedy: comedyFilmItems,
} satisfies Record<FilmFilterId, FilmItem[]>;

export const filmItemById = new Map(allFilmItems.map((item) => [item.id, item]));
export const offlineFilmAssetUrls = allFilmItems.map((item) => item.imageSrc);
