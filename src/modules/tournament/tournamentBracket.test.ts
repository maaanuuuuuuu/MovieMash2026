import { describe, expect, it } from 'vitest';
import { createInitialRankingState } from '../rankingEngine/rating';
import {
  advanceTournamentBracket,
  createTournamentBracket,
  getCurrentTournamentMatchup,
  getNextTournamentMatchup,
  getTournamentPodium,
  getTournamentStageLabel,
  getTournamentParticipants,
  listPendingTournamentMatchups,
} from './tournamentBracket';

function createParticipantIds() {
  return Array.from({ length: 16 }, (_, index) => `movie-${index + 1}`);
}

function advanceThroughStage(
  bracket: ReturnType<typeof createTournamentBracket>,
  winners: string[],
  now: number,
) {
  let nextBracket = bracket;

  for (const winnerId of winners) {
    const matchup = getCurrentTournamentMatchup(nextBracket);

    if (!matchup) {
      throw new Error('Expected a current matchup.');
    }

    nextBracket = advanceTournamentBracket(nextBracket, matchup, winnerId, now);
  }

  return nextBracket;
}

describe('tournamentBracket', () => {
  it('picks the current global top 16 active movies', () => {
    const now = 100;
    const states = Array.from({ length: 20 }, (_, index) => ({
      ...createInitialRankingState('default', `movie-${index + 1}`, now),
      active: index !== 2,
      rating: 2000 - index,
    }));

    expect(getTournamentParticipants(states)).toEqual([
      'movie-1',
      'movie-2',
      'movie-4',
      'movie-5',
      'movie-6',
      'movie-7',
      'movie-8',
      'movie-9',
      'movie-10',
      'movie-11',
      'movie-12',
      'movie-13',
      'movie-14',
      'movie-15',
      'movie-16',
      'movie-17',
    ]);
  });

  it('creates seeded round-of-16 matchups', () => {
    const bracket = createTournamentBracket(createParticipantIds(), 100);

    expect(listPendingTournamentMatchups(bracket)).toEqual([
      { stage: 'roundOf16', index: 0, leftId: 'movie-1', rightId: 'movie-16' },
      { stage: 'roundOf16', index: 1, leftId: 'movie-8', rightId: 'movie-9' },
      { stage: 'roundOf16', index: 2, leftId: 'movie-4', rightId: 'movie-13' },
      { stage: 'roundOf16', index: 3, leftId: 'movie-5', rightId: 'movie-12' },
      { stage: 'roundOf16', index: 4, leftId: 'movie-2', rightId: 'movie-15' },
      { stage: 'roundOf16', index: 5, leftId: 'movie-7', rightId: 'movie-10' },
      { stage: 'roundOf16', index: 6, leftId: 'movie-3', rightId: 'movie-14' },
      { stage: 'roundOf16', index: 7, leftId: 'movie-6', rightId: 'movie-11' },
    ]);
  });

  it('moves from round of 16 into quarterfinals and semifinals', () => {
    let bracket = createTournamentBracket(createParticipantIds(), 100);

    bracket = advanceThroughStage(
      bracket,
      ['movie-1', 'movie-8', 'movie-4', 'movie-12', 'movie-2', 'movie-10', 'movie-14', 'movie-6'],
      200,
    );

    expect(getCurrentTournamentMatchup(bracket)).toEqual({
      stage: 'quarterfinal',
      index: 0,
      leftId: 'movie-1',
      rightId: 'movie-8',
    });
    expect(getNextTournamentMatchup(bracket)).toEqual({
      stage: 'quarterfinal',
      index: 1,
      leftId: 'movie-4',
      rightId: 'movie-12',
    });

    bracket = advanceThroughStage(bracket, ['movie-1', 'movie-12', 'movie-2', 'movie-14'], 300);
    expect(getCurrentTournamentMatchup(bracket)).toEqual({
      stage: 'semifinal',
      index: 0,
      leftId: 'movie-1',
      rightId: 'movie-12',
    });
  });

  it('creates the bronze match before the final and exposes the podium at the end', () => {
    let bracket = createTournamentBracket(createParticipantIds(), 100);

    bracket = advanceThroughStage(
      bracket,
      ['movie-1', 'movie-8', 'movie-4', 'movie-12', 'movie-2', 'movie-10', 'movie-14', 'movie-6'],
      200,
    );
    bracket = advanceThroughStage(bracket, ['movie-1', 'movie-12', 'movie-2', 'movie-6'], 300);
    bracket = advanceThroughStage(bracket, ['movie-1', 'movie-2'], 400);

    expect(getCurrentTournamentMatchup(bracket)).toEqual({
      stage: 'bronze',
      index: 0,
      leftId: 'movie-12',
      rightId: 'movie-6',
    });

    bracket = advanceThroughStage(bracket, ['movie-12', 'movie-1'], 500);

    expect(bracket.completedAt).toBe(500);
    expect(getTournamentPodium(bracket)).toEqual({
      firstId: 'movie-1',
      secondId: 'movie-2',
      thirdId: 'movie-12',
      fourthId: 'movie-6',
    });
  });

  it('returns readable round labels', () => {
    expect(getTournamentStageLabel('roundOf16')).toBe('Round of 16');
    expect(getTournamentStageLabel('quarterfinal')).toBe('Quarterfinal');
    expect(getTournamentStageLabel('semifinal')).toBe('Semifinal');
    expect(getTournamentStageLabel('bronze')).toBe('Third-place match');
    expect(getTournamentStageLabel('final')).toBe('Final');
  });
});
