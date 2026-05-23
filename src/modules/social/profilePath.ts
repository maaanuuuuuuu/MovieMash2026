export const PROFILE_ROUTE_PATH = '/profiles/:userId';

export function buildProfilePath(userId: string) {
  return `/profiles/${encodeURIComponent(userId)}`;
}
