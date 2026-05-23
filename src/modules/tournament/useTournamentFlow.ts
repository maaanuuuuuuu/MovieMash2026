import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import type { FilmItem } from '../content/types';
import { filmItemById, filmItems, GLOBAL_FILM_SCOPE_ID } from '../content/filmSource';
import { listRankingStates, persistOutcome } from '../persistence/rankingRepository';
import { getOrderedRanking } from '../rankingEngine/stability';
import type { FlowFeedback } from '../comparison/useComparisonFlow';
import {
  TOURNAMENT_PARTICIPANT_COUNT,
  getActiveTournamentRound,
  getTournamentPodium,
  type TournamentBracket,
} from './tournamentBracket';
import { advanceTournamentMatchup, getTournamentBracket, startTournamentBracket } from './tournamentRepository';

type TournamentBracketState =
  | { status: 'loading' }
  | { status: 'ready'; bracket: TournamentBracket | undefined };

type TournamentSeed = {
  itemId: string;
  seed: number;
};

export function useTournamentFlow() {
  const states = useLiveQuery(() => listRankingStates(GLOBAL_FILM_SCOPE_ID), [], undefined);
  const bracketState = useLiveQuery(
    async () => ({ status: 'ready', bracket: await getTournamentBracket() }),
    [],
    { status: 'loading' } as TournamentBracketState,
  );
  const [feedback, setFeedback] = useState<FlowFeedback | undefined>();
  const [isInteracting, setIsInteracting] = useState(false);
  const [isStartingTournament, setIsStartingTournament] = useState(false);
  const canStartTournament = useMemo(
    () => (states ? getOrderedRanking(states).length >= TOURNAMENT_PARTICIPANT_COUNT : false),
    [states],
  );

  // Open the tournament route into the stored bracket, or create the first one on demand.
  useEffect(() => {
    if (bracketState.status !== 'ready' || bracketState.bracket || isStartingTournament) {
      return;
    }

    if (!canStartTournament) {
      return;
    }

    void startTournamentBracket();
  }, [bracketState, canStartTournament, isStartingTournament]);

  const currentBracket = bracketState.status === 'ready' ? bracketState.bracket : undefined;
  const currentMatchup = currentBracket?.pendingMatchups[0];
  const nextMatchup = currentBracket?.pendingMatchups[1];
  const leftItem = currentMatchup ? filmItemById.get(currentMatchup.leftId) : undefined;
  const rightItem = currentMatchup ? filmItemById.get(currentMatchup.rightId) : undefined;
  const nextLeftItem = nextMatchup ? filmItemById.get(nextMatchup.leftId) : undefined;
  const nextRightItem = nextMatchup ? filmItemById.get(nextMatchup.rightId) : undefined;
  const activeRound = currentBracket ? getActiveTournamentRound(currentBracket) : 'round-of-16';
  const podium = (currentBracket ? getTournamentPodium(currentBracket) : [])
    .map((itemId) => filmItemById.get(itemId))
    .filter((item): item is FilmItem => item !== undefined);
  const seedMap = useMemo(() => {
    if (!currentBracket) {
      return new Map<string, number>();
    }

    return new Map<string, number>(currentBracket.participantIds.map((itemId, index) => [itemId, index + 1]));
  }, [currentBracket]);

  function getSeed(itemId: string | undefined): TournamentSeed | undefined {
    if (!itemId) {
      return undefined;
    }

    const seed = seedMap.get(itemId);

    if (!seed) {
      return undefined;
    }

    return { itemId, seed };
  }

  async function commitWinner(winnerId: string, loserId: string) {
    if (!currentMatchup) {
      return;
    }

    const result = await persistOutcome(
      GLOBAL_FILM_SCOPE_ID,
      { type: 'winner', winnerId, loserId },
      filmItems.map((item) => item.id),
    );

    if (!result.applied) {
      return;
    }

    setFeedback({
      id: Date.now(),
      kind: 'picked',
      label: 'Picked',
    });
    await advanceTournamentMatchup(currentMatchup, winnerId, loserId);
  }

  async function startNewTournament() {
    setIsStartingTournament(true);
    try {
      await startTournamentBracket();
    } finally {
      setIsStartingTournament(false);
    }
  }

  return {
    activeRound,
    bracket: currentBracket,
    feedback,
    isInteracting,
    isLoading:
      !states ||
      bracketState.status === 'loading' ||
      isStartingTournament ||
      (bracketState.status === 'ready' && !bracketState.bracket && canStartTournament),
    leftItem,
    leftSeed: getSeed(currentMatchup?.leftId),
    nextLeftItem,
    nextRightItem,
    pendingCount: currentBracket?.pendingMatchups.length ?? 0,
    playedCount: currentBracket?.completedMatchups.length ?? 0,
    podium,
    rightItem,
    rightSeed: getSeed(currentMatchup?.rightId),
    startNewTournament,
    setIsInteracting,
    chooseLeft: () => {
      if (!currentMatchup) {
        return;
      }

      void commitWinner(currentMatchup.leftId, currentMatchup.rightId);
    },
    chooseRight: () => {
      if (!currentMatchup) {
        return;
      }

      void commitWinner(currentMatchup.rightId, currentMatchup.leftId);
    },
  };
}
