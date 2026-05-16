import { describe, expect, it } from 'vitest';
import { allFilmItems, filmCatalogs, filmItemsByCatalogId, offlineFilmAssetUrls } from './filmSource';

describe('film catalog sources', () => {
  it('keeps each catalog mapped to its own route and item list', () => {
    for (const catalog of filmCatalogs) {
      const items = filmItemsByCatalogId[catalog.id];
      const itemIds = items.map((item) => item.id);

      expect(items).toHaveLength(catalog.films.length);
      expect(new Set(itemIds).size).toBe(items.length);
      expect(catalog.comparisonPath).toMatch(/^\/($|[a-z-]+$)/);
      expect(catalog.rankingPath).toMatch(/^\/([a-z-]+\/)?ranking$/);
    }
  });

  it('includes every catalog poster in the offline asset list', () => {
    const offlineUrls = new Set(offlineFilmAssetUrls);

    for (const item of allFilmItems) {
      expect(offlineUrls.has(item.imageSrc)).toBe(true);
    }
  });

  it('uses local poster paths for every catalog item', () => {
    for (const item of allFilmItems) {
      expect(item.posterPath).toMatch(/^posters\/.+\.(jpg|png|svg)$/);
    }
  });
});
