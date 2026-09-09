import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SeasonalityOverlay } from './SeasonalityOverlay';
import { MONTH_LABELS, buildOverlay, sweetSpotMonths } from '../../domain/seasonality';
import type { Destination, Seasonality, SurfBreak } from '../../domain/types';

const season = (...scores: number[]) => scores as unknown as Seasonality;

/** Bali's Bukit: dry season, Jun-Aug strongest — the same shape the domain tests use. */
const bukit = season(3, 3, 5, 8, 9, 10, 10, 10, 9, 8, 5, 3);

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

const destination = makeDestination();
const breaks = [makeBreak('uluwatu', bukit)];

function monthGroups(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-month]'));
}

describe('SeasonalityOverlay', () => {
  it('renders all twelve month labels on the axis, in calendar order', () => {
    const { container } = render(
      <SeasonalityOverlay destination={destination} breaks={breaks} />,
    );

    const labels = Array.from(
      container.querySelectorAll('[data-testid="seasonality-overlay"] text'),
    ).map((node) => node.textContent);

    expect(labels).toEqual([...MONTH_LABELS]);
  });

  it('exposes the chart as an image with a name that describes the season in words', () => {
    render(<SeasonalityOverlay destination={destination} breaks={breaks} />);

    const chart = screen.getByRole('img');

    expect(chart).toHaveAccessibleName(/Bali/);
    expect(chart).toHaveAccessibleName(/surf peaks/i);
    expect(chart).toHaveAccessibleName(/crowds peak/i);
    expect(chart).toHaveAccessibleName(/sweet spot/i);
  });

  it('marks exactly the sweet-spot months, and no others', () => {
    const { container } = render(
      <SeasonalityOverlay destination={destination} breaks={breaks} />,
    );

    const expected = sweetSpotMonths(buildOverlay(destination, breaks)).map((band) => band.label);
    const marked = monthGroups(container)
      .filter((group) => group.dataset['sweetSpot'] === 'true')
      .map((group) => group.dataset['month']);

    expect(expected.length).toBeGreaterThan(0);
    expect(marked).toEqual(expected);
    // July and August are the best waves but also the crowd peak — the whole point.
    expect(marked).not.toContain('Jul');
    expect(marked).not.toContain('Aug');
  });

  it('carries the sweet spot with a non-colour marker as well as a fill', () => {
    const { container } = render(
      <SeasonalityOverlay destination={destination} breaks={breaks} />,
    );

    for (const group of monthGroups(container)) {
      const marker = group.querySelector('[data-testid="sweet-spot-marker"]');
      if (group.dataset['sweetSpot'] === 'true') {
        expect(marker).not.toBeNull();
      } else {
        expect(marker).toBeNull();
      }
    }
  });

  it('describes every month in text, including which ones are the sweet spot', () => {
    render(<SeasonalityOverlay destination={destination} breaks={breaks} />);

    // July: peak surf, good weather, but the crowd peak — so not a sweet spot.
    expect(
      screen.getByText('Jul: surf 10 out of 10, good weather, crowd peak.'),
    ).toBeInTheDocument();
    // June: the same waves without the crowd.
    expect(
      screen.getByText('Jun: surf 10 out of 10, good weather, quieter, sweet spot.'),
    ).toBeInTheDocument();
  });

  it('scales rather than fixing a pixel width, so it stays legible at 360px', () => {
    const { container } = render(
      <SeasonalityOverlay destination={destination} breaks={breaks} />,
    );

    const chart = container.querySelector('[data-testid="seasonality-overlay"]')!;

    expect(chart.getAttribute('viewBox')).toBe('0 0 360 152');
    expect(chart.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(chart.getAttribute('width')).toBeNull();
  });

  it('renders a destination with no breaks without crashing, and says there is no season', () => {
    const { container } = render(<SeasonalityOverlay destination={destination} breaks={[]} />);

    expect(monthGroups(container)).toHaveLength(12);
    expect(
      monthGroups(container).every((group) => group.dataset['sweetSpot'] === 'false'),
    ).toBe(true);
    expect(screen.getByText(/No month here reaches a peak swell window/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/no month reaches peak surf/i);
  });

  it('says so plainly when every strong month is also the crowd peak', () => {
    const crowded = makeDestination({
      crowdSeason: { peakMonths: [4, 5, 6, 7, 8, 9, 10], shoulderMonths: [], note: '' },
    });
    const { container } = render(<SeasonalityOverlay destination={crowded} breaks={breaks} />);

    expect(monthGroups(container).some((g) => g.dataset['sweetSpot'] === 'true')).toBe(false);
    expect(
      screen.getByText(/Every strong month here is also the crowd peak/),
    ).toBeInTheDocument();
  });
});
