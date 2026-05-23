import type { AuthUser } from '../auth/authRepository';
import { exportDatabaseSnapshot } from '../persistence/rankingRepository';
import { writeCloudDatabaseSnapshot, type CloudWriteReason } from './cloudStateRepository';

export async function syncLocalStateToCloud(user: AuthUser, reason: CloudWriteReason = 'manual') {
  const snapshot = await exportDatabaseSnapshot();

  await writeCloudDatabaseSnapshot(user, snapshot, reason);
  return snapshot;
}
