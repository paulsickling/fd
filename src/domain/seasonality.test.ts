import { describe, expect, it } from 'vitest';
import {
  buildOverlay,
  describeMonthRange,
  destinationSeasonality,
  peakSurfMonths,
  seasonalComplementarity,
  sweetSpotMonths,
} from './seasonality';
import type { Destination, MonthScore, Seasonality, SurfBreak } from './types';

const season = (...scores: number[]) => scores as unknown as Seasonality;

// Bali's Bukit: dry season, Jun-Aug strongest.
const bukit = season(3, 3, 5, 8, 9, 10, 10, 10, 9, 8, 5, 3);
// Bali's east coast: the wet-season inversion.
const eastCoast = season(10, 10, 9, 6, 4, 3, 3, 3, 4, 6, 9, 10);
// Ko Samui: the opposite half of the year to the Bukit.
const gulf = season(9, 8, 5, 4, 2, 1, 1, 1, 1, 4, 10, 10);

function makeBreak(id: string, seasonality: Seasonality): SurfBreak {
  return {
    id,
    name: id,
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
    seasonality,
    bottom: 'reef',
    hazards: [],
    crowdFactor: 3,
    paddleOutMinutes: 5,
    notes: '',
    mapPoint: { x: 0.5, y: 0.5 },
  };
}

function makeDestination(overrides: Partial<Destination> = {}): Destination {
  return {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    countryCode: 'ID',
    tagline: '',
    summary: '',
    heroImage: { src: '', alt: '', credit: '', creditUrl: '' },
    access: 'road',
    surfSeason: { peakMonths: [6, 7, 8], shoulderMonths: [4, 5, 9, 10], note: '' },
    weatherSeason: { peakMonths: [5, 6, 7, 8, 9], shoulderMonths: [4, 10], note: '' },
    crowdSeason: { peakMonths: [7, 8], shoulderMonths: [12, 1], note: '' },
    skillRange: ['intermediate', 'advanced'],
    priceRange: { minUsd: 100_000, maxUsd: 2_000_000 },
    tenureRegimeId: 'ID',
    breakIds: [],
    mapAspect: 1.4,
    ...overrides,
  };
}

describe('destinationSeasonality', () => {
  it('takes the best break each month, so a destination is on when anywhere on it works', () => {
    const combined = destinationSeasonality([
      makeBreak('uluwatu', bukit),
      makeBreak('keramas', eastCoast),
    ]);

    // Bali reads as year-round even though each individual break has a sharp season.
    expect(Math.min(...(combined as unknown as number[]))).toBeGreaterThanOrEqual(8);
    expect(combined[0]).toBe(10); // January: east coast carries it
    expect(combined[6]).toBe(10); // July: the Bukit carries it
  });

  it('returns all zeroes for a destination with no breaks', () => {
    expect([...(destinationSeasonality([]) as unknown as number[])]).toEqual(
      Array.from({ length: 12 }, () => 0),
    );
  });
});

describe('buildOverlay', () => {
  const bands = buildOverlay(makeDestination(), [makeBreak('uluwatu', bukit)]);

  it('produces one aligned band per calendar month', () => {
    expect(bands).toHaveLength(12);
    expect(bands[0]!.label).toBe('Jan');
    expect(bands[11]!.label).toBe('Dec');
    expect(bands.map((b) => b.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('aligns surf, weather and crowd on the same axis', () => {
    const july = bands[6]!;

    expect(july.surf).toBe(10);
    expect(july.goodWeather).toBe(true);
    expect(july.busy).toBe(true);
  });
});

describe('sweetSpotMonths', () => {
  it('finds the months with good surf and good weather but no crowd peak', () => {
    const bands = buildOverlay(makeDestination(), [makeBreak('uluwatu', bukit)]);
    const sweet = sweetSpotMonths(bands).map((b) => b.label);

    // July and August are the best waves but also the crowd peak, so they are excluded;
    // this is exactly the insight the overlay exists to surface.
    expect(sweet).not.toContain('Jul');
    expect(sweet).not.toContain('Aug');
    expect(sweet).toEqual(expect.arrayContaining(['Jun', 'Sep']));
  });

  it('returns nothing when every good month is also a crowd peak', () => {
    const destination = makeDestination({
      crowdSeason: { peakMonths: [4, 5, 6, 7, 8, 9, 10], shoulderMonths: [], note: '' },
    });
    const bands = buildOverlay(destination, [makeBreak('uluwatu', bukit)]);

    expect(sweetSpotMonths(bands)).toEqual([]);
  });
});

describe('peakSurfMonths', () => {
  it('selects only months at or above the threshold', () => {
    const bands = buildOverlay(makeDestination(), [makeBreak('uluwatu', bukit)]);

    expect(peakSurfMonths(bands).map((b) => b.label)).toEqual(['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']);
    expect(peakSurfMonths(bands, 10 as MonthScore).map((b) => b.label)).toEqual(['Jun', 'Jul', 'Aug']);
  });
});

describe('seasonalComplementarity', () => {
  it('scores Bali against Ko Samui highly, which is the products core claim', () => {
    expect(seasonalComplementarity(bukit, gulf)).toBeGreaterThan(0.9);
  });

  it('scores a destination against itself poorly, since it shares its own off-season', () => {
    expect(seasonalComplementarity(bukit, bukit)).toBe(0);
  });

  it('returns 1 for a destination that is never weak', () => {
    const alwaysOn = season(9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9);
    expect(seasonalComplementarity(alwaysOn, bukit)).toBe(1);
  });
});

describe('describeMonthRange', () => {
  it('renders a contiguous run', () => {
    expect(describeMonthRange([4, 5, 6, 7, 8, 9, 10])).toBe('Apr-Oct');
  });

  it('renders a run that wraps around the new year', () => {
    expect(describeMonthRange([11, 12, 1, 2])).toBe('Nov-Feb');
  });

  it('handles the empty and full cases', () => {
    expect(describeMonthRange([])).toBe('No reliable season');
    expect(describeMonthRange([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe('Year-round');
  });
});
