import { getOrderedRanking } from '../rankingEngine/stability';
import type { RankingItemState } from '../../domain/item';

export const TOURNAMENT_PARTICIPANT_COUNT = 16;

const ROUND_OF_16_SEED_PAIRS = [
  [0, 15],
  [7, 8],
  [3, 12],
  [4, 11],
  [1, 14],
  [6, 9],
  [2, 13],
  [5, 10],
] as const;

const QUARTERFINAL_MATCH_PAIRS = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
] as const;

const SEMIFINAL_MATCH_PAIRS = [
  [0, 1],
  [2, 3],
] as const;

const BRACKET_STAGE_ORDER = ['roundOf16', 'quarterfinal', 'semifinal', 'bronze', 'final'] as const;

export type TournamentStage = (typeof BRACKET_STAGE_ORDER)[number];

export type TournamentMatchup = {
  stage: TournamentStage;
  index: number;
  leftId: string;
  rightId: string;
};

export type TournamentResolvedMatch = TournamentMatchup & {
  winnerId: string;
  loserId: string;
  decidedAt: number;
};

export type TournamentPodium = {
  firstId: string;
  secondId: string;
  thirdId: string;
  fourthId: string;
};

export type TournamentBracket = {
  id: string;
  participantIds: string[];
  completedMatches: TournamentResolvedMatch[];
  totalMatches: number;
  createdAt: number;
  completedAt: number | null;
};

export function createTournamentBracket(participantIds: readonly string[], createdAt: number): TournamentBracket {
  return {
    id: `tournament-${createdAt}`,
    participantIds: [...participantIds],
    completedMatches: [],
    totalMatches: 16,
    createdAt,
    completedAt: null,
  };
}

export function getTournamentParticipants(states: RankingItemState[]) {
  return getOrderedRanking(states)
    .slice(0, TOURNAMENT_PARTICIPANT_COUNT)
    .map((state) => state.itemId);
}

export function getCurrentTournamentMatchup(bracket: TournamentBracket) {
  return listPendingTournamentMatchups(bracket)[0];
}

export function getNextTournamentMatchup(bracket: TournamentBracket) {
  return listPendingTournamentMatchups(bracket)[1];
}

export function listPendingTournamentMatchups(bracket: TournamentBracket) {
  const pendingMatchups: TournamentMatchup[] = [];

  for (const stage of BRACKET_STAGE_ORDER) {
    const matchups = getStageMatchups(bracket, stage);

    for (const matchup of matchups) {
      if (!findResolvedMatch(bracket, matchup.stage, matchup.index)) {
        pendingMatchups.push(matchup);
      }
    }

    if (pendingMatchups.length > 0) {
      return pendingMatchups;
    }
  }

  return pendingMatchups;
}

export function advanceTournamentBracket(
  bracket: TournamentBracket,
  matchup: TournamentMatchup,
  winnerId: string,
  now: number,
): TournamentBracket {
  const currentMatchup = getCurrentTournamentMatchup(bracket);

  if (
    !currentMatchup ||
    currentMatchup.stage !== matchup.stage ||
    currentMatchup.index !== matchup.index ||
    currentMatchup.leftId !== matchup.leftId ||
    currentMatchup.rightId !== matchup.rightId
  ) {
    return bracket;
  }

  if (winnerId !== matchup.leftId && winnerId !== matchup.rightId) {
    return bracket;
  }

  const loserId = winnerId === matchup.leftId ? matchup.rightId : matchup.leftId;
  const completedMatches = [
    ...bracket.completedMatches,
    {
      ...matchup,
      winnerId,
      loserId,
      decidedAt: now,
    },
  ];

  return {
    ...bracket,
    completedMatches,
    completedAt: completedMatches.length === bracket.totalMatches ? now : null,
  };
}

export function getTournamentPodium(bracket: TournamentBracket): TournamentPodium | null {
  if (!bracket.completedAt) {
    return null;
  }

  const finalMatch = findResolvedMatch(bracket, 'final', 0);
  const bronzeMatch = findResolvedMatch(bracket, 'bronze', 0);

  if (!finalMatch || !bronzeMatch) {
    return null;
  }

  return {
    firstId: finalMatch.winnerId,
    secondId: finalMatch.loserId,
    thirdId: bronzeMatch.winnerId,
    fourthId: bronzeMatch.loserId,
  };
}

export function getTournamentStageLabel(stage: TournamentStage) {
  switch (stage) {
    case 'roundOf16':
      return 'Round of 16';
    case 'quarterfinal':
      return 'Quarterfinal';
    case 'semifinal':
      return 'Semifinal';
    case 'bronze':
      return 'Third-place match';
    case 'final':
      return 'Final';
    default:
      return stage satisfies never;
  }
}

function getStageMatchups(bracket: TournamentBracket, stage: TournamentStage): TournamentMatchup[] {
  switch (stage) {
    case 'roundOf16':
      return ROUND_OF_16_SEED_PAIRS.map(([leftSeedIndex, rightSeedIndex], index) => ({
        stage,
        index,
        leftId: bracket.participantIds[leftSeedIndex] ?? '',
        rightId: bracket.participantIds[rightSeedIndex] ?? '',
      }));
    case 'quarterfinal':
      return buildStageFromWinners(bracket, stage, 'roundOf16', QUARTERFINAL_MATCH_PAIRS);
    case 'semifinal':
      return buildStageFromWinners(bracket, stage, 'quarterfinal', SEMIFINAL_MATCH_PAIRS);
    case 'bronze':
      return buildSingleMatch(bracket, stage, getMatchLoser(bracket, 'semifinal', 0), getMatchLoser(bracket, 'semifinal', 1));
    case 'final':
      return buildSingleMatch(bracket, stage, getMatchWinner(bracket, 'semifinal', 0), getMatchWinner(bracket, 'semifinal', 1));
    default:
      return stage satisfies never;
  }
}

function buildStageFromWinners(
  bracket: TournamentBracket,
  stage: TournamentStage,
  sourceStage: TournamentStage,
  sourcePairs: readonly (readonly [number, number])[],
) {
  return sourcePairs
    .map(([leftIndex, rightIndex], index) => {
      const leftId = getMatchWinner(bracket, sourceStage, leftIndex);
      const rightId = getMatchWinner(bracket, sourceStage, rightIndex);

      if (!leftId || !rightId) {
        return null;
      }

      return { stage, index, leftId, rightId };
    })
    .filter((matchup): matchup is TournamentMatchup => matchup !== null);
}

function buildSingleMatch(
  _bracket: TournamentBracket,
  stage: TournamentStage,
  leftId: string | undefined,
  rightId: string | undefined,
) {
  if (!leftId || !rightId) {
    return [];
  }

  return [{ stage, index: 0, leftId, rightId }];
}

function getMatchWinner(bracket: TournamentBracket, stage: TournamentStage, index: number) {
  return findResolvedMatch(bracket, stage, index)?.winnerId;
}

function getMatchLoser(bracket: TournamentBracket, stage: TournamentStage, index: number) {
  return findResolvedMatch(bracket, stage, index)?.loserId;
}

function findResolvedMatch(bracket: TournamentBracket, stage: TournamentStage, index: number) {
  return bracket.completedMatches.find((match) => match.stage === stage && match.index === index);
}
