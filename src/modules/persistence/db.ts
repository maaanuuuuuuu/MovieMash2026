import { Dexie, type Table } from 'dexie';
import type { NotSeenDisposition, RankingItemState } from '../../domain/item';
import type { OutcomeKind } from '../../domain/outcome';

export type ComparisonRecord = {
  id: string;
  catalogId: string;
  outcomeType: OutcomeKind;
  leftId?: string;
  rightId?: string;
  winnerId?: string;
  loserId?: string;
  notSeenId?: string;
  notSeenDisposition?: NotSeenDisposition;
  ratingChanges?: RatingChangeRecord[];
  createdAt: number;
};

export type RatingChangeRecord = {
  itemId: string;
  beforeRating: number;
  afterRating: number;
  delta: number;
};

export type MetaRecord = {
  key: string;
  value: boolean | number | string;
};

export type SnapshotRankingItemState = Omit<RankingItemState, 'notSeenDisposition'> & {
  notSeenDisposition?: NotSeenDisposition | null;
};

export type SnapshotComparisonRecord = Omit<ComparisonRecord, 'notSeenDisposition'> & {
  notSeenDisposition?: NotSeenDisposition;
};

export type DatabaseSnapshot = {
  version: 2 | 3;
  exportedAt: number;
  rankingStates: SnapshotRankingItemState[];
  comparisons: SnapshotComparisonRecord[];
  meta: MetaRecord[];
};

type LegacyRankingItemState = Omit<RankingItemState, 'catalogId'>;
type LegacyComparisonRecord = Omit<ComparisonRecord, 'catalogId'>;

class MovieMashDatabase extends Dexie {
  catalogRankingStates!: Table<RankingItemState, [string, string]>;
  comparisons!: Table<ComparisonRecord, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super('movie-mash-v1');

    this.version(1).stores({
      rankingStates: 'itemId, active, appearances, rating',
      comparisons: 'id, outcomeType, createdAt',
      meta: 'key',
    });

    this.version(2)
      .stores({
        rankingStates: 'itemId, active, appearances, rating',
        catalogRankingStates: '[catalogId+itemId], catalogId, itemId, active, appearances, rating',
        comparisons: 'id, catalogId, outcomeType, createdAt',
        meta: 'key',
      })
      .upgrade(async (transaction) => {
        const legacyStates = await transaction.table<LegacyRankingItemState, string>('rankingStates').toArray();

        if (legacyStates.length > 0) {
          await transaction
            .table<RankingItemState, [string, string]>('catalogRankingStates')
            .bulkPut(legacyStates.map((state) => ({ ...state, catalogId: 'default' })));
        }

        await transaction.table<LegacyComparisonRecord, string>('comparisons').toCollection().modify((record) => {
          (record as ComparisonRecord).catalogId = 'default';
        });
      });

    this.version(3).stores({
      rankingStates: null,
      catalogRankingStates: '[catalogId+itemId], catalogId, itemId, active, appearances, rating',
      comparisons: 'id, catalogId, outcomeType, createdAt',
      meta: 'key',
    });

    this.version(4)
      .stores({
        rankingStates: null,
        catalogRankingStates:
          '[catalogId+itemId], catalogId, itemId, active, notSeen, notSeenDisposition, appearances, rating',
        comparisons: 'id, catalogId, outcomeType, createdAt',
        meta: 'key',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<RankingItemState, [string, string]>('catalogRankingStates')
          .toCollection()
          .modify((state) => {
            state.notSeenDisposition = state.active ? null : state.notSeen ? 'removed' : null;
          });

        await transaction
          .table<ComparisonRecord, string>('comparisons')
          .where('outcomeType')
          .equals('notSeen')
          .modify((record) => {
            if (!record.notSeenDisposition) {
              record.notSeenDisposition = 'removed';
            }
          });
      });
  }
}

export const db = new MovieMashDatabase();

export async function resetDatabase() {
  await db.transaction('rw', db.catalogRankingStates, db.comparisons, db.meta, async () => {
    await db.catalogRankingStates.clear();
    await db.comparisons.clear();
    await db.meta.clear();
  });
}
