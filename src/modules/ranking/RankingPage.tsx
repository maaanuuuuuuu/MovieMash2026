import { ArrowLeft } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GLOBAL_FILM_SCOPE_ID,
  filmItemById,
  filmItems,
  filmItemsByFilterId,
  type FilmFilter,
} from '../content/filmSource';
import {
  MINIMUM_ACTIVE_ITEMS,
  listComparisonRecords,
  listRankingStates,
  markRankingItemNotSeen,
} from '../persistence/rankingRepository';
import { getOrderedRanking, getStabilityTier } from '../rankingEngine/stability';
import { FightHistoryModal } from './FightHistoryModal';
import { RankingRow } from './RankingRow';

type RankingPageProps = {
  filter: FilmFilter;
};

export function RankingPage({ filter }: RankingPageProps) {
  const items = filmItemsByFilterId[filter.id];
  const allItemIds = useMemo(() => filmItems.map((item) => item.id), []);
  const filterItemIds = useMemo(() => items.map((item) => item.id), [items]);
  const fallbackStates = useMemo(() => {
    return allItemIds.map((itemId) => ({
      itemId,
      rating: 1000,
      appearances: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      active: true,
      notSeen: false,
      catalogId: GLOBAL_FILM_SCOPE_ID,
      createdAt: 0,
      updatedAt: 0,
    }));
  }, [allItemIds]);
  const filterItemIdSet = useMemo(() => new Set(filterItemIds), [filterItemIds]);
  const states = useLiveQuery(
    () => listRankingStates(GLOBAL_FILM_SCOPE_ID, allItemIds),
    [allItemIds],
    fallbackStates,
  );
  const records = useLiveQuery(() => listComparisonRecords(GLOBAL_FILM_SCOPE_ID), [], []);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [rankingMessage, setRankingMessage] = useState<string | undefined>();
  const [locallyRemovedItemIds, setLocallyRemovedItemIds] = useState<Set<string>>(() => new Set());
  const rankedRows = getOrderedRanking(states)
    .filter((state) => !locallyRemovedItemIds.has(state.itemId))
    .map((state, index) => ({ state, globalRank: index + 1 }))
    .filter((row) => filterItemIdSet.has(row.state.itemId));
  const selectedItem = selectedItemId ? filmItemById.get(selectedItemId) : undefined;
  const canRemoveFromRanking = rankedRows.length > MINIMUM_ACTIVE_ITEMS;

  async function handleMarkNotSeen(itemId: string, itemLabel: string) {
    const result = await markRankingItemNotSeen(GLOBAL_FILM_SCOPE_ID, itemId, filterItemIds);
    console.log(result.applied ? `${itemLabel} not seen` : `${itemLabel} not seen blocked: ${result.reason}`);

    if (result.applied) {
      setLocallyRemovedItemIds((current) => new Set(current).add(itemId));
      setRankingMessage(`${itemLabel} removed`);
      return true;
    }

    if (result.reason === 'minimumActiveItems') {
      setRankingMessage('Last 10 stay');
    }

    return false;
  }

  return (
    <main className="ranking-page">
      <header className="ranking-page__header">
        <Link
          to={filter.comparisonPath}
          className="ranking-page__back"
          aria-label="Back to comparisons"
          title="Back to comparisons"
        >
          <ArrowLeft aria-hidden="true" size={23} />
        </Link>
        <div>
          <p className="eyebrow">{filter.eyebrow}</p>
          <h1>Your ranking</h1>
          <p className="ranking-page__hint">Swipe a row sideways to mark a movie unseen.</p>
          {rankingMessage ? <p className="ranking-page__message">{rankingMessage}</p> : null}
        </div>
      </header>

      <ol className="ranking-list" aria-label="Ordered ranking">
        {rankedRows.map(({ state, globalRank }) => {
          const item = filmItemById.get(state.itemId);

          if (!item) {
            return null;
          }

          return (
            <RankingRow
              key={state.itemId}
              item={item}
              state={state}
              rank={globalRank}
              tier={getStabilityTier(state)}
              canMarkNotSeen={canRemoveFromRanking}
              onOpenHistory={() => setSelectedItemId(item.id)}
              onMarkNotSeen={() => handleMarkNotSeen(item.id, item.label)}
            />
          );
        })}
      </ol>
      {selectedItem ? (
        <FightHistoryModal
          item={selectedItem}
          records={records}
          itemById={filmItemById}
          onClose={() => setSelectedItemId(undefined)}
        />
      ) : null}
    </main>
  );
}
