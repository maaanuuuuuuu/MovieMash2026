import type { ComparisonRecord } from '../persistence/db';
import type { FilmItem } from '../content/types';

export type FightHistoryEntry = {
  record: ComparisonRecord;
  text: string;
  change: NonNullable<ComparisonRecord['ratingChanges']>[number] | undefined;
};

export function pointsLabel(delta: number) {
  return `${delta >= 0 ? '+' : ''}${delta} pts`;
}

function titleForItem(itemId: string, itemById: Map<string, FilmItem>) {
  return itemById.get(itemId)?.label ?? itemId;
}

export function getFightHistoryEntry(
  record: ComparisonRecord,
  item: FilmItem,
  itemById: Map<string, FilmItem>,
): FightHistoryEntry | undefined {
  const change = record.ratingChanges?.find((ratingChange) => ratingChange.itemId === item.id);

  switch (record.outcomeType) {
    case 'winner':
      if (record.winnerId === item.id && record.loserId) {
        return { record, text: `${item.label} won against ${titleForItem(record.loserId, itemById)}`, change };
      }

      if (record.loserId === item.id && record.winnerId) {
        return { record, text: `${item.label} lost to ${titleForItem(record.winnerId, itemById)}`, change };
      }

      return undefined;
    case 'tie':
      if (record.leftId === item.id && record.rightId) {
        return { record, text: `${item.label} tied with ${titleForItem(record.rightId, itemById)}`, change };
      }

      if (record.rightId === item.id && record.leftId) {
        return { record, text: `${item.label} tied with ${titleForItem(record.leftId, itemById)}`, change };
      }

      return undefined;
    case 'notSeen':
      return undefined;
    default:
      return record.outcomeType satisfies never;
  }
}
