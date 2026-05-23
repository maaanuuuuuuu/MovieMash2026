import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FlowFeedback } from '../comparison/useComparisonFlow';
import { filmItemById, filmItems, GLOBAL_FILM_SCOPE_ID } from '../content/filmSource';
import type { FilmItem } from '../content/types';
import { listRankingStates, persistOutcome } from '../persistence/rankingRepository';
import { getOrderedRanking } from '../rankingEngine/stability';
import {
  getCurrentTournamentMatchup,
  getNextTournamentMatchup,
  getTournamentPodium,
  getTournamentStageLabel,
  TOURNAMENT_PARTICIPANT_COUNT,
  type TournamentBracket,
} from './tournamentBracket';
import { advanceTournamentMatchup, getTournamentBracket, startTournamentBracket } from './tournamentRepository';

type TournamentBracketState =
  | { status: 'loading' }
  | { status: 'ready'; bracket: TournamentBracket | undefined };

export function useTournamentFlow() {
  const states = useLiveQuery(() => persistableStates(), [], undefined);
  const bracketState = useLiveQuery(
    async () => ({ status: 'ready', bracket: await getTournamentBracket() }),
    [],
    { status: 'loading' } as TournamentBracketState,
  );
  const [feedback, setFeedback] = useState<FlowFeedback | undefined>();
  const [isInteracting, setIsInteracting] = useState(false);
  const [isStartingTournament, setIsStartingTournament] = useState(false);
  const feedbackIdRef = useRef(0);
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
  const currentMatchup = currentBracket ? getCurrentTournamentMatchup(currentBracket) : undefined;
  const nextMatchup = currentBracket ? getNextTournamentMatchup(currentBracket) : undefined;
  const leftItem = currentMatchup ? filmItemById.get(currentMatchup.leftId) : undefined;
  const rightItem = currentMatchup ? filmItemById.get(currentMatchup.rightId) : undefined;
  const nextLeftItem = nextMatchup ? filmItemById.get(nextMatchup.leftId) : undefined;
  const nextRightItem = nextMatchup ? filmItemById.get(nextMatchup.rightId) : undefined;
  const podium = currentBracket ? getTournamentPodium(currentBracket) : null;
  const podiumItems = podium
    ? [podium.firstId, podium.secondId, podium.thirdId, podium.fourthId]
        .map((itemId) => filmItemById.get(itemId))
        .filter((item): item is FilmItem => item !== undefined)
    : [];
  const completedMatchCount = currentBracket?.completedMatches.length ?? 0;

  async function commitWinner(winnerId: string, loserId: string) {
    if (!currentMatchup || !currentBracket) {
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

    feedbackIdRef.current += 1;
    setFeedback({
      id: feedbackIdRef.current,
      kind: 'picked',
      label: 'Picked',
    });
    await advanceTournamentMatchup(currentMatchup, winnerId);
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
    bracket: currentBracket,
    completedMatchCount,
    currentRoundLabel: currentMatchup ? getTournamentStageLabel(currentMatchup.stage) : 'Tournament finished',
    feedback,
    isInteracting,
    isLoading:
      !states ||
      bracketState.status === 'loading' ||
      isStartingTournament ||
      (bracketState.status === 'ready' && !bracketState.bracket && canStartTournament),
    leftItem,
    nextLeftItem,
    nextRightItem,
    podiumItems,
    rightItem,
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
    setIsInteracting,
    startNewTournament,
  };
}

async function persistableStates() {
  return listRankingStates(GLOBAL_FILM_SCOPE_ID);
}
