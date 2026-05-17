import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RankingItemState } from '../../domain/item';
import { GLOBAL_FILM_SCOPE_ID, actionFilmFilter, filmItems, filmItemsByFilterId } from '../content/filmSource';
import { db, resetDatabase } from '../persistence/db';
import { RankingPage } from './RankingPage';
import { SavedMoviesPage } from './SavedMoviesPage';

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

function savedState(itemId: string, index: number): RankingItemState {
  return {
    ...state(GLOBAL_FILM_SCOPE_ID, itemId, 1000, index),
    active: false,
    notSeen: true,
    notSeenDisposition: 'interested',
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

  it('shows genre filters on the ranking page and keeps the ranking route', () => {
    render(
      <HashRouter>
        <RankingPage filter={actionFilmFilter} />
      </HashRouter>,
    );

    const filterNav = screen.getByRole('navigation', { name: 'Genre filter' });

    expect(within(filterNav).getByRole('link', { name: 'All' })).toHaveAttribute('href', '#/ranking');
    expect(within(filterNav).getByRole('link', { name: 'Action' })).toHaveAttribute('href', '#/action/ranking');
    expect(within(filterNav).getByRole('link', { name: 'Action' })).toHaveClass('film-filter-switch__link--active');
    expect(within(filterNav).getByRole('link', { name: 'Science Fiction' })).toHaveAttribute(
      'href',
      '#/science-fiction/ranking',
    );
    expect(within(filterNav).getByRole('link', { name: 'Western' })).toHaveAttribute('href', '#/western/ranking');
  });

  it('does not show interested movies above the ranking list', async () => {
    const actionItem = filmItemsByFilterId.action[0];
    await db.catalogRankingStates.bulkPut([savedState(actionItem.id, 1)]);

    render(
      <HashRouter>
        <RankingPage filter={actionFilmFilter} />
      </HashRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText(actionItem.label)).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Interested' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Interested movies')).not.toBeInTheDocument();
  });

  it('shows only saved movies from the active filter', async () => {
    const actionItems = filmItemsByFilterId.action;
    const actionIds = new Set(actionItems.map((item) => item.id));
    const actionItem = actionItems[0];
    const outsideItem = filmItems.find((item) => !actionIds.has(item.id));

    if (!outsideItem) {
      throw new Error('Expected at least one item outside the action filter.');
    }

    await db.catalogRankingStates.bulkPut([savedState(actionItem.id, 2), savedState(outsideItem.id, 1)]);

    render(
      <HashRouter>
        <SavedMoviesPage filter={actionFilmFilter} />
      </HashRouter>,
    );

    expect(await screen.findByText(actionItem.label)).toBeInTheDocument();
    expect(screen.queryByText(outsideItem.label)).not.toBeInTheDocument();
  });

  it('shows genre filters on the saved page and keeps the saved route', () => {
    render(
      <HashRouter>
        <SavedMoviesPage filter={actionFilmFilter} />
      </HashRouter>,
    );

    const filterNav = screen.getByRole('navigation', { name: 'Genre filter' });

    expect(within(filterNav).getByRole('link', { name: 'All' })).toHaveAttribute('href', '#/saved');
    expect(within(filterNav).getByRole('link', { name: 'Action' })).toHaveAttribute('href', '#/action/saved');
    expect(within(filterNav).getByRole('link', { name: 'Action' })).toHaveClass('film-filter-switch__link--active');
    expect(within(filterNav).getByRole('link', { name: 'Science Fiction' })).toHaveAttribute(
      'href',
      '#/science-fiction/saved',
    );
    expect(within(filterNav).getByRole('link', { name: 'Western' })).toHaveAttribute('href', '#/western/saved');
  });
});
