import { exportDatabaseSnapshot } from '../persistence/rankingRepository';
import { writeCloudDatabaseSnapshot, type CloudWriteReason } from './cloudStateRepository';

export async function syncLocalStateToCloud(uid: string, reason: CloudWriteReason = 'manual') {
  const snapshot = await exportDatabaseSnapshot();

  await writeCloudDatabaseSnapshot(uid, snapshot, reason);
  return snapshot;
}
