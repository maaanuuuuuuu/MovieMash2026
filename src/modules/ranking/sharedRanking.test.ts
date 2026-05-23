import { describe, expect, it } from 'vitest';
import { createSharedRankingSnapshot, createSharedRankingUrl, decodeSharedRankingSnapshot, readSharedRankingSnapshot } from './sharedRanking';

describe('shared ranking links', () => {
  it('encodes and decodes a top 20 snapshot', () => {
    const snapshot = createSharedRankingSnapshot('all', ['a', 'b', 'c']);
    const url = createSharedRankingUrl(snapshot, 'https://example.com/MovieMash2026/#/ranking');
    const parsed = new URL(url);
    const decoded = readSharedRankingSnapshot(parsed.hash.replace(/^#\/shared-ranking/, ''));

    expect(decoded).toEqual(snapshot);
  });

  it('rejects broken payloads', () => {
    expect(decodeSharedRankingSnapshot('broken')).toBeUndefined();
  });
});
