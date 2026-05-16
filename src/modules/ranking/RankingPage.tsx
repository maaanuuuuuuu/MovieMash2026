import { ArrowLeft } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { filmItemsByCatalogId, type FilmCatalog } from '../content/filmSource';
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
  catalog: FilmCatalog;
};

function recordIsInCatalog(recordItemIds: Set<string>, recordItemId: string | undefined) {
  return recordItemId === undefined || recordItemIds.has(recordItemId);
}

export function RankingPage({ catalog }: RankingPageProps) {
  const items = filmItemsByCatalogId[catalog.id];
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const fallbackStates = useMemo(() => {
    return itemIds.map((itemId) => ({
      itemId,
      rating: 1000,
      appearances: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      active: true,
      notSeen: false,
      catalogId: catalog.id,
      createdAt: 0,
      updatedAt: 0,
    }));
  }, [catalog.id, itemIds]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const itemIdSet = useMemo(() => new Set(itemIds), [itemIds]);
  const states = useLiveQuery(() => listRankingStates(catalog.id, itemIds), [catalog.id, itemIds], fallbackStates);
  const records = useLiveQuery(() => listComparisonRecords(catalog.id), [catalog.id], []);
  const catalogRecords = records.filter(
    (record) =>
      recordIsInCatalog(itemIdSet, record.leftId) &&
      recordIsInCatalog(itemIdSet, record.rightId) &&
      recordIsInCatalog(itemIdSet, record.winnerId) &&
      recordIsInCatalog(itemIdSet, record.loserId) &&
      recordIsInCatalog(itemIdSet, record.notSeenId),
  );
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [rankingMessage, setRankingMessage] = useState<string | undefined>();
  const [locallyRemovedItemIds, setLocallyRemovedItemIds] = useState<Set<string>>(() => new Set());
  const rankedStates = getOrderedRanking(states).filter((state) => !locallyRemovedItemIds.has(state.itemId));
  const selectedItem = selectedItemId ? itemById.get(selectedItemId) : undefined;
  const canRemoveFromRanking = rankedStates.length > MINIMUM_ACTIVE_ITEMS;

  async function handleMarkNotSeen(itemId: string, itemLabel: string) {
    const result = await markRankingItemNotSeen(catalog.id, itemId, itemIds);
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
          to={catalog.comparisonPath}
          className="ranking-page__back"
          aria-label="Back to comparisons"
          title="Back to comparisons"
        >
          <ArrowLeft aria-hidden="true" size={23} />
        </Link>
        <div>
          <p className="eyebrow">{catalog.eyebrow}</p>
          <h1>Your ranking</h1>
          <p className="ranking-page__hint">Swipe a row sideways to mark a movie unseen.</p>
          {rankingMessage ? <p className="ranking-page__message">{rankingMessage}</p> : null}
        </div>
      </header>

      <ol className="ranking-list" aria-label="Ordered ranking">
        {rankedStates.map((state, index) => {
          const item = itemById.get(state.itemId);

          if (!item) {
            return null;
          }

          return (
            <RankingRow
              key={state.itemId}
              item={item}
              state={state}
              rank={index + 1}
              tier={getStabilityTier(state)}
              canMarkNotSeen={canRemoveFromRanking}
              onOpenHistory={() => setSelectedItemId(item.id)}
              onMarkNotSeen={() => handleMarkNotSeen(item.id, item.label)}
            />
          );
        })}
      </ol>
      {selectedItem ? (
        <FightHistoryModal item={selectedItem} records={catalogRecords} itemById={itemById} onClose={() => setSelectedItemId(undefined)} />
      ) : null}
    </main>
  );
}
