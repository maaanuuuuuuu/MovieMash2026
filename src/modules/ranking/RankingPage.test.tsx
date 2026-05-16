import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RankingItemState } from '../../domain/item';
import { actionFilmCatalog, filmItemsByCatalogId } from '../content/filmSource';
import { db, resetDatabase } from '../persistence/db';
import { RankingPage } from './RankingPage';

function state(catalogId: string, itemId: string, rating: number, index: number): RankingItemState {
  return {
    catalogId,
    itemId,
    rating,
    appearances: 1,
    wins: 0,
    losses: 0,
    ties: 0,
    active: true,
    notSeen: false,
    createdAt: index,
    updatedAt: index,
  };
}

describe('catalog ranking page', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('filters fight history to records fully inside the active catalog', async () => {
    const user = userEvent.setup();
    const actionItems = filmItemsByCatalogId.action;
    const actionIds = new Set(actionItems.map((item) => item.id));
    const subject = actionItems.find((item) => item.id === 'predator') ?? actionItems[0];
    const actionOpponent = actionItems.find((item) => item.id !== subject.id);
    const outsideOpponent = filmItemsByCatalogId.comedy.find((item) => !actionIds.has(item.id));

    if (!actionOpponent) {
      throw new Error('Expected at least two action items for fight history.');
    }

    if (!outsideOpponent) {
      throw new Error('Expected at least one comedy-only item for catalog scoping.');
    }

    await db.catalogRankingStates.bulkPut(
      actionItems.map((item, index) =>
        state(actionFilmCatalog.id, item.id, item.id === subject.id ? 1500 : 1000 - index, index),
      ),
    );
    await db.catalogRankingStates.put(state(actionFilmCatalog.id, outsideOpponent.id, 1600, 100));
    await db.comparisons.bulkPut([
      {
        id: 'inside-action',
        catalogId: actionFilmCatalog.id,
        outcomeType: 'winner',
        winnerId: subject.id,
        loserId: actionOpponent.id,
        ratingChanges: [
          { itemId: subject.id, beforeRating: 1478, afterRating: 1500, delta: 22 },
          { itemId: actionOpponent.id, beforeRating: 1022, afterRating: 1000, delta: -22 },
        ],
        createdAt: 2,
      },
      {
        id: 'outside-action',
        catalogId: actionFilmCatalog.id,
        outcomeType: 'winner',
        winnerId: subject.id,
        loserId: outsideOpponent.id,
        ratingChanges: [
          { itemId: subject.id, beforeRating: 1450, afterRating: 1478, delta: 28 },
          { itemId: outsideOpponent.id, beforeRating: 1600, afterRating: 1572, delta: -28 },
        ],
        createdAt: 1,
      },
    ]);

    render(
      <HashRouter>
        <RankingPage catalog={actionFilmCatalog} />
      </HashRouter>,
    );

    await user.click(await screen.findByRole('button', { name: `Open fight history for ${subject.label}` }));

    expect(await screen.findByRole('dialog', { name: subject.label })).toBeInTheDocument();
    expect(screen.getByText(`${subject.label} won against ${actionOpponent.label}`)).toBeInTheDocument();
    expect(screen.queryByText(`${subject.label} won against ${outsideOpponent.id}`)).not.toBeInTheDocument();
  });

  it('links back to the active catalog comparison route', () => {
    render(
      <HashRouter>
        <RankingPage catalog={actionFilmCatalog} />
      </HashRouter>,
    );

    expect(screen.getByLabelText('Back to comparisons')).toHaveAttribute('href', '#/action');
  });
});
