import { Share2 } from 'lucide-react';
import { useState } from 'react';
import type { FilmFilter } from '../content/filmSource';
import { createSharedRankingSnapshot, createSharedRankingUrl } from './sharedRanking';

type ShareRankingButtonProps = {
  filter: FilmFilter;
  topItemIds: string[];
};

type ShareState = 'idle' | 'shared' | 'copied' | 'failed';

function getShareLabel(state: ShareState) {
  switch (state) {
    case 'shared':
      return 'Share opened';
    case 'copied':
      return 'Link copied';
    case 'failed':
      return 'Share failed';
    case 'idle':
      return 'Share top 20';
    default:
      return state satisfies never;
  }
}

export function ShareRankingButton({ filter, topItemIds }: ShareRankingButtonProps) {
  const [shareState, setShareState] = useState<ShareState>('idle');

  async function handleShare() {
    if (topItemIds.length === 0) {
      return;
    }

    const snapshot = createSharedRankingSnapshot(filter.id, topItemIds);
    const shareUrl = createSharedRankingUrl(snapshot, window.location.href);
    const title = `${filter.shortLabel} top ${snapshot.topItemIds.length}`;
    const text = `Try my MovieMash top ${snapshot.topItemIds.length}.`;

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, text, url: shareUrl });
        setShareState('shared');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareState('copied');
        return;
      }
    } catch {
      setShareState('failed');
      return;
    }

    setShareState('failed');
  }

  return (
    <button
      type="button"
      className="ranking-page__share"
      onClick={() => {
        void handleShare();
      }}
      aria-label="Share top 20"
      title="Share top 20"
      disabled={topItemIds.length === 0}
    >
      <Share2 aria-hidden="true" size={22} />
      <span>{getShareLabel(shareState)}</span>
    </button>
  );
}
