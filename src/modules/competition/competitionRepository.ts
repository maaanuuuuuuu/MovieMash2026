import { db } from '../persistence/db';
import { listRankingStates } from '../persistence/rankingRepository';
import { GLOBAL_FILM_SCOPE_ID } from '../content/filmSource';
import {
  COMPETITION_PARTICIPANT_COUNT,
  advanceCompetitionLeague,
  createCompetitionLeague,
  getCompetitionParticipants,
  type CompetitionLeague,
  type CompetitionMatchup,
} from './competitionLeague';

const COMPETITION_META_KEY = 'competitionLeague:all';

function isCompetitionLeague(value: unknown): value is CompetitionLeague {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const league = value as Partial<CompetitionLeague>;
  return (
    typeof league.id === 'string' &&
    Array.isArray(league.participantIds) &&
    Array.isArray(league.remainingMatchups) &&
    typeof league.totalMatchups === 'number' &&
    typeof league.createdAt === 'number'
  );
}

async function writeCompetitionLeague(league: CompetitionLeague | undefined) {
  if (!league) {
    await db.meta.delete(COMPETITION_META_KEY);
    return;
  }

  await db.meta.put({ key: COMPETITION_META_KEY, value: JSON.stringify(league) });
}

export async function getCompetitionLeague() {
  const record = await db.meta.get(COMPETITION_META_KEY);

  if (typeof record?.value !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(record.value) as unknown;
    return isCompetitionLeague(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveCompetitionLeague(league: CompetitionLeague) {
  await writeCompetitionLeague(league);
}

export async function startCompetitionLeague() {
  const states = await listRankingStates(GLOBAL_FILM_SCOPE_ID);
  const participantIds = getCompetitionParticipants(states);

  if (participantIds.length < COMPETITION_PARTICIPANT_COUNT) {
    return undefined;
  }

  const league = createCompetitionLeague(participantIds, Date.now());
  await writeCompetitionLeague(league);
  return league;
}

export async function clearCompetitionLeague() {
  await writeCompetitionLeague(undefined);
}

export async function advanceCompetitionMatchup(matchup: CompetitionMatchup) {
  const league = await getCompetitionLeague();

  if (!league) {
    return undefined;
  }

  const nextLeague = advanceCompetitionLeague(league, matchup, Date.now());
  await writeCompetitionLeague(nextLeague);
  return nextLeague;
}
