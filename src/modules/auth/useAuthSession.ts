import { useEffect, useState } from 'react';
import { hasFirebaseConfig } from './firebaseApp';
import { listenToAuthSession, type AuthSession } from './authRepository';

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession>(() =>
    hasFirebaseConfig() ? { status: 'loading' } : { status: 'unconfigured' },
  );

  // Keep the React session aligned with Firebase Auth while the account button is mounted.
  useEffect(() => listenToAuthSession(setSession), []);

  return session;
}
