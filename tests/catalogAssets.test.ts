import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allFilmItems } from '../src/modules/content/filmSource';

describe('catalog poster assets', () => {
  it('keeps every catalog poster available as a public file', () => {
    const missingPosters = allFilmItems
      .filter((item) => !existsSync(resolve(process.cwd(), 'public', item.posterPath)))
      .map((item) => `${item.id}: ${item.posterPath}`);

    expect(missingPosters).toEqual([]);
  });
});
