import { getOrderedRanking } from '../rankingEngine/stability';
import type { RankingItemState } from '../../domain/item';

export const COMPETITION_PARTICIPANT_COUNT = 20;

export type CompetitionMatchup = {
  leftId: string;
  rightId: string;
};

export type CompetitionLeague = {
  id: string;
  participantIds: string[];
  remainingMatchups: CompetitionMatchup[];
  totalMatchups: number;
  createdAt: number;
  completedAt: number | null;
};

export function createCompetitionMatchups(participantIds: readonly string[]) {
  const matchups: CompetitionMatchup[] = [];

  for (let leftIndex = 0; leftIndex < participantIds.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < participantIds.length; rightIndex += 1) {
      matchups.push({
        leftId: participantIds[leftIndex] ?? '',
        rightId: participantIds[rightIndex] ?? '',
      });
    }
  }

  return matchups;
}

export function createCompetitionLeague(participantIds: readonly string[], createdAt: number): CompetitionLeague {
  const remainingMatchups = createCompetitionMatchups(participantIds);

  return {
    id: `competition-${createdAt}`,
    participantIds: [...participantIds],
    remainingMatchups,
    totalMatchups: remainingMatchups.length,
    createdAt,
    completedAt: null,
  };
}

export function advanceCompetitionLeague(
  league: CompetitionLeague,
  matchup: CompetitionMatchup,
  now: number,
): CompetitionLeague {
  const remainingMatchups = league.remainingMatchups.filter(
    (candidate) => !(candidate.leftId === matchup.leftId && candidate.rightId === matchup.rightId),
  );

  return {
    ...league,
    remainingMatchups,
    completedAt: remainingMatchups.length === 0 ? now : null,
  };
}

export function getCompetitionParticipants(states: RankingItemState[]) {
  return getOrderedRanking(states)
    .slice(0, COMPETITION_PARTICIPANT_COUNT)
    .map((state) => state.itemId);
}
