import { useEffect, useState } from 'react';
import type { RankingItemState } from '../../domain/item';
import { useAuthSession } from '../auth/useAuthSession';
import { readFollowedPublicProfiles } from './socialRepository';
import { buildInterestedMovieSocialProof } from './socialProof';

type LoadedSocialProof = {
  itemId: string;
  lines: string[];
};

export function useInterestedMovieSocialProof(selectedState: RankingItemState | undefined) {
  const session = useAuthSession();
  const [loadedSocialProof, setLoadedSocialProof] = useState<LoadedSocialProof | undefined>(undefined);
  const eligibleItemId =
    session.status === 'signedIn' && selectedState?.notSeenDisposition === 'interested'
      ? selectedState.itemId
      : undefined;

  // Load followed public profiles only for interested movies opened in the ranking modal.
  useEffect(() => {
    if (session.status !== 'signedIn' || !eligibleItemId) {
      return undefined;
    }

    const signedInUser = session.user;
    const itemId = eligibleItemId;
    let cancelled = false;

    async function loadSocialProof() {
      try {
        const followedProfiles = await readFollowedPublicProfiles(signedInUser);

        if (!cancelled) {
          setLoadedSocialProof({
            itemId,
            lines: buildInterestedMovieSocialProof(followedProfiles, itemId),
          });
        }
      } catch {
        // Keep the modal quiet if the social read fails.
      }
    }

    void loadSocialProof();

    return () => {
      cancelled = true;
    };
  }, [eligibleItemId, selectedState?.itemId, session]);

  return {
    isLoading: eligibleItemId !== undefined && loadedSocialProof?.itemId !== eligibleItemId,
    lines: loadedSocialProof?.itemId === eligibleItemId ? loadedSocialProof?.lines ?? [] : [],
  };
}
