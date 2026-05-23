import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import type { AuthUser } from '../auth/authRepository';
import { getFirebaseClientServices } from '../auth/firebaseApp';
import type { DatabaseSnapshot } from '../persistence/db';
import {
  PUBLIC_PROFILE_SCHEMA_VERSION,
  createPublicProfileDocument,
  type PublicProfileRecord,
} from './publicProfile';

function getRequiredFirestore() {
  const services = getFirebaseClientServices();

  if (!services) {
    throw new Error('Firebase is not configured.');
  }

  return services.firestore;
}

function readString(data: DocumentData, key: string) {
  const value = data[key];
  return typeof value === 'string' ? value : '';
}

function readNullableString(data: DocumentData, key: string) {
  const value = data[key];
  return typeof value === 'string' ? value : null;
}

function readStringArray(data: DocumentData, key: string) {
  const value = data[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function readTimestampMillis(data: DocumentData, key: string) {
  const value = data[key];
  return value && typeof value === 'object' && 'toMillis' in value ? (value as Timestamp).toMillis() : null;
}

function toPublicProfileRecord(userId: string, data: DocumentData): PublicProfileRecord {
  return {
    userId,
    displayName: readString(data, 'displayName') || 'MovieMash user',
    photoURL: readNullableString(data, 'photoURL'),
    topItemIds: readStringArray(data, 'topItemIds').slice(0, 20),
    top50ItemIds: readStringArray(data, 'top50ItemIds').slice(0, 50),
    updatedAtMs: readTimestampMillis(data, 'updatedAt'),
  };
}

export async function writePublicProfile(user: AuthUser, snapshot: DatabaseSnapshot) {
  const firestore = getRequiredFirestore();

  await setDoc(
    doc(firestore, 'publicProfiles', user.uid),
    {
      ...createPublicProfileDocument(user, snapshot),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function readPublicProfile(userId: string) {
  const firestore = getRequiredFirestore();
  const profileDocument = await getDoc(doc(firestore, 'publicProfiles', userId));

  if (!profileDocument.exists()) {
    return undefined;
  }

  return toPublicProfileRecord(userId, profileDocument.data());
}

export async function followProfile(user: AuthUser, targetUserId: string) {
  const firestore = getRequiredFirestore();

  await setDoc(doc(firestore, 'users', user.uid, 'following', targetUserId), {
    schemaVersion: PUBLIC_PROFILE_SCHEMA_VERSION,
    targetUserId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function unfollowProfile(user: AuthUser, targetUserId: string) {
  const firestore = getRequiredFirestore();
  await deleteDoc(doc(firestore, 'users', user.uid, 'following', targetUserId));
}

export async function readFollowingState(user: AuthUser, targetUserId: string) {
  const firestore = getRequiredFirestore();
  const followDocument = await getDoc(doc(firestore, 'users', user.uid, 'following', targetUserId));
  return followDocument.exists();
}

export async function readFollowedPublicProfiles(user: AuthUser) {
  const firestore = getRequiredFirestore();
  const followingSnapshots = await getDocs(collection(firestore, 'users', user.uid, 'following'));
  const targetUserIds = followingSnapshots.docs
    .map((snapshot) => snapshot.id)
    .filter((targetUserId) => targetUserId !== user.uid);

  const followedProfiles = await Promise.all(targetUserIds.map((targetUserId) => readPublicProfile(targetUserId)));
  return followedProfiles.filter((profile): profile is PublicProfileRecord => profile !== undefined);
}
