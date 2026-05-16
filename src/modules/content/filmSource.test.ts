import { describe, expect, it } from 'vitest';
import { allFilmItems, filmFilters, filmItems, filmItemsByFilterId, offlineFilmAssetUrls } from './filmSource';

describe('film filter sources', () => {
  it('keeps each filter mapped to its own route and item list', () => {
    for (const filter of filmFilters) {
      const items = filmItemsByFilterId[filter.id];
      const itemIds = items.map((item) => item.id);

      expect(items).toHaveLength(filter.films.length);
      expect(new Set(itemIds).size).toBe(items.length);
      expect(filter.comparisonPath).toMatch(/^\/($|[a-z-]+$)/);
      expect(filter.rankingPath).toMatch(/^\/([a-z-]+\/)?ranking$/);
    }
  });

  it('keeps genre filter items in the global list', () => {
    const globalIds = new Set(filmItems.map((item) => item.id));

    for (const item of [...filmItemsByFilterId.action, ...filmItemsByFilterId.comedy]) {
      expect(globalIds.has(item.id)).toBe(true);
    }
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
