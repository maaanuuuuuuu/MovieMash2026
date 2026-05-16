import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../modules/persistence/db';
import { App } from './App';
import { swipeFirstPoster, swipeRankingRow } from './App.test.utils';

describe('main app swipe flow', () => {
  beforeEach(async () => {
    window.location.hash = '';
    await resetDatabase();
  });

  it('can undo an interested swipe from the comparison screen', async () => {
    render(<App />);

    const originalChoices = (await screen.findAllByRole('button', { name: /^Choose / })).map((choice) =>
      choice.getAttribute('aria-label'),
    );
    await swipeFirstPoster(0, -160, 'interested');

    expect(await screen.findByText('Interested')).toBeInTheDocument();
    expect(await screen.findByLabelText('Undo last swipe')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Undo last swipe'));

    await waitFor(() => {
      expect(screen.queryByLabelText('Undo last swipe')).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /^Choose / }).map((choice) => choice.getAttribute('aria-label'))).toEqual(
      originalChoices,
    );
  });

  it('returns the card when the swipe is mostly horizontal', async () => {
    render(<App />);

    const originalChoices = (await screen.findAllByRole('button', { name: /^Choose / })).map((choice) =>
      choice.getAttribute('aria-label'),
    );

    await swipeFirstPoster(170, 20);

    expect(screen.queryByLabelText('Undo last swipe')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Choose / }).map((choice) => choice.getAttribute('aria-label'))).toEqual(
      originalChoices,
    );
    expect(screen.getByText('0 picks')).toBeInTheDocument();
  });

  it('returns the card when an interested swipe is below the threshold', async () => {
    render(<App />);

    const originalChoices = (await screen.findAllByRole('button', { name: /^Choose / })).map((choice) =>
      choice.getAttribute('aria-label'),
    );

    await swipeFirstPoster(0, -90);

    expect(screen.queryByLabelText('Undo last swipe')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Choose / }).map((choice) => choice.getAttribute('aria-label'))).toEqual(
      originalChoices,
    );
    expect(screen.getByText('0 picks')).toBeInTheDocument();
  });

  it('can undo a removed swipe from the comparison screen', async () => {
    render(<App />);

    const originalChoices = (await screen.findAllByRole('button', { name: /^Choose / })).map((choice) =>
      choice.getAttribute('aria-label'),
    );
    await swipeFirstPoster(0, 160, 'removed');

    expect(await screen.findByText('Removed')).toBeInTheDocument();
    expect(await screen.findByLabelText('Undo last swipe')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Undo last swipe'));

    await waitFor(() => {
      expect(screen.queryByLabelText('Undo last swipe')).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /^Choose / }).map((choice) => choice.getAttribute('aria-label'))).toEqual(
      originalChoices,
    );
  });

  it('saves a ranking row as interested and restores it', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findAllByRole('button', { name: /^Choose / });
    await user.click(screen.getByLabelText('Open ranking'));

    const rowButton = (await screen.findAllByRole('button', { name: /Open fight history for / }))[0];
    const itemLabel = rowButton.getAttribute('aria-label')?.replace('Open fight history for ', '') ?? '';

    await swipeRankingRow(rowButton, 160, 20);

    expect(await screen.findByText(`${itemLabel} saved as interested`)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Interested' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Interested movies')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Open saved movies'));

    expect(await screen.findByRole('heading', { name: 'Saved movies' })).toBeInTheDocument();
    expect(screen.getByText(itemLabel)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Restore/ }));

    expect(await screen.findByText(`${itemLabel} restored`)).toBeInTheDocument();
    await user.click(screen.getByLabelText('Back to ranking'));

    expect(await screen.findByRole('button', { name: `Open fight history for ${itemLabel}` })).toBeInTheDocument();
  });

  it('removes a movie from ranking after a swipe', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findAllByRole('button', { name: /^Choose / });
    await user.click(screen.getByLabelText('Open ranking'));

    const beforeCount = screen.getAllByRole('listitem').length;
    const rowButton = (await screen.findAllByRole('button', { name: /Open fight history for / }))[0];

    await swipeRankingRow(rowButton, 10, 140);

    await waitFor(() => {
      expect(screen.getAllByRole('listitem').length).toBe(beforeCount - 1);
    });
    expect(screen.getByText(/removed$/)).toBeInTheDocument();
  });

  it('saves a right-swiped ranking row in the removed saved view', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findAllByRole('button', { name: /^Choose / });
    await user.click(screen.getByLabelText('Open ranking'));

    const rowButton = (await screen.findAllByRole('button', { name: /Open fight history for / }))[0];
    const itemLabel = rowButton.getAttribute('aria-label')?.replace('Open fight history for ', '') ?? '';

    await swipeRankingRow(rowButton, 10, 140);

    expect(await screen.findByText(`${itemLabel} removed`)).toBeInTheDocument();
    await user.click(screen.getByLabelText('Open saved movies'));
    await user.click(await screen.findByRole('tab', { name: /Removed/ }));

    expect(await screen.findByText(itemLabel)).toBeInTheDocument();
  });
});
