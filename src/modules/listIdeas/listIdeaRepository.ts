import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import type { AuthUser } from '../auth/authRepository';
import { getFirebaseClientServices } from '../auth/firebaseApp';

export type ListIdeaStatus = 'pending' | 'approved' | 'rejected';

export type ListIdeaInput = {
  title: string;
  category: string;
  examples: string;
  notes: string;
};

export type ListIdeaRecord = {
  id: string;
  schemaVersion: number;
  createdByUid: string;
  createdByEmail: string | null;
  title: string;
  category: string;
  examples: string;
  notes: string;
  status: ListIdeaStatus;
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

const LIST_IDEA_SCHEMA_VERSION = 1;

function getRequiredFirestore() {
  const services = getFirebaseClientServices();

  if (!services) {
    throw new Error('Firebase is not configured.');
  }

  return services.firestore;
}

function normalizeRequiredText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value: string) {
  return value.trim();
}

function readString(data: DocumentData, key: string) {
  const value = data[key];
  return typeof value === 'string' ? value : '';
}

function readNullableString(data: DocumentData, key: string) {
  const value = data[key];
  return typeof value === 'string' ? value : null;
}

function readStatus(data: DocumentData): ListIdeaStatus {
  const value = data.status;
  return value === 'approved' || value === 'rejected' ? value : 'pending';
}

function readTimestampMillis(data: DocumentData, key: string) {
  const value = data[key];
  return value && typeof value === 'object' && 'toMillis' in value ? (value as Timestamp).toMillis() : null;
}

function toListIdeaRecord(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>): ListIdeaRecord {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    schemaVersion: typeof data.schemaVersion === 'number' ? data.schemaVersion : LIST_IDEA_SCHEMA_VERSION,
    createdByUid: readString(data, 'createdByUid'),
    createdByEmail: readNullableString(data, 'createdByEmail'),
    title: readString(data, 'title'),
    category: readString(data, 'category'),
    examples: readString(data, 'examples'),
    notes: readString(data, 'notes'),
    status: readStatus(data),
    createdAtMs: readTimestampMillis(data, 'createdAt'),
    updatedAtMs: readTimestampMillis(data, 'updatedAt'),
  };
}

export async function createListIdea(user: AuthUser, input: ListIdeaInput) {
  const firestore = getRequiredFirestore();

  await addDoc(collection(firestore, 'listIdeas'), {
    schemaVersion: LIST_IDEA_SCHEMA_VERSION,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdByUid: user.uid,
    createdByEmail: user.email,
    title: normalizeRequiredText(input.title),
    category: normalizeRequiredText(input.category),
    examples: normalizeOptionalText(input.examples),
    notes: normalizeOptionalText(input.notes),
    status: 'pending' satisfies ListIdeaStatus,
  });
}

export async function listListIdeas() {
  const firestore = getRequiredFirestore();
  const snapshots = await getDocs(query(collection(firestore, 'listIdeas'), orderBy('createdAt', 'desc')));
  return snapshots.docs.map(toListIdeaRecord);
}

export async function updateListIdeaStatus(id: string, status: ListIdeaStatus) {
  const firestore = getRequiredFirestore();
  await updateDoc(doc(firestore, 'listIdeas', id), { status, updatedAt: serverTimestamp() });
}
