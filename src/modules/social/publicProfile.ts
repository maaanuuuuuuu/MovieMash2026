import type { AuthUser } from '../auth/authRepository';
import { filmItemById, GLOBAL_FILM_SCOPE_ID } from '../content/filmSource';
import type { FilmItem } from '../content/types';
import type { DatabaseSnapshot, SnapshotRankingItemState } from '../persistence/db';
import { getOrderedRanking } from '../rankingEngine/stability';

export type PublicProfileRecord = {
  userId: string;
  displayName: string;
  photoURL: string | null;
  topItemIds: string[];
  top50ItemIds: string[];
  updatedAtMs: number | null;
};

export const PUBLIC_PROFILE_SCHEMA_VERSION = 2;
export const PUBLIC_PROFILE_TOP_SIZE = 20;
export const PUBLIC_PROFILE_SOCIAL_PROOF_SIZE = 50;

function isGlobalActiveState(state: SnapshotRankingItemState) {
  return state.catalogId === GLOBAL_FILM_SCOPE_ID && state.active;
}

export function getPublicProfileDisplayName(user: AuthUser) {
  const displayName = user.displayName?.trim();
  return displayName && displayName.length > 0 ? displayName : 'MovieMash user';
}

export function getPublicProfileTopItemIds(snapshot: DatabaseSnapshot, limit = PUBLIC_PROFILE_TOP_SIZE) {
  const rankingStates = snapshot.rankingStates
    .filter(isGlobalActiveState)
    .map((state) => ({ ...state, notSeenDisposition: state.notSeenDisposition ?? null }));

  return getOrderedRanking(rankingStates).slice(0, limit).map((state) => state.itemId);
}

export function createPublicProfileDocument(user: AuthUser, snapshot: DatabaseSnapshot) {
  return {
    schemaVersion: PUBLIC_PROFILE_SCHEMA_VERSION,
    displayName: getPublicProfileDisplayName(user),
    photoURL: user.photoURL ?? null,
    topItemIds: getPublicProfileTopItemIds(snapshot, PUBLIC_PROFILE_TOP_SIZE),
    top50ItemIds: getPublicProfileTopItemIds(snapshot, PUBLIC_PROFILE_SOCIAL_PROOF_SIZE),
  };
}

export function getPublicProfileTopItems(profile: PublicProfileRecord): FilmItem[] {
  return profile.topItemIds.flatMap((itemId) => {
    const item = filmItemById.get(itemId);
    return item ? [item] : [];
  });
}
