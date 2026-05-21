import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { getFirebaseClientServices } from './firebaseApp';

export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export type AuthSession =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: AuthUser }
  | { status: 'error'; message: string };

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export function listenToAuthSession(onChange: (session: AuthSession) => void): Unsubscribe {
  const services = getFirebaseClientServices();

  if (!services) {
    onChange({ status: 'unconfigured' });
    return () => undefined;
  }

  onChange({ status: 'loading' });

  return onAuthStateChanged(
    services.auth,
    (user) => {
      onChange(user ? { status: 'signedIn', user: toAuthUser(user) } : { status: 'signedOut' });
    },
    (error) => {
      onChange({ status: 'error', message: error.message });
    },
  );
}

export async function signInWithGoogle() {
  const services = getFirebaseClientServices();

  if (!services) {
    throw new Error('Firebase is not configured.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(services.auth, provider);
}

export async function signOutOfFirebase() {
  const services = getFirebaseClientServices();

  if (!services) {
    return;
  }

  await signOut(services.auth);
}
