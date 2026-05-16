import { Dexie, type Table } from 'dexie';
import type { RankingItemState } from '../../domain/item';
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

export type DatabaseSnapshot = {
  version: 2;
  exportedAt: number;
  rankingStates: RankingItemState[];
  comparisons: ComparisonRecord[];
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
