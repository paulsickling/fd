/**
 * Display formatting for domain values.
 *
 * Pure and React-free like the rest of src/domain, so the rules that decide how a price or
 * a tenure reads are testable without rendering anything.
 */

import type {
  BreakDirection,
  BreakType,
  DestinationAccess,
  NearbyBreak,
  Property,
  SkillLevel,
  TravelMode,
} from './types';
import { closestBreakMinutes } from './filters';

/**
 * Prices are large and approximate; exact dollars are noise at this end of the market.
 * "USD 1.7M" reads better on a card than "$1,725,000".
 */
export function formatUsd(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    // 1.7M, but 12M rather than 12.0M.
    const rounded = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
    return `USD ${rounded}M`;
  }
  return `USD ${Math.round(amount / 1000)}k`;
}

export function formatUsdExact(amount: number): string {
  return `USD ${amount.toLocaleString('en-US')}`;
}

export function formatLocalPrice(amount: number, currency: string): string {
  if (currency === 'IDR') {
    // Indonesian listings are quoted in billions of rupiah, as the market does.
    return `IDR ${(amount / 1_000_000_000).toFixed(2)}bn`;
  }
  if (currency === 'THB') {
    return `THB ${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `${currency} ${amount.toLocaleString('en-US')}`;
}

export function formatPriceRange(minUsd: number, maxUsd: number): string {
  return `${formatUsd(minUsd)} – ${formatUsd(maxUsd)}`;
}

export function formatArea(sqm: number): string {
  return `${sqm.toLocaleString('en-US')} m²`;
}

const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function formatSkill(skill: SkillLevel): string {
  return SKILL_LABELS[skill];
}

export function formatSkillRange(floor: SkillLevel, ceiling: SkillLevel): string {
  return floor === ceiling ? SKILL_LABELS[floor] : `${SKILL_LABELS[floor]}–${SKILL_LABELS[ceiling]}`;
}

const BREAK_TYPE_LABELS: Record<BreakType, string> = {
  reef: 'Reef break',
  point: 'Point break',
  beach: 'Beach break',
  rivermouth: 'Rivermouth',
};

const DIRECTION_LABELS: Record<BreakDirection, string> = {
  left: 'Left',
  right: 'Right',
  both: 'Left and right',
};

/** e.g. "Left-hand reef break" — the phrase a surfer actually uses. */
export function formatBreakSummary(type: BreakType, direction: BreakDirection): string {
  const typeLabel = BREAK_TYPE_LABELS[type].toLowerCase();
  if (direction === 'both') return `Left and right ${typeLabel}`;
  return `${DIRECTION_LABELS[direction]}-hand ${typeLabel}`;
}

export function formatBreakType(type: BreakType): string {
  return BREAK_TYPE_LABELS[type];
}

export function formatDirection(direction: BreakDirection): string {
  return DIRECTION_LABELS[direction];
}

const ACCESS_LABELS: Record<DestinationAccess, string> = {
  road: 'Road access',
  flight: 'Short flight',
  'boat-charter': 'Boat charter only',
};

export function formatAccess(access: DestinationAccess): string {
  return ACCESS_LABELS[access];
}

const TRAVEL_VERBS: Record<TravelMode, string> = {
  walk: 'walk',
  drive: 'drive',
  boat: 'boat',
};

export function formatTravel(edge: NearbyBreak): string {
  return `${edge.travelMinutes} min ${TRAVEL_VERBS[edge.travelMode]}`;
}

/**
 * The headline surf stat on a listing card (SPEC.md CAP-3) — deliberately given the
 * prominence bed/bath gets on a conventional portal.
 *
 * "3 breaks · 6 min walk · dawn patrol on foot" when it is walkable, otherwise the plain
 * count and closest time.
 */
export function formatBreakHeadline(property: Property): string | null {
  const count = property.nearbyBreaks.length;
  if (count === 0) return null;

  const closest = property.nearbyBreaks.reduce((best, edge) =>
    edge.travelMinutes < best.travelMinutes ? edge : best,
  );
  const breakWord = count === 1 ? 'break' : 'breaks';
  const base = `${count} ${breakWord} · ${formatTravel(closest)}`;

  return closest.travelMode === 'walk' && closest.travelMinutes <= 15
    ? `${base} · dawn patrol on foot`
    : base;
}

/** Minutes to the nearest break, formatted, or null when the property has none. */
export function formatClosestBreak(property: Property): string | null {
  const minutes = closestBreakMinutes(property);
  return minutes === null ? null : `${minutes} min`;
}
