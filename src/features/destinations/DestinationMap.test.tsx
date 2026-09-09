import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Destination, Property, Seasonality, SurfBreak } from '@/domain/types';
import { DestinationMap } from './DestinationMap';

const FLAT: Seasonality = [3, 3, 5, 8, 9, 10, 10, 10, 9, 8, 5, 3];

const destination: Destination = {
  id: 'bali',
  name: 'Bali',
  country: 'Indonesia',
  countryCode: 'ID',
  tagline: 'Two coasts, two monsoons',
  summary: 'Summary.',
  heroImage: { src: 'hero.jpg', alt: 'Hero', credit: 'Someone', creditUrl: 'https://example.test' },
  access: 'road',
  surfSeason: { peakMonths: [4, 5, 6], shoulderMonths: [3], note: 'Dry season.' },
  weatherSeason: { peakMonths: [4, 5, 6], shoulderMonths: [3], note: 'Dry season.' },
  crowdSeason: { peakMonths: [7, 8], shoulderMonths: [6], note: 'Busy mid-year.' },
  skillRange: ['intermediate', 'advanced'],
  priceRange: { minUsd: 160_000, maxUsd: 2_000_000 },
  tenureRegimeId: 'ID',
  breakIds: ['uluwatu', 'keramas'],
  mapAspect: 1.4,
};

function makeBreak(overrides: Partial<SurfBreak> & Pick<SurfBreak, 'id' | 'name'>): SurfBreak {
  return {
    aliases: [],
    destinationId: 'bali',
    type: 'reef',
    direction: 'left',
    skill: 'advanced',
    skillCeiling: 'expert',
    optimal: {
      swellDirection: 'SW',
      swellSizeFt: { min: 4, max: 12 },
      windDirection: 'SE',
      tide: 'any',
    },
    seasonality: FLAT,
    bottom: 'Coral reef',
    hazards: ['Shallow reef'],
    crowdFactor: 5,
    paddleOutMinutes: 10,
    notes: 'Notes.',
    mapPoint: { x: 0.18, y: 0.72 },
    ...overrides,
  };
}

function makeProperty(overrides: Partial<Property> & Pick<Property, 'id' | 'title'>): Property {
  return {
    destinationId: 'bali',
    locality: 'Uluwatu',
    type: 'villa',
    priceUsd: 1_200_000,
    priceLocal: { amount: 19_000_000_000, currency: 'IDR' },
    bedrooms: 4,
    bathrooms: 4,
    landSqm: 800,
    builtSqm: 420,
    tenure: 'hak-pakai',
    features: ['Pool'],
    seaView: true,
    images: [{ src: 'a.jpg', alt: 'A', credit: 'Someone', creditUrl: 'https://example.test' }],
    description: 'Description.',
    nearbyBreaks: [{ breakId: 'uluwatu', travelMinutes: 6, travelMode: 'drive' }],
    mapPoint: { x: 0.14, y: 0.62 },
    ...overrides,
  };
}

const breaks: readonly SurfBreak[] = [
  makeBreak({ id: 'uluwatu', name: 'Uluwatu' }),
  makeBreak({
    id: 'keramas',
    name: 'Keramas',
    type: 'beach',
    direction: 'right',
    mapPoint: { x: 0.78, y: 0.34 },
  }),
];

const properties: readonly Property[] = [
  makeProperty({ id: 'clifftop-pavilion', title: 'Clifftop Pavilion, Uluwatu' }),
  makeProperty({
    id: 'cliff-house',
    title: 'Cliff House, Bingin',
    bedrooms: 3,
    locality: 'Bingin',
    mapPoint: { x: 0.31, y: 0.58 },
  }),
];

function renderMap(highlightPropertyId?: string) {
  return render(
    <MemoryRouter>
      {highlightPropertyId === undefined ? (
        <DestinationMap destination={destination} breaks={breaks} properties={properties} />
      ) : (
        <DestinationMap
          destination={destination}
          breaks={breaks}
          properties={properties}
          highlightPropertyId={highlightPropertyId}
        />
      )}
    </MemoryRouter>,
  );
}

describe('DestinationMap', () => {
  it('renders one marker for every break and every property', () => {
    const { container } = renderMap();

    expect(container.querySelectorAll('[data-marker="break"]')).toHaveLength(breaks.length);
    expect(container.querySelectorAll('[data-marker="property"]')).toHaveLength(properties.length);
  });

  it('links each break marker to its break page', () => {
    const { container } = renderMap();

    for (const surfBreak of breaks) {
      const marker = container.querySelector(`[data-marker-id="${surfBreak.id}"]`);
      expect(marker).not.toBeNull();
      expect(marker).toHaveAttribute('href', `/breaks/${surfBreak.id}`);
    }
  });

  it('links each property marker to its listing page', () => {
    const { container } = renderMap();

    for (const property of properties) {
      const marker = container.querySelector(`[data-marker-id="${property.id}"]`);
      expect(marker).not.toBeNull();
      expect(marker).toHaveAttribute('href', `/properties/${property.id}`);
    }
  });

  it('gives every marker accessible text naming what it is', () => {
    renderMap();

    expect(screen.getByLabelText('Uluwatu, left-hand reef break')).toBeInTheDocument();
    expect(screen.getByLabelText('Keramas, right-hand beach break')).toBeInTheDocument();
    expect(screen.getByLabelText('Clifftop Pavilion, Uluwatu, 4-bedroom villa')).toBeInTheDocument();
    expect(screen.getByLabelText('Cliff House, Bingin, 3-bedroom villa')).toBeInTheDocument();
  });

  it('describes the map itself with a title, not as a single image', () => {
    const { container } = renderMap();

    const svg = screen.getByTestId('destination-map');
    expect(svg).not.toHaveAttribute('role', 'img');

    const labelledBy = svg.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const title = container.querySelector(`#${CSS.escape(labelledBy ?? '')}`);
    expect(title?.textContent).toContain('Bali');
    expect(title?.textContent).toContain('2 surf breaks');
    expect(title?.textContent).toContain('2 properties');
  });

  it('marks the highlighted property and leaves the others unhighlighted', () => {
    const { container } = renderMap('cliff-house');

    const highlighted = container.querySelector('[data-marker-id="cliff-house"]');
    const other = container.querySelector('[data-marker-id="clifftop-pavilion"]');

    expect(highlighted).toHaveAttribute('data-highlighted', 'true');
    expect(other).toHaveAttribute('data-highlighted', 'false');
    expect(
      screen.getByLabelText('Cliff House, Bingin, 3-bedroom villa — highlighted'),
    ).toBeInTheDocument();
  });

  it('does not highlight anything when no highlight id is supplied', () => {
    const { container } = renderMap();

    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);
  });

  it('renders the breaks and does not crash when there are no properties', () => {
    const { container } = render(
      <MemoryRouter>
        <DestinationMap destination={destination} breaks={breaks} properties={[]} />
      </MemoryRouter>,
    );

    expect(container.querySelectorAll('[data-marker="property"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-marker="break"]')).toHaveLength(breaks.length);
    expect(screen.getByLabelText('Uluwatu, left-hand reef break')).toBeInTheDocument();
  });

  it('sizes the canvas from the destination map aspect rather than fixed pixels', () => {
    renderMap();

    const svg = screen.getByTestId('destination-map');
    expect(svg).toHaveAttribute('viewBox', `0 0 1000 ${(1000 / destination.mapAspect).toFixed(1)}`);
    expect(svg).not.toHaveAttribute('width');
    expect(svg).not.toHaveAttribute('height');
  });
});
