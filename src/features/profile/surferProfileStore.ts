/**
 * Surfer profile persistence (SPEC.md CAP-6).
 *
 * The profile is per-viewer convenience, not domain data: it never leaves the browser and
 * there is no backend to hold it. localStorage can throw outright (private windows,
 * browsers set to block site data), so every read and write is guarded and the app must
 * render correctly with no stored value — the profile is opt-in and never a gate.
 */

import type { BoardType, SkillLevel, SurferProfile } from '@/domain/types';

const STORAGE_KEY = 'salt-and-longitude.surfer-profile.v1';

const SKILLS: readonly SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const BOARDS: readonly BoardType[] = ['shortboard', 'longboard', 'fish', 'gun', 'sup'];
const DIRECTIONS = ['left', 'right', 'both', 'no-preference'] as const;

export const defaultProfile: SurferProfile = {
  ability: 'intermediate',
  boards: ['shortboard'],
  crowdTolerance: 3,
  preferredDirection: 'no-preference',
};

/**
 * Validates a stored blob rather than trusting it. localStorage outlives deployments, so
 * yesterday's shape can turn up in today's app.
 */
export function parseProfile(raw: unknown): SurferProfile | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = raw as Record<string, unknown>;

  const ability = SKILLS.find((skill) => skill === value['ability']);
  if (!ability) return null;

  const boards = Array.isArray(value['boards'])
    ? value['boards'].filter((board): board is BoardType =>
        (BOARDS as readonly unknown[]).includes(board),
      )
    : [];

  const crowdRaw = Number(value['crowdTolerance']);
  const crowdTolerance = ([1, 2, 3, 4, 5] as const).find((n) => n === crowdRaw) ?? 3;

  const preferredDirection =
    DIRECTIONS.find((direction) => direction === value['preferredDirection']) ?? 'no-preference';

  const travelMonths = Array.isArray(value['travelMonths'])
    ? value['travelMonths'].filter(
        (month): month is number => typeof month === 'number' && month >= 1 && month <= 12,
      )
    : undefined;

  return {
    ability,
    boards,
    crowdTolerance,
    preferredDirection,
    ...(travelMonths && travelMonths.length > 0 ? { travelMonths } : {}),
  };
}

export function loadProfile(): SurferProfile | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? null : parseProfile(JSON.parse(stored));
  } catch {
    // A blocked or corrupt store is not an error condition — there is simply no profile.
    return null;
  }
}

export function saveProfile(profile: SurferProfile | null): void {
  try {
    if (profile === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {
    // Losing persistence must never break the session in progress.
  }
}
