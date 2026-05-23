import { ArrowLeft, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthSession } from '../auth/useAuthSession';
import { allFilmFilter } from '../content/filmSource';
import { buildProfilePath } from './profilePath';
import { PublicProfileMessage } from './PublicProfileMessage';
import { getPublicProfileTopItems, type PublicProfileRecord } from './publicProfile';
import { followProfile, readFollowingState, readPublicProfile, unfollowProfile } from './socialRepository';
import './PublicProfilePage.css';

type PageState =
  | { status: 'idle' | 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; profile: PublicProfileRecord; isFollowing: boolean };

export function PublicProfilePage() {
  const { userId = '' } = useParams();
  const session = useAuthSession();
  const [pageState, setPageState] = useState<PageState>({ status: 'idle' });
  const [actionError, setActionError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load the public profile and the current follow state for the route user.
  useEffect(() => {
    if (session.status !== 'signedIn') {
      return undefined;
    }

    const signedInUser = session.user;
    let cancelled = false;

    async function loadProfile() {
      setPageState({ status: 'loading' });
      setActionError(undefined);

      try {
        const profile = await readPublicProfile(userId);

        if (cancelled) {
          return;
        }

        if (!profile) {
          setPageState({ status: 'missing' });
          return;
        }

        const isFollowing = signedInUser.uid !== userId ? await readFollowingState(signedInUser, userId) : false;

        if (!cancelled) {
          setPageState({ status: 'ready', profile, isFollowing });
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(error instanceof Error ? error.message : 'Profile loading failed.');
          setPageState({ status: 'missing' });
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session, userId]);

  if (session.status === 'unconfigured') {
    return <PublicProfileMessage title="Public profiles are not available in this build." />;
  }

  if (session.status === 'loading') {
    return <PublicProfileMessage title="Checking Google sign-in..." />;
  }

  if (session.status !== 'signedIn') {
    return <PublicProfileMessage title="Sign in with Google to open public profiles." />;
  }

  if (pageState.status === 'loading' || pageState.status === 'idle') {
    return <PublicProfileMessage title="Loading public profile..." />;
  }

  if (pageState.status === 'missing') {
    return <PublicProfileMessage title="This public profile is not ready yet." />;
  }

  if (pageState.status !== 'ready') {
    return <PublicProfileMessage title="Loading public profile..." />;
  }

  const signedInUser = session.user;
  const readyState = pageState;
  const isOwnProfile = signedInUser.uid === userId;
  const topItems = getPublicProfileTopItems(readyState.profile);

  async function handleFollowToggle() {
    if (isOwnProfile) {
      return;
    }

    setIsSubmitting(true);
    setActionError(undefined);

    try {
      if (readyState.isFollowing) {
        await unfollowProfile(signedInUser, userId);
        setPageState({ ...readyState, isFollowing: false });
      } else {
        await followProfile(signedInUser, userId);
        setPageState({ ...readyState, isFollowing: true });
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Follow action failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="public-profile-page">
      <section className="public-profile-panel">
        <Link to={allFilmFilter.comparisonPath} className="public-profile-panel__back" aria-label="Back to comparisons">
          <ArrowLeft aria-hidden="true" size={23} />
        </Link>
        <div className="public-profile-panel__header">
          <div className="public-profile-panel__identity">
            {readyState.profile.photoURL ? (
              <img className="public-profile-panel__avatar" src={readyState.profile.photoURL} alt="" />
            ) : (
              <span className="public-profile-panel__avatar-fallback" aria-hidden="true">
                <UserRound size={22} />
              </span>
            )}
            <div>
              <p className="public-profile-panel__eyebrow">Public profile</p>
              <h1>{readyState.profile.displayName}</h1>
              <p className="public-profile-panel__status">{isOwnProfile ? 'This is your public top 20.' : `User ID: ${userId}`}</p>
            </div>
          </div>
          <div className="public-profile-panel__actions">
            {!isOwnProfile ? (
              <button
                type="button"
                className="public-profile-panel__follow"
                disabled={isSubmitting}
                onClick={() => {
                  void handleFollowToggle();
                }}
              >
                {readyState.isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
        </div>
        <p className="public-profile-panel__copy">
          Direct profile route: <code>{buildProfilePath(userId)}</code>
        </p>
        {actionError ? <p className="public-profile-panel__copy">{actionError}</p> : null}
        {topItems.length > 0 ? (
          <ol className="public-profile-list" aria-label="Public top 20">
            {topItems.map((item, index) => (
              <li key={item.id} className="public-profile-card">
                <span className="public-profile-card__rank">{index + 1}</span>
                <img className="public-profile-card__poster" src={item.imageSrc} alt="" />
                <span>
                  <span className="public-profile-card__title">{item.label}</span>
                  <span className="public-profile-card__meta">{item.year}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="public-profile-panel__empty">No public top 20 is available yet.</p>
        )}
      </section>
    </main>
  );
}
