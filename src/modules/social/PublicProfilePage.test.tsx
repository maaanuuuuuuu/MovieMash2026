import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicProfilePage } from './PublicProfilePage';

const mocks = vi.hoisted(() => ({
  readPublicProfile: vi.fn(),
  readFollowingState: vi.fn(),
  followProfile: vi.fn(),
  unfollowProfile: vi.fn(),
  useAuthSession: vi.fn(),
}));

vi.mock('../auth/useAuthSession', () => ({
  useAuthSession: mocks.useAuthSession,
}));

vi.mock('./socialRepository', () => ({
  readPublicProfile: mocks.readPublicProfile,
  readFollowingState: mocks.readFollowingState,
  followProfile: mocks.followProfile,
  unfollowProfile: mocks.unfollowProfile,
}));

describe('public profile page', () => {
  beforeEach(() => {
    mocks.readPublicProfile.mockReset();
    mocks.readFollowingState.mockReset();
    mocks.followProfile.mockReset();
    mocks.unfollowProfile.mockReset();
    mocks.useAuthSession.mockReset();
  });

  it('asks the user to sign in when the page is opened signed out', async () => {
    mocks.useAuthSession.mockReturnValue({ status: 'signedOut' });

    renderWithRoute('/profiles/friend-1');

    expect(await screen.findByRole('heading', { name: 'Sign in with Google to open public profiles.' })).toBeInTheDocument();
  });

  it('renders a public top 20 and follows another user', async () => {
    const user = userEvent.setup();
    mocks.useAuthSession.mockReturnValue({
      status: 'signedIn',
      user: { uid: 'viewer-1', displayName: 'Viewer', email: 'viewer@example.com', photoURL: null },
    });
    mocks.readPublicProfile.mockResolvedValue({
      userId: 'friend-1',
      displayName: 'Friend',
      photoURL: null,
      topItemIds: ['alien', 'following'],
      updatedAtMs: null,
    });
    mocks.readFollowingState.mockResolvedValue(false);
    mocks.followProfile.mockResolvedValue(undefined);

    renderWithRoute('/profiles/friend-1');

    expect(await screen.findByRole('heading', { name: 'Friend' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Public top 20' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Follow' }));

    await waitFor(() => {
      expect(mocks.followProfile).toHaveBeenCalledWith(
        { uid: 'viewer-1', displayName: 'Viewer', email: 'viewer@example.com', photoURL: null },
        'friend-1',
      );
    });
    expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument();
  });
});

function renderWithRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/profiles/:userId" element={<PublicProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}
