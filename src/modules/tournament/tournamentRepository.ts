import { GLOBAL_FILM_SCOPE_ID } from '../content/filmSource';
import { db } from '../persistence/db';
import { listRankingStates } from '../persistence/rankingRepository';
import {
  TOURNAMENT_PARTICIPANT_COUNT,
  advanceTournamentBracket,
  createTournamentBracket,
  getTournamentParticipants,
  type TournamentBracket,
  type TournamentMatchup,
} from './tournamentBracket';

const TOURNAMENT_META_KEY = 'tournamentBracket:all';

function isTournamentBracket(value: unknown): value is TournamentBracket {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const bracket = value as Partial<TournamentBracket>;
  return (
    typeof bracket.id === 'string' &&
    Array.isArray(bracket.participantIds) &&
    Array.isArray(bracket.pendingMatchups) &&
    Array.isArray(bracket.completedMatchups) &&
    typeof bracket.createdAt === 'number'
  );
}

async function writeTournamentBracket(bracket: TournamentBracket | undefined) {
  if (!bracket) {
    await db.meta.delete(TOURNAMENT_META_KEY);
    return;
  }

  await db.meta.put({ key: TOURNAMENT_META_KEY, value: JSON.stringify(bracket) });
}

export async function getTournamentBracket() {
  const record = await db.meta.get(TOURNAMENT_META_KEY);

  if (typeof record?.value !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(record.value) as unknown;
    return isTournamentBracket(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function startTournamentBracket() {
  const states = await listRankingStates(GLOBAL_FILM_SCOPE_ID);
  const participantIds = getTournamentParticipants(states);

  if (participantIds.length < TOURNAMENT_PARTICIPANT_COUNT) {
    return undefined;
  }

  const bracket = createTournamentBracket(participantIds, Date.now());
  await writeTournamentBracket(bracket);
  return bracket;
}

export async function clearTournamentBracket() {
  await writeTournamentBracket(undefined);
}

export async function advanceTournamentMatchup(matchup: TournamentMatchup, winnerId: string, loserId: string) {
  const bracket = await getTournamentBracket();

  if (!bracket) {
    return undefined;
  }

  const nextBracket = advanceTournamentBracket(bracket, matchup, winnerId, loserId, Date.now());
  await writeTournamentBracket(nextBracket);
  return nextBracket;
}
