import { describe, expect, it } from 'vitest';
import type { AuthUser } from '../auth/authRepository';
import type { DatabaseSnapshot } from '../persistence/db';
import { createPublicProfileDocument, getPublicProfileTopItemIds, getPublicProfileTopItems } from './publicProfile';

const user: AuthUser = {
  uid: 'user-1',
  displayName: '  Manu  ',
  email: 'manu@example.com',
  photoURL: 'https://example.com/avatar.png',
};

function createSnapshot(): DatabaseSnapshot {
  return {
    version: 4,
    exportedAt: Date.now(),
    rankingStates: [
      {
        catalogId: 'default',
        itemId: 'aliens',
        rating: 1700,
        appearances: 8,
        wins: 6,
        losses: 2,
        ties: 0,
        active: true,
        notSeen: false,
        notSeenDisposition: null,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        catalogId: 'default',
        itemId: 'following',
        rating: 1600,
        appearances: 6,
        wins: 4,
        losses: 2,
        ties: 0,
        active: true,
        notSeen: false,
        notSeenDisposition: null,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        catalogId: 'default',
        itemId: 'missing-movie',
        rating: 1800,
        appearances: 9,
        wins: 7,
        losses: 2,
        ties: 0,
        active: false,
        notSeen: true,
        notSeenDisposition: 'removed',
        createdAt: 0,
        updatedAt: 0,
      },
      {
        catalogId: 'action',
        itemId: 'die-hard',
        rating: 2100,
        appearances: 10,
        wins: 9,
        losses: 1,
        ties: 0,
        active: true,
        notSeen: false,
        notSeenDisposition: null,
        createdAt: 0,
        updatedAt: 0,
      },
    ],
    comparisons: [],
    meta: [],
  };
}

describe('public profile helpers', () => {
  it('builds a public top 20 from active default states only', () => {
    expect(getPublicProfileTopItemIds(createSnapshot())).toEqual(['aliens', 'following']);
  });

  it('creates a public profile document with a trimmed display name', () => {
    expect(createPublicProfileDocument(user, createSnapshot())).toEqual({
      schemaVersion: 1,
      displayName: 'Manu',
      photoURL: 'https://example.com/avatar.png',
      topItemIds: ['aliens', 'following'],
    });
  });

  it('maps public profile ids back to shipped film items', () => {
    const topItems = getPublicProfileTopItems({
      userId: 'friend-1',
      displayName: 'Friend',
      photoURL: null,
      topItemIds: ['aliens', 'following'],
      updatedAtMs: null,
    });

    expect(topItems.map((item) => item.id)).toEqual(['aliens', 'following']);
  });
});
