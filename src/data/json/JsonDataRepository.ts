/**
 * The adapter that ships with the PoC: reads the bundled, researched seed data.
 *
 * This is the ONLY place seed JSON is imported. It is deliberately async despite being
 * synchronous underneath, so swapping in RemoteDataRepository changes nothing above.
 */

import type { DataRepository, PropertySearchCriteria } from '../DataRepository';
import type { Destination, Property, SurfBreak, TenureRegime } from '@/domain/types';
import { filterProperties, sortProperties } from '@/domain/filters';

import destinationsSeed from './destinations.json';
import surfBreaksSeed from './surf-breaks.json';
import propertiesSeed from './properties.json';
import tenureRegimesSeed from './tenure-regimes.json';

export interface JsonSeed {
  readonly destinations: readonly Destination[];
  readonly breaks: readonly SurfBreak[];
  readonly properties: readonly Property[];
  readonly tenureRegimes: readonly TenureRegime[];
}

/** The bundled seed, exported so tests and the fake remote backend serve identical data. */
export const bundledSeed: JsonSeed = {
  destinations: destinationsSeed as unknown as Destination[],
  breaks: surfBreaksSeed as unknown as SurfBreak[],
  properties: propertiesSeed as unknown as Property[],
  tenureRegimes: tenureRegimesSeed as unknown as TenureRegime[],
};

export class JsonDataRepository implements DataRepository {
  private readonly seed: JsonSeed;

  constructor(seed: JsonSeed = bundledSeed) {
    this.seed = seed;
  }

  async listDestinations(): Promise<Destination[]> {
    return [...this.seed.destinations];
  }

  async getDestination(id: string): Promise<Destination | null> {
    return this.seed.destinations.find((d) => d.id === id) ?? null;
  }

  async listBreaks(destinationId?: string): Promise<SurfBreak[]> {
    const all = this.seed.breaks;
    return destinationId === undefined
      ? [...all]
      : all.filter((b) => b.destinationId === destinationId);
  }

  async getBreak(id: string): Promise<SurfBreak | null> {
    return this.seed.breaks.find((b) => b.id === id) ?? null;
  }

  async searchProperties(criteria: PropertySearchCriteria = {}): Promise<Property[]> {
    return filterProperties(this.seed.properties, this.seed.breaks, criteria);
  }

  async getProperty(id: string): Promise<Property | null> {
    return this.seed.properties.find((p) => p.id === id) ?? null;
  }

  async getPropertiesNearBreak(breakId: string): Promise<Property[]> {
    const matched = this.seed.properties.filter((p) =>
      p.nearbyBreaks.some((edge) => edge.breakId === breakId),
    );
    // Nearest first: the useful order on a break page.
    return sortProperties(matched, 'closest-break');
  }

  async listTenureRegimes(): Promise<TenureRegime[]> {
    return [...this.seed.tenureRegimes];
  }

  async getTenureRegime(countryCode: string): Promise<TenureRegime | null> {
    return this.seed.tenureRegimes.find((r) => r.countryCode === countryCode) ?? null;
  }
}
