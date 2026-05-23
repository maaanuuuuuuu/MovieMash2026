import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import type { FilmItem } from '../content/types';
import { filmItemById, filmItems, GLOBAL_FILM_SCOPE_ID } from '../content/filmSource';
import { listRankingStates, persistOutcome } from '../persistence/rankingRepository';
import { getOrderedRanking } from '../rankingEngine/stability';
import type { DecidedOutcome } from '../../domain/outcome';
import type { FlowFeedback } from '../comparison/useComparisonFlow';
import { COMPETITION_PARTICIPANT_COUNT, type CompetitionLeague } from './competitionLeague';
import { advanceCompetitionMatchup, getCompetitionLeague, startCompetitionLeague } from './competitionRepository';

type CompetitionLeagueState =
  | { status: 'loading' }
  | { status: 'ready'; league: CompetitionLeague | undefined };

function outcomeFeedbackLabel(outcome: DecidedOutcome) {
  return outcome.type === 'tie' ? 'Tie' : 'Picked';
}

function outcomeFeedbackKind(outcome: DecidedOutcome): FlowFeedback['kind'] {
  return outcome.type === 'tie' ? 'tie' : 'picked';
}

export function useCompetitionFlow() {
  const states = useLiveQuery(() => persistableStates(), [], undefined);
  const leagueState = useLiveQuery(
    async () => ({ status: 'ready', league: await getCompetitionLeague() }),
    [],
    { status: 'loading' } as CompetitionLeagueState,
  );
  const [feedback, setFeedback] = useState<FlowFeedback | undefined>();
  const [isInteracting, setIsInteracting] = useState(false);
  const [isStartingLeague, setIsStartingLeague] = useState(false);
  const canStartLeague = useMemo(
    () => (states ? getOrderedRanking(states).length >= COMPETITION_PARTICIPANT_COUNT : false),
    [states],
  );

  // Open the competition route into the stored league, or create the first one on demand.
  useEffect(() => {
    if (leagueState.status !== 'ready' || leagueState.league || isStartingLeague) {
      return;
    }

    if (!canStartLeague) {
      return;
    }

    void startCompetitionLeague();
  }, [canStartLeague, isStartingLeague, leagueState]);

  const currentLeague = leagueState.status === 'ready' ? leagueState.league : undefined;
  const currentMatchup = currentLeague?.remainingMatchups[0];
  const nextMatchup = currentLeague?.remainingMatchups[1];
  const leftItem = currentMatchup ? filmItemById.get(currentMatchup.leftId) : undefined;
  const rightItem = currentMatchup ? filmItemById.get(currentMatchup.rightId) : undefined;
  const nextLeftItem = nextMatchup ? filmItemById.get(nextMatchup.leftId) : undefined;
  const nextRightItem = nextMatchup ? filmItemById.get(nextMatchup.rightId) : undefined;
  const orderedRanking = useMemo(() => getOrderedRanking(states ?? []), [states]);
  const topThree = orderedRanking
    .slice(0, 3)
    .map((state) => filmItemById.get(state.itemId))
    .filter((item): item is FilmItem => item !== undefined);
  const completedMatchCount = currentLeague ? currentLeague.totalMatchups - currentLeague.remainingMatchups.length : 0;

  async function commitOutcome(outcome: DecidedOutcome) {
    if (!currentMatchup || !currentLeague) {
      return;
    }

    const result = await persistOutcome(GLOBAL_FILM_SCOPE_ID, outcome, filmItems.map((item) => item.id));

    if (!result.applied) {
      return;
    }

    setFeedback({
      id: Date.now(),
      kind: outcomeFeedbackKind(outcome),
      label: outcomeFeedbackLabel(outcome),
    });
    await advanceCompetitionMatchup(currentMatchup);
  }

  async function startNewLeague() {
    setIsStartingLeague(true);
    try {
      await startCompetitionLeague();
    } finally {
      setIsStartingLeague(false);
    }
  }

  return {
    feedback,
    isInteracting,
    isLoading:
      !states ||
      leagueState.status === 'loading' ||
      isStartingLeague ||
      (leagueState.status === 'ready' && !leagueState.league && canStartLeague),
    league: currentLeague,
    leftItem,
    rightItem,
    nextLeftItem,
    nextRightItem,
    completedMatchCount,
    topThree,
    chooseLeft: () => {
      if (!currentMatchup) {
        return;
      }

      void commitOutcome({ type: 'winner', winnerId: currentMatchup.leftId, loserId: currentMatchup.rightId });
    },
    chooseRight: () => {
      if (!currentMatchup) {
        return;
      }

      void commitOutcome({ type: 'winner', winnerId: currentMatchup.rightId, loserId: currentMatchup.leftId });
    },
    tie: () => {
      if (!currentMatchup) {
        return;
      }

      void commitOutcome({ type: 'tie', leftId: currentMatchup.leftId, rightId: currentMatchup.rightId });
    },
    setIsInteracting,
    startNewLeague,
  };
}

async function persistableStates() {
  return listRankingStates(GLOBAL_FILM_SCOPE_ID);
}
