/**
 * Referential and factual integrity of the seeded atlas.
 *
 * The seed is authored by hand from researched sources, so nothing but a test stops it
 * drifting out of agreement with itself. These assertions caught a real problem already:
 * destination priceRange values were estimated before the properties existed and no longer
 * matched them.
 *
 * These are data assertions, not behaviour — they belong here rather than in the
 * repository contract, which must stay true of any adapter regardless of its data.
 */

import { describe, expect, it } from 'vitest';
import { bundledSeed } from './json/JsonDataRepository';
import { MONTHS_IN_YEAR } from '@/domain/seasonality';

const { destinations, breaks, properties, tenureRegimes } = bundledSeed;

describe('seed referential integrity', () => {
  it('gives every entity a unique id', () => {
    const unique = (ids: readonly string[]) => new Set(ids).size === ids.length;

    expect(unique(destinations.map((d) => d.id))).toBe(true);
    expect(unique(breaks.map((b) => b.id))).toBe(true);
    expect(unique(properties.map((p) => p.id))).toBe(true);
  });

  it('points every break at a destination that exists', () => {
    const destinationIds = new Set(destinations.map((d) => d.id));
    for (const surfBreak of breaks) {
      expect(destinationIds.has(surfBreak.destinationId)).toBe(true);
    }
  });

  it('keeps destination breakIds in agreement with the breaks themselves', () => {
    for (const destination of destinations) {
      const actual = breaks.filter((b) => b.destinationId === destination.id).map((b) => b.id);
      expect([...destination.breakIds].sort()).toEqual([...actual].sort());
    }
  });

  it('points every property at a destination that exists', () => {
    const destinationIds = new Set(destinations.map((d) => d.id));
    for (const property of properties) {
      expect(destinationIds.has(property.destinationId)).toBe(true);
    }
  });

  it('only links properties to breaks in their own destination', () => {
    const breaksById = new Map(breaks.map((b) => [b.id, b]));
    for (const property of properties) {
      for (const edge of property.nearbyBreaks) {
        const surfBreak = breaksById.get(edge.breakId);
        expect(surfBreak, `${property.id} -> ${edge.breakId}`).toBeDefined();
        expect(surfBreak!.destinationId).toBe(property.destinationId);
      }
    }
  });

  it('matches each destination price range to its actual properties', () => {
    for (const destination of destinations) {
      const prices = properties
        .filter((p) => p.destinationId === destination.id)
        .map((p) => p.priceUsd);

      expect(prices.length).toBeGreaterThan(0);
      expect(destination.priceRange.minUsd).toBe(Math.min(...prices));
      expect(destination.priceRange.maxUsd).toBe(Math.max(...prices));
    }
  });
});

describe('seed factual integrity', () => {
  it('gives every break exactly twelve monthly scores in range', () => {
    for (const surfBreak of breaks) {
      expect(surfBreak.seasonality, surfBreak.id).toHaveLength(MONTHS_IN_YEAR);
      for (const score of surfBreak.seasonality) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      }
    }
  });

  it('keeps every map point inside the canvas', () => {
    const inRange = (value: number) => value >= 0 && value <= 1;
    for (const surfBreak of breaks) {
      expect(inRange(surfBreak.mapPoint.x) && inRange(surfBreak.mapPoint.y), surfBreak.id).toBe(
        true,
      );
    }
    for (const property of properties) {
      expect(inRange(property.mapPoint.x) && inRange(property.mapPoint.y), property.id).toBe(true);
    }
  });

  it('never places a break below its own skill floor', () => {
    const order = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 } as const;
    for (const surfBreak of breaks) {
      expect(order[surfBreak.skillCeiling], surfBreak.id).toBeGreaterThanOrEqual(
        order[surfBreak.skill],
      );
    }
  });

  it('only uses tenure types its country regime actually offers to foreigners', () => {
    const destinationCountry = new Map(destinations.map((d) => [d.id, d.countryCode]));
    const regimeByCountry = new Map(tenureRegimes.map((r) => [r.countryCode, r]));

    for (const property of properties) {
      const countryCode = destinationCountry.get(property.destinationId)!;
      const regime = regimeByCountry.get(countryCode);
      expect(regime, `no regime for ${countryCode}`).toBeDefined();

      const type = regime!.types.find((t) => t.id === property.tenure);
      expect(type, `${property.id} uses ${property.tenure} in ${countryCode}`).toBeDefined();
      // Every listing is aimed at a foreign buyer, so an ineligible tenure is a data bug.
      expect(type!.foreignerEligible).toBe(true);
    }
  });

  it('credits every image, because the licence requires it', () => {
    const images = [
      ...destinations.map((d) => d.heroImage),
      ...properties.flatMap((p) => [...p.images]),
    ];

    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image.src).toMatch(/^https:\/\//);
      expect(image.alt.length).toBeGreaterThan(3);
      expect(image.credit.length).toBeGreaterThan(0);
      expect(image.creditUrl).toMatch(/^https:\/\//);
    }
  });

  it('has properties walkable to a break, so the dawn-patrol treatment can render', () => {
    const walkable = properties.filter((p) =>
      p.nearbyBreaks.some((edge) => edge.travelMode === 'walk' && edge.travelMinutes <= 10),
    );

    expect(walkable.length).toBeGreaterThanOrEqual(3);
  });

  it('reproduces the seasonal inversion the product is built on', () => {
    const scoreFor = (id: string, months: readonly number[]) => {
      const surfBreak = breaks.find((b) => b.id === id)!;
      return months.reduce((sum, m) => sum + surfBreak.seasonality[m - 1]!, 0) / months.length;
    };
    const southernWinter = [6, 7, 8];
    const northernWinter = [12, 1, 2];

    // Bali's Bukit fires mid-year; Ko Samui fires at the turn of the year.
    expect(scoreFor('uluwatu', southernWinter)).toBeGreaterThan(scoreFor('uluwatu', northernWinter));
    expect(scoreFor('chaweng', northernWinter)).toBeGreaterThan(scoreFor('chaweng', southernWinter));
    // And Bali's own east coast inverts against its west coast.
    expect(scoreFor('keramas', northernWinter)).toBeGreaterThan(scoreFor('keramas', southernWinter));
  });
});
