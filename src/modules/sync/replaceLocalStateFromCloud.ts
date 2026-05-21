import { importDatabaseSnapshot } from '../persistence/rankingRepository';
import { readCloudDatabaseSnapshot } from './cloudStateRepository';

export type ReplaceLocalStateFromCloudResult =
  | { replaced: true }
  | { replaced: false; reason: 'missingCloudState' };

export async function replaceLocalStateFromCloud(uid: string): Promise<ReplaceLocalStateFromCloudResult> {
  const snapshot = await readCloudDatabaseSnapshot(uid);

  if (!snapshot) {
    return { replaced: false, reason: 'missingCloudState' };
  }

  await importDatabaseSnapshot(snapshot);
  return { replaced: true };
}
