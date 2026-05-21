import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseClientServices } from '../auth/firebaseApp';
import type { DatabaseSnapshot } from '../persistence/db';

export type CloudWriteReason = 'initial-upload' | 'autosave' | 'manual';

const CLOUD_STATE_SCHEMA_VERSION = 1;

function getRequiredFirestore() {
  const services = getFirebaseClientServices();

  if (!services) {
    throw new Error('Firebase is not configured.');
  }

  return services.firestore;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDatabaseSnapshot(value: unknown): value is DatabaseSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.version === 2 || value.version === 3 || value.version === 4) &&
    typeof value.exportedAt === 'number' &&
    Array.isArray(value.rankingStates) &&
    Array.isArray(value.comparisons) &&
    Array.isArray(value.meta)
  );
}

function toFirestoreSnapshot(snapshot: DatabaseSnapshot): DatabaseSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as DatabaseSnapshot;
}

export async function readCloudDatabaseSnapshot(uid: string) {
  const firestore = getRequiredFirestore();
  const stateDocument = await getDoc(doc(firestore, 'users', uid, 'state', 'current'));

  if (!stateDocument.exists()) {
    return undefined;
  }

  const data = stateDocument.data();

  if (!isRecord(data) || !isDatabaseSnapshot(data.snapshot)) {
    throw new Error('Cloud state has an unsupported shape.');
  }

  return data.snapshot;
}

export async function writeCloudDatabaseSnapshot(
  uid: string,
  snapshot: DatabaseSnapshot,
  reason: CloudWriteReason,
) {
  const firestore = getRequiredFirestore();
  const updatedAt = serverTimestamp();
  const userData =
    reason === 'initial-upload'
      ? { schemaVersion: CLOUD_STATE_SCHEMA_VERSION, createdAt: updatedAt, updatedAt }
      : { schemaVersion: CLOUD_STATE_SCHEMA_VERSION, updatedAt };

  await setDoc(doc(firestore, 'users', uid), userData, { merge: true });
  await setDoc(doc(firestore, 'users', uid, 'state', 'current'), {
    schemaVersion: CLOUD_STATE_SCHEMA_VERSION,
    appSchemaVersion: snapshot.version,
    updatedAt,
    reason,
    snapshot: toFirestoreSnapshot(snapshot),
  });
}
