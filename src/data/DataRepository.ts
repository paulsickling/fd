/**
 * The data boundary.
 *
 * Everything above this line (features, components, hooks) depends ONLY on this interface.
 * Everything below it (src/data/json, src/data/remote) knows where data actually comes
 * from. The ESLint guardrail in eslint.config.js enforces the separation.
 *
 * Every method is async even in the JSON adapter, so no call site changes shape when the
 * source becomes a network call — that is what makes SPEC.md CAP-7 a one-line swap at the
 * composition root rather than a refactor.
 */

import type {
  Destination,
  Property,
  SurfBreak,
  TenureRegime,
} from '@/domain/types';
import type { PropertySearchCriteria } from '@/domain/filters';

export type { PropertySearchCriteria };

export interface DataRepository {
  listDestinations(): Promise<Destination[]>;
  getDestination(id: string): Promise<Destination | null>;

  /** All breaks, or just one destination's when `destinationId` is given. */
  listBreaks(destinationId?: string): Promise<SurfBreak[]>;
  getBreak(id: string): Promise<SurfBreak | null>;

  /**
   * Filtering and sorting happen behind this boundary: in memory under JSON, as query
   * parameters against a real API. Callers never learn which.
   */
  searchProperties(criteria?: PropertySearchCriteria): Promise<Property[]>;
  getProperty(id: string): Promise<Property | null>;

  /** The reverse edge of the property-to-break graph (SPEC.md CAP-4). */
  getPropertiesNearBreak(breakId: string): Promise<Property[]>;

  listTenureRegimes(): Promise<TenureRegime[]>;
  getTenureRegime(countryCode: string): Promise<TenureRegime | null>;
}
