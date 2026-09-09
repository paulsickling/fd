import { describe, expect, it } from 'vitest';
import {
  formatArea,
  formatBreakHeadline,
  formatBreakSummary,
  formatLocalPrice,
  formatPriceRange,
  formatSkillRange,
  formatTravel,
  formatUsd,
} from './format';
import type { Property } from './types';

function makeProperty(nearbyBreaks: Property['nearbyBreaks']): Property {
  return {
    id: 'p1',
    title: 'Test',
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
    nearbyBreaks,
    mapPoint: { x: 0.5, y: 0.5 },
  };
}

describe('price formatting', () => {
  it('abbreviates millions and thousands the way the market quotes them', () => {
    expect(formatUsd(1_725_000)).toBe('USD 1.7M');
    expect(formatUsd(450_000)).toBe('USD 450k');
    expect(formatUsd(5_500_000)).toBe('USD 5.5M');
  });

  it('drops the decimal above ten million rather than showing 12.0M', () => {
    expect(formatUsd(12_400_000)).toBe('USD 12M');
  });

  it('quotes local currency in the units each market uses', () => {
    expect(formatLocalPrice(16_200_000_000, 'IDR')).toBe('IDR 16.20bn');
    expect(formatLocalPrice(38_000_000, 'THB')).toBe('THB 38.0M');
  });

  it('renders a range', () => {
    expect(formatPriceRange(160_000, 2_000_000)).toBe('USD 160k – USD 2M');
  });
});

describe('surf vocabulary', () => {
  it('uses the phrase a surfer would say', () => {
    expect(formatBreakSummary('reef', 'left')).toBe('Left-hand reef break');
    expect(formatBreakSummary('beach', 'both')).toBe('Left and right beach break');
  });

  it('collapses a skill range when floor and ceiling match', () => {
    expect(formatSkillRange('expert', 'expert')).toBe('Expert');
    expect(formatSkillRange('intermediate', 'expert')).toBe('Intermediate–Expert');
  });

  it('formats a travel edge', () => {
    expect(formatTravel({ breakId: 'b', travelMinutes: 6, travelMode: 'walk' })).toBe('6 min walk');
    expect(formatTravel({ breakId: 'b', travelMinutes: 40, travelMode: 'boat' })).toBe(
      '40 min boat',
    );
  });
});

describe('formatBreakHeadline', () => {
  it('returns null when a property has no breaks, so the card can omit the line', () => {
    expect(formatBreakHeadline(makeProperty([]))).toBeNull();
  });

  it('earns the dawn-patrol phrase only when the closest break is a short walk', () => {
    const walkable = makeProperty([
      { breakId: 'bingin', travelMinutes: 6, travelMode: 'walk' },
      { breakId: 'impossibles', travelMinutes: 18, travelMode: 'drive' },
    ]);

    expect(formatBreakHeadline(walkable)).toBe('2 breaks · 6 min walk · dawn patrol on foot');
  });

  it('does not claim dawn patrol for a short drive', () => {
    const driveOnly = makeProperty([{ breakId: 'keramas', travelMinutes: 5, travelMode: 'drive' }]);

    expect(formatBreakHeadline(driveOnly)).toBe('1 break · 5 min drive');
  });

  it('reports the closest break, not the first listed', () => {
    const unordered = makeProperty([
      { breakId: 'far', travelMinutes: 30, travelMode: 'drive' },
      { breakId: 'near', travelMinutes: 4, travelMode: 'walk' },
    ]);

    expect(formatBreakHeadline(unordered)).toContain('4 min walk');
  });
});

describe('formatArea', () => {
  it('renders square metres with a thousands separator', () => {
    expect(formatArea(1200)).toBe('1,200 m²');
  });
});
