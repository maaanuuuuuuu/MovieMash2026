import type { ItemId, RankingItemState } from '../../domain/item';

export type Matchup = {
  leftId: ItemId;
  rightId: ItemId;
};

export type RandomSource = () => number;

type SelectOptions = {
  random?: RandomSource;
  recentPairs?: Set<string>;
  explorationChance?: number;
};

const DEFAULT_EXPLORATION_CHANCE = 0.18;
const CANDIDATE_SAMPLE_SIZE = 18;

function pairKey(firstId: ItemId, secondId: ItemId) {
  return [firstId, secondId].sort().join('::');
}

function randomIndex(length: number, random: RandomSource) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function pickRandom<T>(items: T[], random: RandomSource) {
  return items[randomIndex(items.length, random)];
}

function shufflePair(firstId: ItemId, secondId: ItemId, random: RandomSource): Matchup {
  return random() < 0.5 ? { leftId: firstId, rightId: secondId } : { leftId: secondId, rightId: firstId };
}

function weightedPickByFreshness(items: RankingItemState[], random: RandomSource) {
  const weights = items.map((item) => 1 / (1 + item.appearances));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * total;

  for (let index = 0; index < items.length; index += 1) {
    cursor -= weights[index];

    if (cursor <= 0) {
      return items[index];
    }
  }

  return items[items.length - 1];
}

function sampleCandidates(items: RankingItemState[], random: RandomSource) {
  const pool = [...items];
  const sample: RankingItemState[] = [];

  while (pool.length > 0 && sample.length < CANDIDATE_SAMPLE_SIZE) {
    const index = randomIndex(pool.length, random);
    const [picked] = pool.splice(index, 1);
    sample.push(picked);
  }

  return sample;
}

// Score lower when ratings are close, and higher when a pair was shown recently.
function scoreCandidate(anchor: RankingItemState, candidate: RankingItemState, recentPairs?: Set<string>) {
  const ratingDistance = Math.abs(anchor.rating - candidate.rating);
  const freshnessBonus = Math.min(anchor.appearances, candidate.appearances) * 2;
  const recentPenalty = recentPairs?.has(pairKey(anchor.itemId, candidate.itemId)) ? 300 : 0;

  return ratingDistance + freshnessBonus + recentPenalty;
}

// Sample a small group so matchup selection stays fast on larger catalogs.
function pickBestPartner(anchor: RankingItemState, pool: RankingItemState[], random: RandomSource, recentPairs?: Set<string>) {
  const candidates = sampleCandidates(
    pool.filter((state) => state.itemId !== anchor.itemId),
    random,
  );
  return candidates.sort(
    (first, second) => scoreCandidate(anchor, first, recentPairs) - scoreCandidate(anchor, second, recentPairs),
  )[0];
}

function pickNearbyPair(activeStates: RankingItemState[], random: RandomSource, recentPairs?: Set<string>) {
  const anchor = weightedPickByFreshness(activeStates, random);
  const partner = pickBestPartner(anchor, activeStates, random, recentPairs);

  return shufflePair(anchor.itemId, partner.itemId, random);
}

function pickExplorationPair(activeStates: RankingItemState[], random: RandomSource, recentPairs?: Set<string>) {
  const shuffled = sampleCandidates(activeStates, random);
  const first = shuffled[0];
  const second =
    shuffled.find((candidate) => candidate.itemId !== first.itemId && !recentPairs?.has(pairKey(first.itemId, candidate.itemId))) ??
    shuffled.find((candidate) => candidate.itemId !== first.itemId);

  if (!second) {
    return undefined;
  }

  return shufflePair(first.itemId, second.itemId, random);
}

export function selectMatchup(states: RankingItemState[], options: SelectOptions = {}): Matchup | undefined {
  const random = options.random ?? Math.random;
  const activeStates = states.filter((state) => state.active);

  if (activeStates.length < 2) {
    return undefined;
  }

  const unseenStates = activeStates.filter((state) => state.appearances === 0);

  if (unseenStates.length >= 2) {
    const first = pickRandom(unseenStates, random);
    const second = pickRandom(
      unseenStates.filter((state) => state.itemId !== first.itemId),
      random,
    );
    return shufflePair(first.itemId, second.itemId, random);
  }

  if (unseenStates.length === 1) {
    const unseen = unseenStates[0];
    const partner = pickBestPartner(unseen, activeStates, random, options.recentPairs);

    if (!partner) {
      return undefined;
    }

    return shufflePair(unseen.itemId, partner.itemId, random);
  }

  if (random() < (options.explorationChance ?? DEFAULT_EXPLORATION_CHANCE)) {
    return pickExplorationPair(activeStates, random, options.recentPairs);
  }

  return pickNearbyPair(activeStates, random, options.recentPairs);
}

export function buildMatchupQueue(
  states: RankingItemState[],
  size = 4,
  random: RandomSource = Math.random,
): Matchup[] {
  const queue: Matchup[] = [];
  const recentPairs = new Set<string>();
  const workingStates = states.map((state) => ({ ...state }));

  // Simulate appearances while building the queue so preview pairs stay varied.
  while (queue.length < size) {
    const matchup = selectMatchup(workingStates, { random, recentPairs });

    if (!matchup) {
      break;
    }

    queue.push(matchup);
    recentPairs.add(pairKey(matchup.leftId, matchup.rightId));

    for (const state of workingStates) {
      if (state.itemId === matchup.leftId || state.itemId === matchup.rightId) {
        state.appearances += 1;
      }
    }
  }

  return queue;
}
