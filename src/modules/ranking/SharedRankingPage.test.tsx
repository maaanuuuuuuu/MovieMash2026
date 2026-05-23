import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SharedRankingPage } from './SharedRankingPage';
import { createSharedRankingSnapshot, encodeSharedRankingSnapshot } from './sharedRanking';

describe('shared ranking page', () => {
  it('renders a shared top list from the url payload', async () => {
    const payload = encodeSharedRankingSnapshot(createSharedRankingSnapshot('all', ['mad-max-fury-road', 'aliens']));

    window.location.hash = `#/shared-ranking?top=${payload}`;

    render(
      <HashRouter>
        <SharedRankingPage />
      </HashRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Shared top 2' })).toBeInTheDocument();
    expect(screen.getByText('Mad Max: Fury Road')).toBeInTheDocument();
    expect(screen.getByText('Aliens')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try the app' })).toHaveAttribute('href', '#/');
  });

  it('shows a fallback state for a broken share link', async () => {
    window.location.hash = '#/shared-ranking?top=broken';

    render(
      <HashRouter>
        <SharedRankingPage />
      </HashRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Share link not available' })).toBeInTheDocument();
  });
});
