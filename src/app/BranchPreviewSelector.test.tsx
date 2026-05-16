import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BranchPreviewSelector } from './BranchPreviewSelector';
import {
  findCurrentDeployment,
  getPreviewContext,
  getPreviewRedirectUrl,
  type PreviewDeployment,
} from './BranchPreviewSelectorModel';

const deployments: PreviewDeployment[] = [
  {
    id: 'main',
    name: 'main',
    branch: 'main',
    kind: 'main',
    url: 'https://manudesir.github.io/MovieMash2026/',
    updatedAt: '2026-05-02T10:00:00.000Z',
    sha: 'main-sha',
  },
  {
    id: 'pr-1',
    name: 'PR #1 - feature/action-movie-list',
    branch: 'feature/action-movie-list',
    kind: 'pull_request',
    prNumber: 1,
    url: 'https://manudesir.github.io/MovieMash2026/previews/pr-1/',
    updatedAt: '2026-05-02T11:00:00.000Z',
    sha: 'preview-sha',
  },
];

describe('GitHub Pages preview selector', () => {
  it('builds the manifest URL from a preview base path', () => {
    expect(getPreviewContext('/MovieMash2026/previews/pr-1/', 'https://manudesir.github.io')).toEqual({
      currentBasePath: '/MovieMash2026/previews/pr-1/',
      manifestUrl: 'https://manudesir.github.io/MovieMash2026/previews/manifest.json',
    });
  });

  it('stays hidden for the normal app base path', () => {
    render(<BranchPreviewSelector />);

    expect(screen.queryByLabelText('GitHub Pages preview selector')).not.toBeInTheDocument();
  });

  it('matches the current deployment by preview path', () => {
    expect(findCurrentDeployment(deployments, '/MovieMash2026/previews/pr-1/')).toEqual(deployments[1]);
  });

  it('keeps the current hash when switching previews', () => {
    expect(getPreviewRedirectUrl(deployments[0], '#/action/ranking')).toBe(
      'https://manudesir.github.io/MovieMash2026/#/action/ranking',
    );
  });
});
