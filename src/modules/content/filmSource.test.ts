import { describe, expect, it } from 'vitest';
import {
  allFilmItems,
  COVERING_FILM_FILTER_GENRES,
  EXPOSED_DECADE_FILTER_STARTS,
  decadeFilmFilters,
  filmFilters,
  filmItems,
  filmItemsByFilterId,
  offlineFilmAssetUrls,
} from './filmSource';

describe('film filter sources', () => {
  it('keeps each filter mapped to its own route and item list', () => {
    for (const filter of filmFilters) {
      const items = filmItemsByFilterId[filter.id];
      const itemIds = items.map((item) => item.id);

      expect(items).toHaveLength(filter.films.length);
      expect(new Set(itemIds).size).toBe(items.length);
      expect(filter.comparisonPath).toMatch(/^\/($|[a-z0-9-]+$)/);
      expect(filter.rankingPath).toMatch(/^\/([a-z0-9-]+\/)?ranking$/);
      expect(filter.savedPath).toMatch(/^\/([a-z0-9-]+\/)?saved$/);
    }
  });

  it('keeps genre filter items in the global list', () => {
    const globalIds = new Set(filmItems.map((item) => item.id));

    for (const genre of COVERING_FILM_FILTER_GENRES) {
      for (const item of filmItemsByFilterId[genre]) {
        expect(globalIds.has(item.id)).toBe(true);
      }
    }
  });

  it('builds genre filters from film metadata', () => {
    for (const genre of COVERING_FILM_FILTER_GENRES) {
      expect(filmItemsByFilterId[genre].length).toBeGreaterThan(0);
      expect(filmItemsByFilterId[genre].every((item) => item.genres.includes(genre))).toBe(true);
    }

    expect(filmItemsByFilterId.comedy.find((item) => item.id === 'monsters-inc')?.genres).toEqual([
      'animation',
      'comedy',
      'family',
    ]);
  });

  it('builds decade filters from film years', () => {
    for (const decadeStart of EXPOSED_DECADE_FILTER_STARTS) {
      const filterId = `${decadeStart}s` as const;

      expect(filmItemsByFilterId[filterId].length).toBeGreaterThan(0);
      expect(
        filmItemsByFilterId[filterId].every((item) => Math.floor(item.year / 10) * 10 === decadeStart),
      ).toBe(true);
    }
  });

  it('covers every film with the exposed genre filters', () => {
    const coveredIds = new Set(COVERING_FILM_FILTER_GENRES.flatMap((genre) => filmItemsByFilterId[genre].map((item) => item.id)));
    const uncoveredFilms = allFilmItems
      .filter((item) => !coveredIds.has(item.id))
      .map((item) => ({ id: item.id, genres: item.genres }));

    expect(uncoveredFilms).toEqual([]);
  });

  it('keeps the science fiction filter routes stable', () => {
    const scienceFictionFilter = filmFilters.find((filter) => filter.id === 'science-fiction');

    expect(scienceFictionFilter).toMatchObject({
      shortLabel: 'Science Fiction',
      comparisonPath: '/science-fiction',
      rankingPath: '/science-fiction/ranking',
      savedPath: '/science-fiction/saved',
    });
  });

  it('keeps decade filter routes stable', () => {
    const decadeFilter = decadeFilmFilters.find((filter) => filter.id === '1990s');

    expect(decadeFilter).toMatchObject({
      shortLabel: '1990s',
      comparisonPath: '/1990s',
      rankingPath: '/1990s/ranking',
      savedPath: '/1990s/saved',
    });
  });

  it('includes every film poster in the offline asset list', () => {
    const offlineUrls = new Set(offlineFilmAssetUrls);

    for (const item of allFilmItems) {
      expect(offlineUrls.has(item.imageSrc)).toBe(true);
    }
  });

  it('uses local poster paths for every film item', () => {
    for (const item of allFilmItems) {
      expect(item.posterPath).toMatch(/^posters\/.+\.(jpg|png|svg)$/);
    }
  });
});
