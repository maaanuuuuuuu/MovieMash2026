import { frozenFilms } from './films';
import type { Film } from '../modules/content/types';

const defaultActionFilmIds = [
  'raiders-of-the-lost-ark',
  'terminator',
  'aliens',
  'die-hard',
  'terminator-2',
  'saving-private-ryan',
  'matrix',
  'gladiator',
  'lord-of-the-rings-two-towers',
  'oldboy',
  'batman-begins',
  'dark-knight',
  'inception',
  'snowpiercer',
  'mad-max-fury-road',
  'dune-2021',
  'top-gun-maverick',
  'dune-part-two',
  'heat',
  'crouching-tiger-hidden-dragon',
  'children-of-men',
  'raid',
] as const;

const additionalActionFilms: Film[] = [
  {
    id: 'predator',
    title: 'Predator',
    year: 1987,
    posterPath: 'posters/predator.jpg',
  },
  {
    id: 'police-story',
    title: 'Police Story',
    year: 1985,
    posterPath: 'posters/police-story.jpg',
  },
  {
    id: 'robocop',
    title: 'RoboCop',
    year: 1987,
    posterPath: 'posters/robocop.jpg',
  },
  {
    id: 'lethal-weapon',
    title: 'Lethal Weapon',
    year: 1987,
    posterPath: 'posters/lethal-weapon.jpg',
  },
  {
    id: 'the-killer',
    title: 'The Killer',
    year: 1989,
    posterPath: 'posters/the-killer.jpg',
  },
  {
    id: 'hard-boiled',
    title: 'Hard Boiled',
    year: 1992,
    posterPath: 'posters/hard-boiled.jpg',
  },
  {
    id: 'total-recall',
    title: 'Total Recall',
    year: 1990,
    posterPath: 'posters/total-recall.jpg',
  },
  {
    id: 'point-break',
    title: 'Point Break',
    year: 1991,
    posterPath: 'posters/point-break.jpg',
  },
  {
    id: 'speed',
    title: 'Speed',
    year: 1994,
    posterPath: 'posters/speed.jpg',
  },
  {
    id: 'true-lies',
    title: 'True Lies',
    year: 1994,
    posterPath: 'posters/true-lies.jpg',
  },
  {
    id: 'the-rock',
    title: 'The Rock',
    year: 1996,
    posterPath: 'posters/the-rock.jpg',
  },
  {
    id: 'face-off',
    title: 'Face/Off',
    year: 1997,
    posterPath: 'posters/face-off.jpg',
  },
  {
    id: 'blade',
    title: 'Blade',
    year: 1998,
    posterPath: 'posters/blade.jpg',
  },
  {
    id: 'casino-royale',
    title: 'Casino Royale',
    year: 2006,
    posterPath: 'posters/casino-royale.jpg',
  },
  {
    id: 'district-b13',
    title: 'District B13',
    year: 2004,
    posterPath: 'posters/district-b13.jpg',
  },
  {
    id: 'john-wick',
    title: 'John Wick',
    year: 2014,
    posterPath: 'posters/john-wick.jpg',
  },
  {
    id: 'the-raid-2',
    title: 'The Raid 2',
    year: 2014,
    posterPath: 'posters/the-raid-2.jpg',
  },
  {
    id: 'mission-impossible-fallout',
    title: 'Mission: Impossible – Fallout',
    year: 2018,
    posterPath: 'posters/mission-impossible-fallout.jpg',
  },
  {
    id: 'john-wick-chapter-4',
    title: 'John Wick: Chapter 4',
    year: 2023,
    posterPath: 'posters/john-wick-chapter-4.jpg',
  },
];

function getDefaultActionFilm(id: (typeof defaultActionFilmIds)[number]) {
  const film = frozenFilms.find((candidate) => candidate.id === id);

  if (!film) {
    throw new Error(`Missing action film in the default catalog: ${id}`);
  }

  return film;
}

export const actionFilms: Film[] = [...defaultActionFilmIds.map(getDefaultActionFilm), ...additionalActionFilms];
