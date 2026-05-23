import type { PublicProfileRecord } from './publicProfile';

export type SocialProofTier = 'top20' | 'top50';

function joinNames(names: string[]) {
  if (names.length === 0) {
    return '';
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names[0]}, ${names[1]} and ${names[2]}`;
}

function getProfileName(profile: PublicProfileRecord) {
  const trimmedName = profile.displayName.trim();
  return trimmedName.length > 0 ? trimmedName : 'MovieMash user';
}

function getTierNames(profiles: PublicProfileRecord[], itemId: string, tier: SocialProofTier) {
  return profiles
    .filter((profile) => {
      if (tier === 'top20') {
        return profile.topItemIds.includes(itemId);
      }

      return !profile.topItemIds.includes(itemId) && profile.top50ItemIds.includes(itemId);
    })
    .map(getProfileName)
    .slice(0, 3);
}

export function buildInterestedMovieSocialProof(profiles: PublicProfileRecord[], itemId: string) {
  const top20Names = getTierNames(profiles, itemId, 'top20');
  const top50Names = getTierNames(profiles, itemId, 'top50');
  const lines: string[] = [];

  if (top20Names.length > 0) {
    lines.push(`${joinNames(top20Names)} ${top20Names.length === 1 ? 'loves' : 'love'} this`);
  }

  if (top50Names.length > 0) {
    lines.push(`${joinNames(top50Names)} ${top50Names.length === 1 ? 'really likes' : 'really like'} this`);
  }

  return lines.slice(0, 2);
}
