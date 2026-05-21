import { Cloud, LogIn, UserRound } from 'lucide-react';
import { useState } from 'react';
import './FirebaseAccountButton.css';
import { signInWithGoogle, signOutOfFirebase } from './authRepository';
import { useAuthSession } from './useAuthSession';
import { useFirebaseSync, type FirebaseSyncState } from '../sync/useFirebaseSync';

function getSyncTone(syncState: FirebaseSyncState, hasActionError: boolean) {
  if (hasActionError || syncState.status === 'error') {
    return 'error';
  }

  if (syncState.status === 'running') {
    return 'busy';
  }

  if (syncState.status === 'saved' || syncState.status === 'uploadedLocal' || syncState.status === 'replacedLocal') {
    return 'saved';
  }

  return 'idle';
}

export function FirebaseAccountButton() {
  const session = useAuthSession();
  const syncState = useFirebaseSync(session);
  const [actionError, setActionError] = useState<string | undefined>();

  if (session.status === 'unconfigured') {
    return null;
  }

  const signedInUser = session.status === 'signedIn' ? session.user : undefined;
  const isLoading = session.status === 'loading' || (Boolean(signedInUser) && syncState.status === 'running');
  const label = signedInUser ? 'Sign out' : 'Sign in with Google';
  const syncMessage = actionError ?? (signedInUser ? syncState.message : 'Local only');
  const title = signedInUser
    ? `${signedInUser.displayName ?? signedInUser.email ?? 'Google account'}: ${syncMessage}`
    : label;
  const tone = signedInUser ? getSyncTone(syncState, Boolean(actionError)) : actionError ? 'error' : 'idle';

  async function handleClick() {
    setActionError(undefined);

    try {
      if (signedInUser) {
        await signOutOfFirebase();
        return;
      }

      await signInWithGoogle();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Google sign-in failed');
    }
  }

  return (
    <div className="firebase-account">
      <button
        type="button"
        className="firebase-account__button"
        aria-label={label}
        title={title}
        disabled={session.status === 'loading'}
        onClick={() => {
          void handleClick();
        }}
      >
        {signedInUser?.photoURL ? (
          <img className="firebase-account__avatar" src={signedInUser.photoURL} alt="" />
        ) : signedInUser ? (
          <UserRound aria-hidden="true" size={23} />
        ) : isLoading ? (
          <Cloud aria-hidden="true" size={22} />
        ) : (
          <LogIn aria-hidden="true" size={22} />
        )}
        <span className={`firebase-account__dot firebase-account__dot--${tone}`} aria-hidden="true" />
      </button>
      <span className="firebase-account__status" aria-live="polite">
        {syncMessage}
      </span>
    </div>
  );
}
