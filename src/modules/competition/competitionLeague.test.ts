import { describe, expect, it } from 'vitest';
import { createInitialRankingState } from '../rankingEngine/rating';
import {
  COMPETITION_PARTICIPANT_COUNT,
  advanceCompetitionLeague,
  createCompetitionLeague,
  createCompetitionMatchups,
  getCompetitionParticipants,
} from './competitionLeague';

describe('competitionLeague', () => {
  it('creates one matchup for each pair of participants', () => {
    const participantIds = ['a', 'b', 'c', 'd'];

    expect(createCompetitionMatchups(participantIds)).toEqual([
      { leftId: 'a', rightId: 'b' },
      { leftId: 'a', rightId: 'c' },
      { leftId: 'a', rightId: 'd' },
      { leftId: 'b', rightId: 'c' },
      { leftId: 'b', rightId: 'd' },
      { leftId: 'c', rightId: 'd' },
    ]);
  });

  it('finishes the league when the last matchup is completed', () => {
    const league = createCompetitionLeague(['a', 'b'], 100);

    expect(advanceCompetitionLeague(league, { leftId: 'a', rightId: 'b' }, 200)).toEqual({
      ...league,
      remainingMatchups: [],
      totalMatchups: 1,
      completedAt: 200,
    });
  });

  it('picks the current global top 20 active movies', () => {
    const states = Array.from({ length: COMPETITION_PARTICIPANT_COUNT + 4 }, (_, index) => ({
      ...createInitialRankingState('default', `movie-${index}`, 1),
      rating: 3000 - index,
      active: index !== COMPETITION_PARTICIPANT_COUNT + 2,
    }));

    expect(getCompetitionParticipants(states)).toHaveLength(COMPETITION_PARTICIPANT_COUNT);
    expect(getCompetitionParticipants(states)[0]).toBe('movie-0');
    expect(getCompetitionParticipants(states)).not.toContain(`movie-${COMPETITION_PARTICIPANT_COUNT + 2}`);
  });
});
