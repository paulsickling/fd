/**
 * The DataRepository contract.
 *
 * One suite, executed against every adapter. This file is the evidence for SPEC.md CAP-7:
 * "swappable later" is only a claim until the JSON adapter and a genuinely different
 * transport both satisfy the same behavioural definition. Adding a GraphQL adapter later
 * means calling runDataRepositoryContract with it and changing nothing else.
 *
 * Note it asserts behaviour, never a specific record — the suite must stay true as the
 * seed data grows.
 */

import { describe, expect, it } from 'vitest';
import type { DataRepository } from '@/data/DataRepository';

export function runDataRepositoryContract(
  adapterName: string,
  createRepository: () => DataRepository,
): void {
  describe(`DataRepository contract: ${adapterName}`, () => {
    it('lists every destination', async () => {
      const repo = createRepository();
      const destinations = await repo.listDestinations();

      expect(destinations.length).toBeGreaterThan(0);
      expect(destinations.map((d) => d.id)).toEqual(
        expect.arrayContaining(['bali', 'ko-samui', 'mentawais']),
      );
    });

    it('gets a destination by id and returns null for an unknown one', async () => {
      const repo = createRepository();

      await expect(repo.getDestination('bali')).resolves.toMatchObject({ id: 'bali' });
      await expect(repo.getDestination('atlantis')).resolves.toBeNull();
    });

    it('lists breaks and narrows them by destination', async () => {
      const repo = createRepository();
      const all = await repo.listBreaks();
      const baliBreaks = await repo.listBreaks('bali');

      expect(all.length).toBeGreaterThan(baliBreaks.length);
      expect(baliBreaks.length).toBeGreaterThan(0);
      expect(baliBreaks.every((b) => b.destinationId === 'bali')).toBe(true);
    });

    it('gets a break by id and returns null for an unknown one', async () => {
      const repo = createRepository();

      await expect(repo.getBreak('uluwatu')).resolves.toMatchObject({ id: 'uluwatu' });
      await expect(repo.getBreak('nowhere-left')).resolves.toBeNull();
    });

    it('returns all properties when no criteria are supplied', async () => {
      const repo = createRepository();
      const properties = await repo.searchProperties();

      expect(properties.length).toBeGreaterThan(0);
    });

    it('filters properties by destination', async () => {
      const repo = createRepository();
      const properties = await repo.searchProperties({ destinationId: 'ko-samui' });

      expect(properties.length).toBeGreaterThan(0);
      expect(properties.every((p) => p.destinationId === 'ko-samui')).toBe(true);
    });

    it('filters properties by price band', async () => {
      const repo = createRepository();
      const all = await repo.searchProperties();
      const prices = all.map((p) => p.priceUsd).sort((a, b) => a - b);
      const median = prices[Math.floor(prices.length / 2)]!;

      const affordable = await repo.searchProperties({ maxPriceUsd: median });

      expect(affordable.length).toBeGreaterThan(0);
      expect(affordable.length).toBeLessThan(all.length);
      expect(affordable.every((p) => p.priceUsd <= median)).toBe(true);
    });

    it('combines filters conjunctively', async () => {
      const repo = createRepository();
      const properties = await repo.searchProperties({
        destinationId: 'bali',
        minBedrooms: 3,
      });

      expect(properties.every((p) => p.destinationId === 'bali' && p.bedrooms >= 3)).toBe(true);
    });

    it('sorts by price in both directions', async () => {
      const repo = createRepository();
      const ascending = await repo.searchProperties({ sort: 'price-asc' });
      const descending = await repo.searchProperties({ sort: 'price-desc' });

      const ascPrices = ascending.map((p) => p.priceUsd);
      expect(ascPrices).toEqual([...ascPrices].sort((a, b) => a - b));
      expect(descending.map((p) => p.priceUsd)).toEqual([...ascPrices].reverse());
    });

    it('returns a deterministic order for identical queries', async () => {
      const repo = createRepository();
      const first = await repo.searchProperties({ destinationId: 'bali' });
      const second = await repo.searchProperties({ destinationId: 'bali' });

      expect(first.map((p) => p.id)).toEqual(second.map((p) => p.id));
    });

    it('filters properties by surf attributes of their nearby breaks', async () => {
      const repo = createRepository();
      const breaks = await repo.listBreaks();
      const beginnerFriendly = await repo.searchProperties({ skill: 'beginner' });

      const breaksById = new Map(breaks.map((b) => [b.id, b]));
      for (const property of beginnerFriendly) {
        const hasBeginnerBreak = property.nearbyBreaks.some((edge) => {
          const surfBreak = breaksById.get(edge.breakId);
          return surfBreak !== undefined && surfBreak.skill === 'beginner';
        });
        expect(hasBeginnerBreak).toBe(true);
      }
    });

    it('gets a property by id and returns null for an unknown one', async () => {
      const repo = createRepository();
      const [first] = await repo.searchProperties();

      await expect(repo.getProperty(first!.id)).resolves.toMatchObject({ id: first!.id });
      await expect(repo.getProperty('no-such-property')).resolves.toBeNull();
    });

    it('walks the property-to-break edge in both directions', async () => {
      const repo = createRepository();
      const [property] = await repo.searchProperties({ destinationId: 'bali' });
      const edge = property!.nearbyBreaks[0]!;

      const surfBreak = await repo.getBreak(edge.breakId);
      expect(surfBreak).not.toBeNull();

      const neighbours = await repo.getPropertiesNearBreak(edge.breakId);
      expect(neighbours.map((p) => p.id)).toContain(property!.id);
    });

    it('returns no properties for a break nothing sits near', async () => {
      const repo = createRepository();
      await expect(repo.getPropertiesNearBreak('not-a-break')).resolves.toEqual([]);
    });

    it('exposes tenure regimes for both countries', async () => {
      const repo = createRepository();
      const regimes = await repo.listTenureRegimes();

      expect(regimes.map((r) => r.countryCode)).toEqual(expect.arrayContaining(['ID', 'TH']));
      await expect(repo.getTenureRegime('ID')).resolves.toMatchObject({ countryCode: 'ID' });
      await expect(repo.getTenureRegime('ZZ')).resolves.toBeNull();
    });

    it('references only tenure types its country regime declares', async () => {
      const repo = createRepository();
      const properties = await repo.searchProperties();
      const destinations = await repo.listDestinations();
      const regimes = await repo.listTenureRegimes();

      const destinationCountry = new Map(destinations.map((d) => [d.id, d.countryCode]));
      const allowedByCountry = new Map(
        regimes.map((r) => [r.countryCode, new Set(r.types.map((t) => t.id))]),
      );

      for (const property of properties) {
        const countryCode = destinationCountry.get(property.destinationId)!;
        expect(allowedByCountry.get(countryCode)!.has(property.tenure)).toBe(true);
      }
    });
  });
}
