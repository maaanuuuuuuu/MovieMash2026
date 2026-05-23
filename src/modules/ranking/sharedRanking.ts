import { filmFilterById, type FilmFilterId } from '../content/filmSource';

const SHARED_RANKING_VERSION = 1;
const SHARED_RANKING_QUERY_KEY = 'top';
const SHARED_RANKING_PATH = '/shared-ranking';

export type SharedRankingSnapshot = {
  version: number;
  filterId: FilmFilterId;
  topItemIds: string[];
};

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));

  return atob(`${normalized}${padding}`);
}

export function createSharedRankingSnapshot(filterId: FilmFilterId, topItemIds: string[]): SharedRankingSnapshot {
  return {
    version: SHARED_RANKING_VERSION,
    filterId,
    topItemIds: topItemIds.slice(0, 20),
  };
}

export function encodeSharedRankingSnapshot(snapshot: SharedRankingSnapshot) {
  return toBase64Url(JSON.stringify(snapshot));
}

export function decodeSharedRankingSnapshot(payload: string) {
  try {
    const value = JSON.parse(fromBase64Url(payload)) as Partial<SharedRankingSnapshot>;

    if (
      value.version !== SHARED_RANKING_VERSION ||
      typeof value.filterId !== 'string' ||
      !filmFilterById.has(value.filterId as FilmFilterId) ||
      !Array.isArray(value.topItemIds) ||
      value.topItemIds.some((itemId) => typeof itemId !== 'string')
    ) {
      return undefined;
    }

    return {
      version: SHARED_RANKING_VERSION,
      filterId: value.filterId as FilmFilterId,
      topItemIds: value.topItemIds.slice(0, 20),
    } satisfies SharedRankingSnapshot;
  } catch {
    return undefined;
  }
}

export function createSharedRankingUrl(snapshot: SharedRankingSnapshot, currentUrl: string) {
  const url = new URL(currentUrl);
  const params = new URLSearchParams();

  params.set(SHARED_RANKING_QUERY_KEY, encodeSharedRankingSnapshot(snapshot));
  url.hash = `${SHARED_RANKING_PATH}?${params.toString()}`;

  return url.toString();
}

export function readSharedRankingSnapshot(search: string) {
  const params = new URLSearchParams(search);
  const payload = params.get(SHARED_RANKING_QUERY_KEY);

  if (!payload) {
    return undefined;
  }

  return decodeSharedRankingSnapshot(payload);
}
