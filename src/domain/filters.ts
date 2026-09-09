/**
 * Pure filtering and sorting over the domain types.
 *
 * These live in `domain/` rather than in a repository adapter or a component on purpose.
 * Under the JSON adapter they run in memory; under a real API the same criteria object
 * becomes query parameters and the server does the work. Keeping the logic pure and
 * source-agnostic is what lets both adapters satisfy one contract (SPEC.md CAP-7).
 */

import type {
  BreakDirection,
  BreakType,
  Property,
  PropertyType,
  SkillLevel,
  SurfBreak,
  TenureTypeId,
} from './types';

export type PropertySort = 'price-asc' | 'price-desc' | 'bedrooms-desc' | 'closest-break';

export interface PropertySearchCriteria {
  readonly destinationId?: string;
  readonly minPriceUsd?: number;
  readonly maxPriceUsd?: number;
  readonly minBedrooms?: number;
  readonly propertyTypes?: readonly PropertyType[];
  readonly tenureTypes?: readonly TenureTypeId[];
  readonly seaView?: boolean;
  /** Surf-side filters: satisfied when ANY nearby break matches. */
  readonly breakTypes?: readonly BreakType[];
  readonly breakDirection?: BreakDirection;
  readonly skill?: SkillLevel;
  /** Property qualifies when at least one nearby break is within this travel time. */
  readonly maxTravelMinutes?: number;
  readonly sort?: PropertySort;
}

const SKILL_ORDER: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

export function skillRank(level: SkillLevel): number {
  return SKILL_ORDER[level];
}

/** A break suits a surfer when their level sits within the break's usable range. */
export function breakSuitsSkill(surfBreak: SurfBreak, skill: SkillLevel): boolean {
  const rank = skillRank(skill);
  return rank >= skillRank(surfBreak.skill) && rank <= skillRank(surfBreak.skillCeiling);
}

/** Travel time to the property's closest break, or null when it has none. */
export function closestBreakMinutes(property: Property): number | null {
  if (property.nearbyBreaks.length === 0) return null;
  return Math.min(...property.nearbyBreaks.map((edge) => edge.travelMinutes));
}

/**
 * True when the property is walkable to a break — the condition that earns a listing
 * its "dawn patrol on foot" headline treatment (SPEC.md CAP-3).
 */
export function isWalkToBreak(property: Property, maxMinutes = 15): boolean {
  return property.nearbyBreaks.some(
    (edge) => edge.travelMode === 'walk' && edge.travelMinutes <= maxMinutes,
  );
}

function matchesSurfCriteria(
  property: Property,
  breaksById: ReadonlyMap<string, SurfBreak>,
  criteria: PropertySearchCriteria,
): boolean {
  const { breakTypes, breakDirection, skill, maxTravelMinutes } = criteria;
  const needsSurfMatch =
    breakTypes !== undefined ||
    breakDirection !== undefined ||
    skill !== undefined ||
    maxTravelMinutes !== undefined;
  if (!needsSurfMatch) return true;

  // Surf filters are satisfied when ANY single nearby break meets all of them at once —
  // one break that is a walkable beginner left, not a walkable break and, separately,
  // a beginner left somewhere else.
  return property.nearbyBreaks.some((edge) => {
    const surfBreak = breaksById.get(edge.breakId);
    if (!surfBreak) return false;
    if (breakTypes && breakTypes.length > 0 && !breakTypes.includes(surfBreak.type)) return false;
    if (
      breakDirection !== undefined &&
      surfBreak.direction !== breakDirection &&
      surfBreak.direction !== 'both'
    ) {
      return false;
    }
    if (skill !== undefined && !breakSuitsSkill(surfBreak, skill)) return false;
    if (maxTravelMinutes !== undefined && edge.travelMinutes > maxTravelMinutes) return false;
    return true;
  });
}

export function matchesPropertyCriteria(
  property: Property,
  breaksById: ReadonlyMap<string, SurfBreak>,
  criteria: PropertySearchCriteria,
): boolean {
  if (criteria.destinationId !== undefined && property.destinationId !== criteria.destinationId) {
    return false;
  }
  if (criteria.minPriceUsd !== undefined && property.priceUsd < criteria.minPriceUsd) return false;
  if (criteria.maxPriceUsd !== undefined && property.priceUsd > criteria.maxPriceUsd) return false;
  if (criteria.minBedrooms !== undefined && property.bedrooms < criteria.minBedrooms) return false;
  if (
    criteria.propertyTypes &&
    criteria.propertyTypes.length > 0 &&
    !criteria.propertyTypes.includes(property.type)
  ) {
    return false;
  }
  if (
    criteria.tenureTypes &&
    criteria.tenureTypes.length > 0 &&
    !criteria.tenureTypes.includes(property.tenure)
  ) {
    return false;
  }
  if (criteria.seaView !== undefined && property.seaView !== criteria.seaView) return false;
  return matchesSurfCriteria(property, breaksById, criteria);
}

export function sortProperties(
  properties: readonly Property[],
  sort: PropertySort | undefined,
): Property[] {
  const sorted = [...properties];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.priceUsd - b.priceUsd);
    case 'price-desc':
      return sorted.sort((a, b) => b.priceUsd - a.priceUsd);
    case 'bedrooms-desc':
      return sorted.sort((a, b) => b.bedrooms - a.bedrooms);
    case 'closest-break':
      return sorted.sort((a, b) => {
        // Properties with no break at all sort last rather than first.
        const aMin = closestBreakMinutes(a) ?? Number.POSITIVE_INFINITY;
        const bMin = closestBreakMinutes(b) ?? Number.POSITIVE_INFINITY;
        return aMin - bMin;
      });
    default:
      // Stable, deterministic default so both adapters agree on ordering.
      return sorted.sort((a, b) => a.id.localeCompare(b.id));
  }
}

export function filterProperties(
  properties: readonly Property[],
  breaks: readonly SurfBreak[],
  criteria: PropertySearchCriteria = {},
): Property[] {
  const breaksById = new Map(breaks.map((b) => [b.id, b]));
  const matched = properties.filter((p) => matchesPropertyCriteria(p, breaksById, criteria));
  return sortProperties(matched, criteria.sort);
}
