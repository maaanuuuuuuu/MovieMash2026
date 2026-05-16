import { describe, expect, it } from 'vitest';
import { createInitialRankingState } from '../rankingEngine/rating';
import { buildMatchupQueue, selectMatchup, type RandomSource } from './selectMatchup';

function seededRandom(seed: number): RandomSource {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function states(ids: string[]) {
  return ids.map((id) => createInitialRankingState('test', id, 1));
}

describe('adaptive matchup selection', () => {
  it('favors unseen items before refinement', () => {
    const matchup = selectMatchup(states(['a', 'b', 'c', 'd']), { random: seededRandom(1) });

    expect(matchup).toBeDefined();
    expect(['a', 'b', 'c', 'd']).toContain(matchup?.leftId);
    expect(['a', 'b', 'c', 'd']).toContain(matchup?.rightId);
  });

  it('biases toward nearby ratings after all active items have appeared', () => {
    const rankedStates = states(['a', 'b', 'c', 'd']).map((state, index) => ({
      ...state,
      appearances: 6,
      rating: [1000, 1012, 1300, 1680][index],
    }));
    const matchup = selectMatchup(rankedStates, {
      random: () => 0,
      explorationChance: 0,
    });

    expect(new Set([matchup?.leftId, matchup?.rightId])).toEqual(new Set(['a', 'b']));
  });

  it('keeps a short speculative queue without duplicate pairs', () => {
    const queue = buildMatchupQueue(states(['a', 'b', 'c', 'd', 'e', 'f']), 4, seededRandom(12));
    const pairKeys = queue.map((matchup) => [matchup.leftId, matchup.rightId].sort().join(':'));

    expect(queue).toHaveLength(4);
    expect(new Set(pairKeys).size).toBe(queue.length);
  });
});
