/**
 * Unit tests for the pure filtering logic.
 *
 * These use hand-built fixtures rather than the seed, so they stay meaningful as the
 * researched data changes — and they run without rendering anything, which is the payoff
 * for keeping src/domain free of React.
 */

import { describe, expect, it } from 'vitest';
import {
  breakSuitsSkill,
  closestBreakMinutes,
  filterProperties,
  isWalkToBreak,
  sortProperties,
} from './filters';
import type { MonthScore, Property, Seasonality, SurfBreak } from './types';

const flatSeason = Array.from({ length: 12 }, () => 5 as MonthScore) as unknown as Seasonality;

function makeBreak(overrides: Partial<SurfBreak> & Pick<SurfBreak, 'id'>): SurfBreak {
  return {
    name: overrides.id,
    aliases: [],
    destinationId: 'bali',
    type: 'reef',
    direction: 'left',
    skill: 'intermediate',
    skillCeiling: 'expert',
    optimal: {
      swellDirection: 'SW',
      swellSizeFt: { min: 3, max: 10 },
      windDirection: 'SE',
      tide: 'mid',
    },
    seasonality: flatSeason,
    bottom: 'shallow reef',
    hazards: [],
    crowdFactor: 3,
    paddleOutMinutes: 5,
    notes: '',
    mapPoint: { x: 0.5, y: 0.5 },
    ...overrides,
  };
}

function makeProperty(overrides: Partial<Property> & Pick<Property, 'id'>): Property {
  return {
    title: overrides.id,
    destinationId: 'bali',
    locality: 'Bingin',
    type: 'villa',
    priceUsd: 1_000_000,
    priceLocal: { amount: 16_200_000_000, currency: 'IDR' },
    bedrooms: 3,
    bathrooms: 3,
    landSqm: 400,
    builtSqm: 300,
    tenure: 'hak-sewa',
    features: [],
    seaView: false,
    images: [],
    description: '',
    nearbyBreaks: [],
    mapPoint: { x: 0.5, y: 0.5 },
    ...overrides,
  };
}

const beginnerBeach = makeBreak({
  id: 'chaweng',
  type: 'beach',
  direction: 'left',
  skill: 'beginner',
  skillCeiling: 'intermediate',
});
const expertReef = makeBreak({
  id: 'padang-padang',
  type: 'reef',
  direction: 'left',
  skill: 'expert',
  skillCeiling: 'expert',
});
const rightReef = makeBreak({
  id: 'keramas',
  type: 'reef',
  direction: 'right',
  skill: 'advanced',
  skillCeiling: 'expert',
});
const breaks = [beginnerBeach, expertReef, rightReef];

describe('breakSuitsSkill', () => {
  it('accepts a surfer inside the range and rejects one below it', () => {
    expect(breakSuitsSkill(expertReef, 'expert')).toBe(true);
    expect(breakSuitsSkill(expertReef, 'beginner')).toBe(false);
  });

  it('rejects a surfer above the ceiling, not just below the floor', () => {
    // A beginner beach break is not what an expert is shopping for.
    expect(breakSuitsSkill(beginnerBeach, 'expert')).toBe(false);
    expect(breakSuitsSkill(beginnerBeach, 'intermediate')).toBe(true);
  });
});

describe('closestBreakMinutes and isWalkToBreak', () => {
  it('returns null when a property has no nearby break', () => {
    expect(closestBreakMinutes(makeProperty({ id: 'inland' }))).toBeNull();
  });

  it('takes the minimum travel time across all edges', () => {
    const property = makeProperty({
      id: 'multi',
      nearbyBreaks: [
        { breakId: 'padang-padang', travelMinutes: 22, travelMode: 'drive' },
        { breakId: 'chaweng', travelMinutes: 6, travelMode: 'walk' },
      ],
    });

    expect(closestBreakMinutes(property)).toBe(6);
    expect(isWalkToBreak(property)).toBe(true);
  });

  it('does not count a short drive as walkable', () => {
    const property = makeProperty({
      id: 'drive-only',
      nearbyBreaks: [{ breakId: 'chaweng', travelMinutes: 4, travelMode: 'drive' }],
    });

    expect(isWalkToBreak(property)).toBe(false);
  });
});

describe('filterProperties', () => {
  const walkToBeginner = makeProperty({
    id: 'a-beginner-walk',
    bedrooms: 2,
    priceUsd: 400_000,
    seaView: true,
    nearbyBreaks: [{ breakId: 'chaweng', travelMinutes: 5, travelMode: 'walk' }],
  });
  const driveToExpert = makeProperty({
    id: 'b-expert-drive',
    bedrooms: 5,
    priceUsd: 2_500_000,
    tenure: 'pt-pma',
    nearbyBreaks: [{ breakId: 'padang-padang', travelMinutes: 25, travelMode: 'drive' }],
  });
  const mixed = makeProperty({
    id: 'c-mixed',
    bedrooms: 4,
    priceUsd: 1_200_000,
    nearbyBreaks: [
      { breakId: 'padang-padang', travelMinutes: 8, travelMode: 'walk' },
      { breakId: 'keramas', travelMinutes: 40, travelMode: 'drive' },
    ],
  });
  const properties = [walkToBeginner, driveToExpert, mixed];

  const ids = (result: Property[]) => result.map((p) => p.id);

  it('returns everything when given no criteria', () => {
    expect(filterProperties(properties, breaks)).toHaveLength(3);
  });

  it('applies price and bedroom criteria together', () => {
    const result = filterProperties(properties, breaks, {
      maxPriceUsd: 1_500_000,
      minBedrooms: 3,
    });

    expect(ids(result)).toEqual(['c-mixed']);
  });

  it('filters on tenure, which is the expat deal-breaker attribute', () => {
    expect(ids(filterProperties(properties, breaks, { tenureTypes: ['pt-pma'] }))).toEqual([
      'b-expert-drive',
    ]);
  });

  it('matches surf criteria against the nearby breaks', () => {
    expect(ids(filterProperties(properties, breaks, { skill: 'beginner' }))).toEqual([
      'a-beginner-walk',
    ]);
    expect(ids(filterProperties(properties, breaks, { breakTypes: ['beach'] }))).toEqual([
      'a-beginner-walk',
    ]);
  });

  it('requires ONE break to satisfy every surf criterion, not different breaks each', () => {
    // c-mixed walks to a left reef and drives to a right reef. Asking for a walkable RIGHT
    // must not match it by combining the walk from one break with the direction of another.
    const result = filterProperties(properties, breaks, {
      breakDirection: 'right',
      maxTravelMinutes: 10,
    });

    expect(ids(result)).toEqual([]);
  });

  it('treats a both-ways break as matching either direction', () => {
    const bothWays = makeBreak({ id: 'balangan', direction: 'both', skill: 'intermediate' });
    const property = makeProperty({
      id: 'both-ways',
      nearbyBreaks: [{ breakId: 'balangan', travelMinutes: 5, travelMode: 'walk' }],
    });

    expect(
      filterProperties([property], [bothWays], { breakDirection: 'right' }),
    ).toHaveLength(1);
    expect(filterProperties([property], [bothWays], { breakDirection: 'left' })).toHaveLength(1);
  });

  it('excludes properties whose nearby break is missing from the atlas', () => {
    const orphan = makeProperty({
      id: 'orphan',
      nearbyBreaks: [{ breakId: 'does-not-exist', travelMinutes: 5, travelMode: 'walk' }],
    });

    expect(filterProperties([orphan], breaks, { skill: 'beginner' })).toHaveLength(0);
  });
});

describe('sortProperties', () => {
  const cheap = makeProperty({ id: 'cheap', priceUsd: 100 });
  const dear = makeProperty({ id: 'dear', priceUsd: 900 });
  const noBreak = makeProperty({ id: 'no-break', priceUsd: 500 });
  const nearBreak = makeProperty({
    id: 'near-break',
    priceUsd: 500,
    nearbyBreaks: [{ breakId: 'chaweng', travelMinutes: 3, travelMode: 'walk' }],
  });

  it('orders by price in both directions', () => {
    expect(sortProperties([dear, cheap], 'price-asc').map((p) => p.id)).toEqual(['cheap', 'dear']);
    expect(sortProperties([cheap, dear], 'price-desc').map((p) => p.id)).toEqual(['dear', 'cheap']);
  });

  it('sorts properties with no nearby break last, not first', () => {
    expect(sortProperties([noBreak, nearBreak], 'closest-break').map((p) => p.id)).toEqual([
      'near-break',
      'no-break',
    ]);
  });

  it('falls back to a deterministic order so both adapters agree', () => {
    expect(sortProperties([dear, cheap], undefined).map((p) => p.id)).toEqual(['cheap', 'dear']);
  });
});
