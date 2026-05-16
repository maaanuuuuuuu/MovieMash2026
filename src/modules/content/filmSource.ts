import { actionFilms } from '../../data/actionFilms';
import { comedyFilms } from '../../data/comedyFilms';
import { frozenFilms } from '../../data/films';
import type { Film, FilmItem } from './types';

const basePath = import.meta.env.BASE_URL;

export type FilmCatalogId = 'default' | 'action' | 'comedy';

export type FilmCatalog = {
  id: FilmCatalogId;
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
  }));
}

export const defaultFilmCatalog: FilmCatalog = {
  id: 'default',
  title: 'Default movies',
  shortLabel: 'Default',
  eyebrow: 'Full catalog',
  comparisonPath: '/',
  rankingPath: '/ranking',
  films: frozenFilms,
};

export const actionFilmCatalog: FilmCatalog = {
  id: 'action',
  title: 'Pure action movies',
  shortLabel: 'Action',
  eyebrow: 'Action cut',
  comparisonPath: '/action',
  rankingPath: '/action/ranking',
  films: actionFilms,
};

export const comedyFilmCatalog: FilmCatalog = {
  id: 'comedy',
  title: 'Comedy movies',
  shortLabel: 'Comedy',
  eyebrow: 'Comedy cut',
  comparisonPath: '/comedy',
  rankingPath: '/comedy/ranking',
  films: comedyFilms,
};

export const filmCatalogs = [defaultFilmCatalog, actionFilmCatalog, comedyFilmCatalog] as const;

export const filmItems = toFilmItems(frozenFilms);
export const actionFilmItems = toFilmItems(actionFilms);
export const comedyFilmItems = toFilmItems(comedyFilms);
export const allFilmItems = toFilmItems([...frozenFilms, ...actionFilms, ...comedyFilms]);

export const filmItemsByCatalogId = {
  default: filmItems,
  action: actionFilmItems,
  comedy: comedyFilmItems,
} satisfies Record<FilmCatalogId, FilmItem[]>;

export const filmItemById = new Map(allFilmItems.map((item) => [item.id, item]));
export const offlineFilmAssetUrls = allFilmItems.map((item) => item.imageSrc);
