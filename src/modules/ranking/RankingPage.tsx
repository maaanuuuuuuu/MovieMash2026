import { ArrowLeft, Bookmark } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './RankingPage.css';
import type { NotSeenDisposition } from '../../domain/item';
import {
  GLOBAL_FILM_SCOPE_ID,
  filmItemById,
  filmItems,
  filmItemsByFilterId,
  type FilmFilter,
} from '../content/filmSource';
import { FilmFilterSwitch } from '../content/FilmFilterSwitch';
import {
  MINIMUM_ACTIVE_ITEMS,
  listComparisonRecords,
  listRankingStates,
  markRankingItemNotSeen,
} from '../persistence/rankingRepository';
import { getStabilityTier } from '../rankingEngine/stability';
import { FightHistoryModal } from './FightHistoryModal';
import { RankingRow } from './RankingRow';
import { createFallbackRankingStates, getFilteredRankingRows, rankingRemovalMessage } from './RankingPage.utils';

type RankingPageProps = {
  filter: FilmFilter;
};

export function RankingPage({ filter }: RankingPageProps) {
  const items = filmItemsByFilterId[filter.id];
  const allItemIds = useMemo(() => filmItems.map((item) => item.id), []);
  const filterItemIds = useMemo(() => items.map((item) => item.id), [items]);
  const fallbackStates = useMemo(() => createFallbackRankingStates(allItemIds), [allItemIds]);
  const filterItemIdSet = useMemo(() => new Set(filterItemIds), [filterItemIds]);
  const states = useLiveQuery(() => listRankingStates(GLOBAL_FILM_SCOPE_ID, allItemIds), [allItemIds], fallbackStates);
  const records = useLiveQuery(() => listComparisonRecords(GLOBAL_FILM_SCOPE_ID), [], []);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [rankingMessage, setRankingMessage] = useState<string | undefined>();
  const [locallyRemovedItemIds, setLocallyRemovedItemIds] = useState<Set<string>>(() => new Set());
  const rankedRows = getFilteredRankingRows(states, filterItemIdSet, locallyRemovedItemIds);
  const selectedItem = selectedItemId ? filmItemById.get(selectedItemId) : undefined;
  const canRemoveFromRanking = rankedRows.length > MINIMUM_ACTIVE_ITEMS;

  async function handleMarkNotSeen(itemId: string, itemLabel: string, disposition: NotSeenDisposition) {
    const result = await markRankingItemNotSeen(GLOBAL_FILM_SCOPE_ID, itemId, disposition, filterItemIds);
    console.log(result.applied ? `${itemLabel} marked ${disposition}` : `${itemLabel} ${disposition} blocked: ${result.reason}`);

    if (result.applied) {
      setLocallyRemovedItemIds((current) => new Set(current).add(itemId));
      setRankingMessage(rankingRemovalMessage(itemLabel, disposition));
      return true;
    }

    if (result.reason === 'minimumActiveItems') {
      setRankingMessage('Last 10 stay');
    }

    return false;
  }

  return (
    <main className="ranking-page">
      <FilmFilterSwitch activeFilter={filter} view="ranking" />
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
          <p className="ranking-page__hint">Swipe left to save for later, right to remove.</p>
          {rankingMessage ? <p className="ranking-page__message">{rankingMessage}</p> : null}
        </div>
        <Link
          to={filter.savedPath}
          className="ranking-page__saved"
          aria-label="Open saved movies"
          title="Open saved movies"
        >
          <Bookmark aria-hidden="true" size={22} />
        </Link>
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
              onMarkNotSeen={(disposition) => handleMarkNotSeen(item.id, item.label, disposition)}
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
