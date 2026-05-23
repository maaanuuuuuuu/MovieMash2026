import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInterestedMovieSocialProof } from './useInterestedMovieSocialProof';

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  readFollowedPublicProfiles: vi.fn(),
}));

vi.mock('../auth/useAuthSession', () => ({
  useAuthSession: mocks.useAuthSession,
}));

vi.mock('./socialRepository', () => ({
  readFollowedPublicProfiles: mocks.readFollowedPublicProfiles,
}));

describe('useInterestedMovieSocialProof', () => {
  beforeEach(() => {
    mocks.useAuthSession.mockReset();
    mocks.readFollowedPublicProfiles.mockReset();
  });

  it('loads top 20 and top 50 social proof for an interested movie', async () => {
    mocks.useAuthSession.mockReturnValue({
      status: 'signedIn',
      user: { uid: 'viewer-1', displayName: 'Viewer', email: 'viewer@example.com', photoURL: null },
    });
    mocks.readFollowedPublicProfiles.mockResolvedValue([
      {
        userId: 'friend-1',
        displayName: 'Tom',
        photoURL: null,
        topItemIds: ['aliens'],
        top50ItemIds: ['aliens'],
        updatedAtMs: null,
      },
      {
        userId: 'friend-2',
        displayName: 'Julie',
        photoURL: null,
        topItemIds: ['heat'],
        top50ItemIds: ['aliens', 'heat'],
        updatedAtMs: null,
      },
    ]);

    const { result } = renderHook(() =>
      useInterestedMovieSocialProof({
        catalogId: 'default',
        itemId: 'aliens',
        rating: 1000,
        appearances: 1,
        wins: 0,
        losses: 0,
        ties: 0,
        active: false,
        notSeen: true,
        notSeenDisposition: 'interested',
        createdAt: 0,
        updatedAt: 0,
      }),
    );

    await waitFor(() => {
      expect(result.current.lines).toEqual(['Tom loves this', 'Julie really likes this']);
    });
  });

  it('skips Firestore reads for non-interested movies', () => {
    mocks.useAuthSession.mockReturnValue({
      status: 'signedIn',
      user: { uid: 'viewer-1', displayName: 'Viewer', email: 'viewer@example.com', photoURL: null },
    });

    const { result } = renderHook(() =>
      useInterestedMovieSocialProof({
        catalogId: 'default',
        itemId: 'aliens',
        rating: 1000,
        appearances: 1,
        wins: 0,
        losses: 0,
        ties: 0,
        active: true,
        notSeen: false,
        notSeenDisposition: null,
        createdAt: 0,
        updatedAt: 0,
      }),
    );

    expect(result.current.lines).toEqual([]);
    expect(mocks.readFollowedPublicProfiles).not.toHaveBeenCalled();
  });
});
