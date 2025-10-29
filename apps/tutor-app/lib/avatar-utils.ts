import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

export interface AvatarConfig {
  seed: string;
  style: 'adventurer';
}

// Map avatar IDs to their configurations - 12 diverse adventurer-style avatars
export const AVATAR_MAP: { [key: string]: AvatarConfig } = {
  'adventurer-1': { seed: 'Felix', style: 'adventurer' },
  'adventurer-2': { seed: 'Luna', style: 'adventurer' },
  'adventurer-3': { seed: 'Max', style: 'adventurer' },
  'adventurer-4': { seed: 'Zoe', style: 'adventurer' },
  'adventurer-5': { seed: 'Leo', style: 'adventurer' },
  'adventurer-6': { seed: 'Mia', style: 'adventurer' },
  'adventurer-7': { seed: 'Oliver', style: 'adventurer' },
  'adventurer-8': { seed: 'Emma', style: 'adventurer' },
  'adventurer-9': { seed: 'Charlie', style: 'adventurer' },
  'adventurer-10': { seed: 'Sophia', style: 'adventurer' },
  'adventurer-11': { seed: 'Noah', style: 'adventurer' },
  'adventurer-12': { seed: 'Ava', style: 'adventurer' },
};

const STYLE_MAP = {
  adventurer: adventurer,
};

/**
 * Generate avatar data URI from avatar ID
 * @param avatarId - Avatar ID (e.g., 'adventurer-1', 'bigsmile-2')
 * @param size - Avatar size in pixels (default: 80)
 * @returns Data URI string for use in img src
 */
export function generateAvatarUrl(avatarId: string, size: number = 80): string {
  const config = AVATAR_MAP[avatarId] || { seed: 'Felix', style: 'adventurer' as const };
  
  const avatar = createAvatar(STYLE_MAP[config.style], {
    seed: config.seed,
    size: size,
  });
  
  return avatar.toDataUri();
}
