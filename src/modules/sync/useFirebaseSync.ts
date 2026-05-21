import { useEffect, useMemo, useState } from 'react';
import type { AuthSession } from '../auth/authRepository';
import { readCloudDatabaseSnapshot } from './cloudStateRepository';
import { replaceLocalStateFromCloud } from './replaceLocalStateFromCloud';
import { syncLocalStateToCloud } from './syncLocalStateToCloud';

export type FirebaseSyncState = {
  status: 'idle' | 'running' | 'uploadedLocal' | 'replacedLocal' | 'saved' | 'error';
  message: string;
  lastSyncedAt?: number;
};

const AUTOSAVE_INTERVAL_MS = 30_000;

function idleState(): FirebaseSyncState {
  return { status: 'idle', message: 'Local only' };
}

export function useFirebaseSync(session: AuthSession) {
  const signedInUid = useMemo(() => (session.status === 'signedIn' ? session.user.uid : undefined), [session]);
  const [bootstrappedUid, setBootstrappedUid] = useState<string | undefined>();
  const [syncState, setSyncState] = useState<FirebaseSyncState>(() => idleState());

  // On sign-in, choose the one source of truth before normal autosave starts.
  useEffect(() => {
    if (!signedInUid) {
      return undefined;
    }

    const uid = signedInUid;
    let cancelled = false;

    async function bootstrap() {
      setSyncState({ status: 'running', message: 'Checking cloud save' });

      try {
        const cloudSnapshot = await readCloudDatabaseSnapshot(uid);

        if (cancelled) {
          return;
        }

        if (!cloudSnapshot) {
          await syncLocalStateToCloud(uid, 'initial-upload');

          if (!cancelled) {
            setBootstrappedUid(uid);
            setSyncState({
              status: 'uploadedLocal',
              message: 'Cloud save created',
              lastSyncedAt: Date.now(),
            });
          }

          return;
        }

        await replaceLocalStateFromCloud(uid);

        if (!cancelled) {
          setBootstrappedUid(uid);
          setSyncState({
            status: 'replacedLocal',
            message: 'Cloud save restored',
            lastSyncedAt: Date.now(),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setBootstrappedUid(undefined);
          setSyncState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Cloud sync failed',
          });
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [signedInUid]);

  // While signed in, back up the current IndexedDB snapshot on a simple timer and on tab hide.
  useEffect(() => {
    if (!signedInUid || bootstrappedUid !== signedInUid) {
      return undefined;
    }

    const uid = signedInUid;
    let cancelled = false;

    async function autosave() {
      try {
        await syncLocalStateToCloud(uid, 'autosave');

        if (!cancelled) {
          setSyncState({ status: 'saved', message: 'Cloud save updated', lastSyncedAt: Date.now() });
        }
      } catch (error) {
        if (!cancelled) {
          setSyncState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Cloud autosave failed',
          });
        }
      }
    }

    const intervalId = window.setInterval(() => {
      void autosave();
    }, AUTOSAVE_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void autosave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [bootstrappedUid, signedInUid]);

  return syncState;
}
