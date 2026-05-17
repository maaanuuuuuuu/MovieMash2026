import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { GLOBAL_FILM_SCOPE_ID, filmItemsByFilterId, type FilmFilterId } from '../modules/content/filmSource';
import { db, resetDatabase } from '../modules/persistence/db';
import { createInitialRankingState } from '../modules/rankingEngine/rating';
import { App } from './App';

async function seedStableTop(filterId: FilmFilterId, count: number) {
  const now = Date.now();
  const states = filmItemsByFilterId[filterId].slice(0, count).map((item, index) => ({
    ...createInitialRankingState(GLOBAL_FILM_SCOPE_ID, item.id, now),
    appearances: 8,
    rating: 2000 - index,
  }));

  await db.catalogRankingStates.bulkPut(states);
}

describe('main app flow', () => {
  beforeEach(async () => {
    window.location.hash = '';
    await resetDatabase();
  });

  it('starts on the comparison screen and records a choice', async () => {
    const user = userEvent.setup();
    render(<App />);

    const choices = await screen.findAllByRole('button', { name: /^Choose / });
    await user.click(choices[0]);

    await waitFor(() => {
      expect(screen.getByText('1 picks')).toBeInTheDocument();
    });
  });

  it('can undo the last vote from the comparison screen', async () => {
    const user = userEvent.setup();
    render(<App />);

    const originalChoices = (await screen.findAllByRole('button', { name: /^Choose / })).map((choice) =>
      choice.getAttribute('aria-label'),
    );
    await user.click((await screen.findAllByRole('button', { name: /^Choose / }))[0]);

    expect(await screen.findByLabelText('Undo last vote')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Undo last vote'));

    await waitFor(() => {
      expect(screen.getByText('0 picks')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /^Choose / }).map((choice) => choice.getAttribute('aria-label'))).toEqual(
      originalChoices,
    );
  });

  it('can undo the last tie from the comparison screen', async () => {
    const user = userEvent.setup();
    render(<App />);

    const originalChoices = (await screen.findAllByRole('button', { name: /^Choose / })).map((choice) =>
      choice.getAttribute('aria-label'),
    );
    await user.click(screen.getByRole('button', { name: 'Mark this pair as a tie' }));

    expect(await screen.findByLabelText('Undo last vote')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Undo last vote'));

    await waitFor(() => {
      expect(screen.getByText('0 picks')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /^Choose / }).map((choice) => choice.getAttribute('aria-label'))).toEqual(
      originalChoices,
    );
  });

  it('opens the separate ranking page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findAllByRole('button', { name: /^Choose / });
    await user.click(screen.getByLabelText('Open ranking'));

    expect(await screen.findByRole('heading', { name: 'Your ranking' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('uses action as a global ranking filter', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findAllByRole('button', { name: /^Choose / });
    await user.click(screen.getByRole('link', { name: 'Action' }));

    expect(await screen.findByRole('heading', { name: 'Action movies' })).toBeInTheDocument();
    expect(await screen.findByText(`${filmItemsByFilterId.action.length} total`)).toBeInTheDocument();

    const firstChoices = (await screen.findAllByRole('button', { name: /^Choose / })).map((choice) =>
      choice.getAttribute('aria-label'),
    );
    await user.click((await screen.findAllByRole('button', { name: /^Choose / }))[0]);

    await waitFor(() => {
      expect(screen.getByText('1 picks')).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText('Open ranking'));

    expect(await screen.findByRole('heading', { name: 'Your ranking' })).toBeInTheDocument();
    expect(screen.getByText('Action filter')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(filmItemsByFilterId.action.length);

    await user.click(screen.getByLabelText('Back to comparisons'));

    expect(await screen.findByRole('heading', { name: 'Action movies' })).toBeInTheDocument();
    expect((await screen.findAllByRole('button', { name: /^Choose / })).map((choice) => choice.getAttribute('aria-label'))).not.toEqual(
      firstChoices,
    );
  });

  it('opens the science fiction ranking filter directly and returns to science fiction comparisons', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/science-fiction/ranking';
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Your ranking' })).toBeInTheDocument();
    expect(screen.getByText('Science Fiction filter')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(filmItemsByFilterId['science-fiction'].length);

    await user.click(screen.getByLabelText('Back to comparisons'));

    expect(await screen.findByRole('heading', { name: 'Science Fiction movies' })).toBeInTheDocument();
    expect(await screen.findByText(`${filmItemsByFilterId['science-fiction'].length} total`)).toBeInTheDocument();
  });

  it('opens the science fiction saved filter directly', async () => {
    window.location.hash = '#/science-fiction/saved';
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Saved movies' })).toBeInTheDocument();
    expect(screen.getByText('Science Fiction filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Back to ranking')).toHaveAttribute('href', '#/science-fiction/ranking');
  });

  it('shows a stable top milestone once for the current filter', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/action';
    await seedStableTop('action', 10);
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Action movies' })).toBeInTheDocument();
    await user.click((await screen.findAllByRole('button', { name: /^Choose / }))[0]);

    expect(await screen.findByText('Your first stable top 10 is ready. Wanna see?')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'See ranking' }));

    expect(await screen.findByRole('heading', { name: 'Your ranking' })).toBeInTheDocument();
    expect(screen.getByText('Action filter')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Back to comparisons'));
    expect(await screen.findByRole('heading', { name: 'Action movies' })).toBeInTheDocument();
    await user.click((await screen.findAllByRole('button', { name: /^Choose / }))[0]);

    await waitFor(() => {
      expect(screen.getByText('2 picks')).toBeInTheDocument();
    });
    expect(screen.queryByText('Your first stable top 10 is ready. Wanna see?')).not.toBeInTheDocument();
  });

  it('returns to the same fight after visiting ranking', async () => {
    const user = userEvent.setup();
    render(<App />);

    const firstChoices = await screen.findAllByRole('button', { name: /^Choose / });
    const firstLabels = firstChoices.map((choice) => choice.getAttribute('aria-label'));
    await user.click(screen.getByLabelText('Open ranking'));

    expect(await screen.findByRole('heading', { name: 'Your ranking' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('Back to comparisons'));

    const returnedChoices = await screen.findAllByRole('button', { name: /^Choose / });
    expect(returnedChoices.map((choice) => choice.getAttribute('aria-label'))).toEqual(firstLabels);
  });

  it('opens fight history from both sides of a result', async () => {
    const user = userEvent.setup();
    render(<App />);

    const choices = await screen.findAllByRole('button', { name: /^Choose / });
    const winnerTitle = choices[0].getAttribute('aria-label')?.replace('Choose ', '') ?? '';
    const loserTitle = choices[1].getAttribute('aria-label')?.replace('Choose ', '') ?? '';
    const winnerPosterSrc = choices[0].querySelector('img')?.getAttribute('src') ?? '';
    const loserPosterSrc = choices[1].querySelector('img')?.getAttribute('src') ?? '';
    await user.click(choices[0]);

    await waitFor(() => {
      expect(screen.getByText('1 picks')).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText('Open ranking'));
    const rankingRows = await screen.findAllByRole('button', { name: /Open fight history for / });
    const winnerRow = rankingRows.find((row) => row.querySelector('img')?.getAttribute('src') === winnerPosterSrc);
    const loserRow = rankingRows.find((row) => row.querySelector('img')?.getAttribute('src') === loserPosterSrc);

    if (!winnerRow || !loserRow) {
      throw new Error('Expected both compared movies in the ranking.');
    }

    await user.click(winnerRow);

    expect(await screen.findByRole('dialog', { name: winnerTitle })).toBeInTheDocument();
    expect(screen.getByText(`${winnerTitle} won against ${loserTitle}`)).toBeInTheDocument();
    expect(screen.getByText(/\+22 pts/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close fight history' }));

    await user.click(loserRow);

    expect(await screen.findByRole('dialog', { name: loserTitle })).toBeInTheDocument();
    expect(screen.getByText(`${loserTitle} lost to ${winnerTitle}`)).toBeInTheDocument();
    expect(screen.getByText(/-22 pts/)).toBeInTheDocument();
  });

});
