import type { ComparableItem } from '../../domain/item';

export type FilmGenre =
  | 'action'
  | 'adventure'
  | 'animation'
  | 'comedy'
  | 'crime'
  | 'documentary'
  | 'drama'
  | 'family'
  | 'fantasy'
  | 'history'
  | 'horror'
  | 'music'
  | 'mystery'
  | 'romance'
  | 'science-fiction'
  | 'thriller'
  | 'tv-movie'
  | 'war'
  | 'western';

export type Film = {
  id: string;
  title: string;
  year: number;
  posterPath: string;
  genres: FilmGenre[];
};

export type FilmItem = ComparableItem<'film'> & {
  year: number;
  posterPath: string;
  genres: FilmGenre[];
};
