import { describe, expect, it } from 'vitest';
import { createInitialRankingState } from '../rankingEngine/rating';
import {
  TOURNAMENT_PARTICIPANT_COUNT,
  advanceTournamentBracket,
  createTournamentBracket,
  getActiveTournamentRound,
  getTournamentParticipants,
  getTournamentPodium,
} from './tournamentBracket';

describe('tournamentBracket', () => {
  it('picks the current global top 16 active movies', () => {
    const states = Array.from({ length: TOURNAMENT_PARTICIPANT_COUNT + 4 }, (_, index) => ({
      ...createInitialRankingState('default', `movie-${index}`, 1),
      rating: 3000 - index,
      active: index !== TOURNAMENT_PARTICIPANT_COUNT + 1,
    }));

    expect(getTournamentParticipants(states)).toHaveLength(TOURNAMENT_PARTICIPANT_COUNT);
    expect(getTournamentParticipants(states)[0]).toBe('movie-0');
    expect(getTournamentParticipants(states)).not.toContain(`movie-${TOURNAMENT_PARTICIPANT_COUNT + 1}`);
  });

  it('opens with seeded round-of-16 matchups', () => {
    const bracket = createTournamentBracket(
      Array.from({ length: TOURNAMENT_PARTICIPANT_COUNT }, (_, index) => `movie-${index + 1}`),
      100,
    );

    expect(bracket.pendingMatchups[0]).toEqual({
      id: 'round-of-16-1',
      round: 'round-of-16',
      leftId: 'movie-1',
      rightId: 'movie-16',
    });
    expect(bracket.pendingMatchups[7]).toEqual({
      id: 'round-of-16-8',
      round: 'round-of-16',
      leftId: 'movie-2',
      rightId: 'movie-15',
    });
  });

  it('advances through the bracket and builds the podium', () => {
    let bracket = createTournamentBracket(
      Array.from({ length: TOURNAMENT_PARTICIPANT_COUNT }, (_, index) => `movie-${index + 1}`),
      100,
    );

    while (bracket.pendingMatchups.length > 0) {
      const matchup = bracket.pendingMatchups[0];

      if (!matchup) {
        throw new Error('Expected a pending matchup.');
      }

      bracket = advanceTournamentBracket(bracket, matchup, matchup.leftId, matchup.rightId, bracket.createdAt + 1);
    }

    expect(bracket.completedAt).toBe(101);
    expect(getActiveTournamentRound(bracket)).toBe('final');
    expect(getTournamentPodium(bracket)).toEqual(['movie-1', 'movie-6', 'movie-5']);
  });
});
