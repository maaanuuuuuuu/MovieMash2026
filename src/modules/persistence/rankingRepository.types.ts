import type { ComparableItem, RankingItemState } from '../../domain/item';

export const MINIMUM_ACTIVE_ITEMS = 10;

export type RankingCatalogScope = {
  catalogId: string;
  items: ComparableItem[];
};

export type PersistOutcomeResult =
  | {
      applied: true;
      states: RankingItemState[];
    }
  | {
      applied: false;
      reason: 'minimumActiveItems' | 'missingState';
      states: RankingItemState[];
    };

export type RestoreRankingItemResult =
  | {
      applied: true;
      state: RankingItemState;
    }
  | {
      applied: false;
      reason: 'missingState';
    };
