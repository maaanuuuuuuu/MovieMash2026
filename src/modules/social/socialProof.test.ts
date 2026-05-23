import { describe, expect, it } from 'vitest';
import { buildInterestedMovieSocialProof } from './socialProof';

describe('social proof', () => {
  it('builds up to two short lines from top 20 and top 50 followers', () => {
    expect(
      buildInterestedMovieSocialProof(
        [
          {
            userId: 'friend-1',
            displayName: 'Tom',
            photoURL: null,
            topItemIds: ['aliens'],
            top50ItemIds: ['aliens', 'heat'],
            updatedAtMs: null,
          },
          {
            userId: 'friend-2',
            displayName: 'Charly',
            photoURL: null,
            topItemIds: ['aliens'],
            top50ItemIds: ['aliens', 'heat'],
            updatedAtMs: null,
          },
          {
            userId: 'friend-3',
            displayName: 'Esther',
            photoURL: null,
            topItemIds: ['aliens'],
            top50ItemIds: ['aliens'],
            updatedAtMs: null,
          },
          {
            userId: 'friend-4',
            displayName: 'Julie',
            photoURL: null,
            topItemIds: ['heat'],
            top50ItemIds: ['aliens', 'heat'],
            updatedAtMs: null,
          },
          {
            userId: 'friend-5',
            displayName: 'Sarah',
            photoURL: null,
            topItemIds: ['heat'],
            top50ItemIds: ['aliens', 'heat'],
            updatedAtMs: null,
          },
          {
            userId: 'friend-6',
            displayName: 'Peter',
            photoURL: null,
            topItemIds: ['heat'],
            top50ItemIds: ['aliens', 'heat'],
            updatedAtMs: null,
          },
        ],
        'aliens',
      ),
    ).toEqual(['Tom, Charly and Esther love this', 'Julie, Sarah and Peter really like this']);
  });

  it('does not repeat a top 20 friend in the top 50 line', () => {
    expect(
      buildInterestedMovieSocialProof(
        [
          {
            userId: 'friend-1',
            displayName: 'Tom',
            photoURL: null,
            topItemIds: ['aliens'],
            top50ItemIds: ['aliens'],
            updatedAtMs: null,
          },
        ],
        'aliens',
      ),
    ).toEqual(['Tom loves this']);
  });
});
