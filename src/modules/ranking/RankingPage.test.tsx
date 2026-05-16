import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RankingItemState } from '../../domain/item';
import { GLOBAL_FILM_SCOPE_ID, actionFilmFilter, filmItems, filmItemsByFilterId } from '../content/filmSource';
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
    notSeenDisposition: null,
    createdAt: index,
    updatedAt: index,
  };
}

describe('filtered ranking page', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('shows filtered rows with global fight history', async () => {
    const user = userEvent.setup();
    const actionItems = filmItemsByFilterId.action;
    const actionIds = new Set(actionItems.map((item) => item.id));
    const subject = actionItems.find((item) => item.id === 'predator') ?? actionItems[0];
    const actionOpponent = actionItems.find((item) => item.id !== subject.id);
    const outsideOpponent = filmItemsByFilterId.comedy.find((item) => !actionIds.has(item.id));

    if (!actionOpponent) {
      throw new Error('Expected at least two action items for fight history.');
    }

    if (!outsideOpponent) {
      throw new Error('Expected at least one comedy-only item for catalog scoping.');
    }

    await db.catalogRankingStates.bulkPut(
      filmItems.map((item, index) =>
        state(GLOBAL_FILM_SCOPE_ID, item.id, item.id === subject.id ? 1500 : 1000 - index, index),
      ),
    );
    await db.comparisons.bulkPut([
      {
        id: 'inside-action',
        catalogId: GLOBAL_FILM_SCOPE_ID,
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
        catalogId: GLOBAL_FILM_SCOPE_ID,
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
        <RankingPage filter={actionFilmFilter} />
      </HashRouter>,
    );

    await user.click(await screen.findByRole('button', { name: `Open fight history for ${subject.label}` }));

    expect(await screen.findByRole('dialog', { name: subject.label })).toBeInTheDocument();
    expect(screen.getByText(`${subject.label} won against ${actionOpponent.label}`)).toBeInTheDocument();
    expect(screen.getByText(`${subject.label} won against ${outsideOpponent.label}`)).toBeInTheDocument();
  });

  it('links back to the active filter comparison route', () => {
    render(
      <HashRouter>
        <RankingPage filter={actionFilmFilter} />
      </HashRouter>,
    );

    expect(screen.getByLabelText('Back to comparisons')).toHaveAttribute('href', '#/action');
  });
});
