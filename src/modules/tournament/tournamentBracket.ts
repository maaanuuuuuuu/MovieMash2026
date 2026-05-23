import type { RankingItemState } from '../../domain/item';
import { getOrderedRanking } from '../rankingEngine/stability';

export const TOURNAMENT_PARTICIPANT_COUNT = 16;

export type TournamentRound = 'round-of-16' | 'quarterfinal' | 'semifinal' | 'third-place' | 'final';

export type TournamentMatchup = {
  id: string;
  round: TournamentRound;
  leftId: string;
  rightId: string;
};

export type TournamentResult = TournamentMatchup & {
  winnerId: string;
  loserId: string;
  decidedAt: number;
};

export type TournamentBracket = {
  id: string;
  participantIds: string[];
  pendingMatchups: TournamentMatchup[];
  completedMatchups: TournamentResult[];
  createdAt: number;
  completedAt: number | null;
};

const ROUND_ORDER: TournamentRound[] = ['round-of-16', 'quarterfinal', 'semifinal', 'third-place', 'final'];
const ROUND_OF_16_PAIRINGS: Array<[number, number]> = [
  [0, 15],
  [7, 8],
  [4, 11],
  [3, 12],
  [5, 10],
  [2, 13],
  [6, 9],
  [1, 14],
];

function createMatchup(round: TournamentRound, index: number, leftId: string, rightId: string): TournamentMatchup {
  return {
    id: `${round}-${index + 1}`,
    round,
    leftId,
    rightId,
  };
}

function createRoundMatchups(
  round: TournamentRound,
  orderedParticipantIds: readonly string[],
  pairings: ReadonlyArray<readonly [number, number]>,
) {
  return pairings.map(([leftIndex, rightIndex], index) =>
    createMatchup(round, index, orderedParticipantIds[leftIndex] ?? '', orderedParticipantIds[rightIndex] ?? ''),
  );
}

function getRoundResults(results: readonly TournamentResult[], round: TournamentRound) {
  return results.filter((result) => result.round === round);
}

function createQuarterfinals(results: readonly TournamentResult[]) {
  const roundResults = getRoundResults(results, 'round-of-16');

  if (roundResults.length !== 8) {
    return [];
  }

  return [
    createMatchup('quarterfinal', 0, roundResults[0]?.winnerId ?? '', roundResults[1]?.winnerId ?? ''),
    createMatchup('quarterfinal', 1, roundResults[2]?.winnerId ?? '', roundResults[3]?.winnerId ?? ''),
    createMatchup('quarterfinal', 2, roundResults[4]?.winnerId ?? '', roundResults[5]?.winnerId ?? ''),
    createMatchup('quarterfinal', 3, roundResults[6]?.winnerId ?? '', roundResults[7]?.winnerId ?? ''),
  ];
}

function createSemifinals(results: readonly TournamentResult[]) {
  const quarterfinals = getRoundResults(results, 'quarterfinal');

  if (quarterfinals.length !== 4) {
    return [];
  }

  return [
    createMatchup('semifinal', 0, quarterfinals[0]?.winnerId ?? '', quarterfinals[1]?.winnerId ?? ''),
    createMatchup('semifinal', 1, quarterfinals[2]?.winnerId ?? '', quarterfinals[3]?.winnerId ?? ''),
  ];
}

function createPlacementFinals(results: readonly TournamentResult[]) {
  const semifinals = getRoundResults(results, 'semifinal');

  if (semifinals.length !== 2) {
    return [];
  }

  return [
    createMatchup('third-place', 0, semifinals[0]?.loserId ?? '', semifinals[1]?.loserId ?? ''),
    createMatchup('final', 0, semifinals[0]?.winnerId ?? '', semifinals[1]?.winnerId ?? ''),
  ];
}

function getNextPendingMatchups(results: readonly TournamentResult[]) {
  const roundOf16Count = getRoundResults(results, 'round-of-16').length;
  const quarterfinalCount = getRoundResults(results, 'quarterfinal').length;
  const semifinalCount = getRoundResults(results, 'semifinal').length;
  const placementCount = getRoundResults(results, 'third-place').length + getRoundResults(results, 'final').length;

  if (roundOf16Count < 8) {
    return undefined;
  }

  if (quarterfinalCount === 0) {
    return createQuarterfinals(results);
  }

  if (quarterfinalCount < 4) {
    return undefined;
  }

  if (semifinalCount === 0) {
    return createSemifinals(results);
  }

  if (semifinalCount < 2) {
    return undefined;
  }

  if (placementCount === 0) {
    return createPlacementFinals(results);
  }

  return undefined;
}

export function getTournamentParticipants(states: RankingItemState[]) {
  return getOrderedRanking(states)
    .slice(0, TOURNAMENT_PARTICIPANT_COUNT)
    .map((state) => state.itemId);
}

export function createTournamentBracket(participantIds: readonly string[], createdAt: number): TournamentBracket {
  return {
    id: `tournament-${createdAt}`,
    participantIds: [...participantIds],
    pendingMatchups: createRoundMatchups('round-of-16', participantIds, ROUND_OF_16_PAIRINGS),
    completedMatchups: [],
    createdAt,
    completedAt: null,
  };
}

export function advanceTournamentBracket(
  bracket: TournamentBracket,
  matchup: TournamentMatchup,
  winnerId: string,
  loserId: string,
  decidedAt: number,
): TournamentBracket {
  const pendingMatchups = bracket.pendingMatchups.filter((candidate) => candidate.id !== matchup.id);
  const completedMatchups = [
    ...bracket.completedMatchups,
    {
      ...matchup,
      winnerId,
      loserId,
      decidedAt,
    },
  ];
  const nextRoundMatchups = pendingMatchups.length === 0 ? getNextPendingMatchups(completedMatchups) : undefined;
  const nextPendingMatchups = nextRoundMatchups ? nextRoundMatchups : pendingMatchups;
  const isComplete = nextPendingMatchups.length === 0 && getRoundResults(completedMatchups, 'final').length === 1;

  return {
    ...bracket,
    pendingMatchups: nextPendingMatchups,
    completedMatchups,
    completedAt: isComplete ? decidedAt : null,
  };
}

export function getActiveTournamentRound(bracket: TournamentBracket) {
  const nextRound = bracket.pendingMatchups[0]?.round;

  if (nextRound) {
    return nextRound;
  }

  const latestCompletedRound = [...ROUND_ORDER].reverse().find((round) => getRoundResults(bracket.completedMatchups, round).length > 0);

  return latestCompletedRound ?? 'final';
}

export function getTournamentPodium(bracket: TournamentBracket) {
  const finalResult = getRoundResults(bracket.completedMatchups, 'final')[0];
  const thirdPlaceResult = getRoundResults(bracket.completedMatchups, 'third-place')[0];

  if (!finalResult || !thirdPlaceResult) {
    return [];
  }

  return [finalResult.winnerId, finalResult.loserId, thirdPlaceResult.winnerId];
}
