import { frozenFilms } from './films';
import type { Film } from '../modules/content/types';

const defaultComedyFilmIds = [
  'back-to-the-future',
  'breakfast-club',
  'ferris-bueller',
  'princess-bride',
  'when-harry-met-sally',
  'groundhog-day',
  'toy-story',
  'fargo',
  'truman-show',
  'amelie',
  'incredibles',
  'ratatouille',
  'up',
  'bridesmaids',
  'grand-budapest-hotel',
  'inside-out',
  'spider-verse',
  'knives-out',
  'soul',
  'everything-everywhere',
  'barbie',
  'big-lebowski',
  'shaun-of-the-dead',
  'a-bug-s-life',
  'toy-story-2',
  'monsters-inc',
  'cars',
  'toy-story-3',
  'cars-2',
  'monsters-university',
  'finding-dory',
  'cars-3',
  'coco',
  'incredibles-2',
  'toy-story-4',
  'onward',
  'luca',
  'turning-red',
  'inside-out-2',
  'the-great-mouse-detective',
  'oliver-and-company',
  'aladdin',
  'hercules',
  'mulan',
  'the-emperor-s-new-groove',
  'lilo-and-stitch',
  'home-on-the-range',
  'chicken-little',
  'meet-the-robinsons',
  'bolt',
  'tangled',
  'winnie-the-pooh',
  'wreck-it-ralph',
  'frozen',
] as const;

const additionalComedyFilms: Film[] = [
  {
    id: 'some-like-it-hot',
    title: 'Some Like It Hot',
    year: 1959,
    posterPath: 'posters/some-like-it-hot.jpg',
  },
  {
    id: 'dr-strangelove',
    title: 'Dr. Strangelove',
    year: 1964,
    posterPath: 'posters/dr-strangelove.jpg',
  },
  {
    id: 'monty-python-holy-grail',
    title: 'Monty Python and the Holy Grail',
    year: 1975,
    posterPath: 'posters/monty-python-holy-grail.jpg',
  },
  {
    id: 'life-of-brian',
    title: 'Life of Brian',
    year: 1979,
    posterPath: 'posters/life-of-brian.jpg',
  },
  {
    id: 'airplane',
    title: 'Airplane!',
    year: 1980,
    posterPath: 'posters/airplane.jpg',
  },
  {
    id: 'this-is-spinal-tap',
    title: 'This Is Spinal Tap',
    year: 1984,
    posterPath: 'posters/this-is-spinal-tap.jpg',
  },
  {
    id: 'ghostbusters',
    title: 'Ghostbusters',
    year: 1984,
    posterPath: 'posters/ghostbusters.jpg',
  },
  {
    id: 'coming-to-america',
    title: 'Coming to America',
    year: 1988,
    posterPath: 'posters/coming-to-america.jpg',
  },
  {
    id: 'dumb-and-dumber',
    title: 'Dumb and Dumber',
    year: 1994,
    posterPath: 'posters/dumb-and-dumber.jpg',
  },
  {
    id: 'the-mask',
    title: 'The Mask',
    year: 1994,
    posterPath: 'posters/the-mask.jpg',
  },
  {
    id: 'clueless',
    title: 'Clueless',
    year: 1995,
    posterPath: 'posters/clueless.jpg',
  },
  {
    id: 'theres-something-about-mary',
    title: "There's Something About Mary",
    year: 1998,
    posterPath: 'posters/theres-something-about-mary.jpg',
  },
  {
    id: 'office-space',
    title: 'Office Space',
    year: 1999,
    posterPath: 'posters/office-space.jpg',
  },
  {
    id: 'anchorman',
    title: 'Anchorman: The Legend of Ron Burgundy',
    year: 2004,
    posterPath: 'posters/anchorman.jpg',
  },
  {
    id: 'mean-girls',
    title: 'Mean Girls',
    year: 2004,
    posterPath: 'posters/mean-girls.jpg',
  },
  {
    id: 'borat',
    title: 'Borat',
    year: 2006,
    posterPath: 'posters/borat.jpg',
  },
  {
    id: 'hot-fuzz',
    title: 'Hot Fuzz',
    year: 2007,
    posterPath: 'posters/hot-fuzz.jpg',
  },
  {
    id: 'superbad',
    title: 'Superbad',
    year: 2007,
    posterPath: 'posters/superbad.jpg',
  },
  {
    id: 'the-hangover',
    title: 'The Hangover',
    year: 2009,
    posterPath: 'posters/the-hangover.jpg',
  },
  {
    id: 'four-lions',
    title: 'Four Lions',
    year: 2010,
    posterPath: 'posters/four-lions.jpg',
  },
  {
    id: 'what-we-do-in-the-shadows',
    title: 'What We Do in the Shadows',
    year: 2014,
    posterPath: 'posters/what-we-do-in-the-shadows.jpg',
  },
  {
    id: 'booksmart',
    title: 'Booksmart',
    year: 2019,
    posterPath: 'posters/booksmart.jpg',
  },
  {
    id: 'palm-springs',
    title: 'Palm Springs',
    year: 2020,
    posterPath: 'posters/palm-springs.jpg',
  },
  {
    id: 'bottoms',
    title: 'Bottoms',
    year: 2023,
    posterPath: 'posters/bottoms.jpg',
  },
];

function getDefaultComedyFilm(id: (typeof defaultComedyFilmIds)[number]) {
  const film = frozenFilms.find((candidate) => candidate.id === id);

  if (!film) {
    throw new Error(`Missing comedy film in the default catalog: ${id}`);
  }

  return film;
}

export const comedyFilms: Film[] = [...defaultComedyFilmIds.map(getDefaultComedyFilm), ...additionalComedyFilms];
