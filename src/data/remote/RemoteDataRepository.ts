/**
 * The adapter that proves the swap (SPEC.md CAP-7).
 *
 * It is a real REST client, not a mock: it builds URLs, serialises the same criteria
 * object into query parameters, and parses responses. What makes it testable today is
 * that `fetch` is injected — the contract suite hands it a fake backend serving the
 * identical seed, so the SAME tests that pass against JsonDataRepository pass against
 * this one. Point `baseUrl` at a live service and delete nothing.
 *
 * A GraphQL variant would replace only the bodies of these methods; the interface, the
 * hooks above it, and every component stay untouched.
 */

import type { DataRepository, PropertySearchCriteria } from '../DataRepository';
import type { Destination, Property, SurfBreak, TenureRegime } from '@/domain/types';
import { criteriaToSearchParams } from '@/domain/criteriaUrl';

export type FetchLike = (
  input: string,
  init?: { readonly signal?: AbortSignal },
) => Promise<{ readonly ok: boolean; readonly status: number; json(): Promise<unknown> }>;

export interface RemoteDataRepositoryOptions {
  readonly baseUrl: string;
  /** Injected so the contract suite can drive this adapter without a live server. */
  readonly fetchFn: FetchLike;
}

export class RemoteDataRepository implements DataRepository {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchLike;

  constructor({ baseUrl, fetchFn }: RemoteDataRepositoryOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchFn = fetchFn;
  }

  private async get<T>(path: string, params?: URLSearchParams): Promise<T> {
    const query = params && [...params.keys()].length > 0 ? `?${params.toString()}` : '';
    const response = await this.fetchFn(`${this.baseUrl}${path}${query}`);
    if (!response.ok) {
      throw new Error(`Request failed: GET ${path} returned ${response.status}`);
    }
    return (await response.json()) as T;
  }

  /** 404 is a legitimate "not found", not a transport failure. */
  private async getOrNull<T>(path: string): Promise<T | null> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Request failed: GET ${path} returned ${response.status}`);
    }
    return (await response.json()) as T;
  }

  /**
   * The criteria object becomes query parameters here, using the same wire format the
   * browser URL uses (src/domain/criteriaUrl). This is the line where "filtering happens
   * behind the repository" stops being a slogan: under JSON it is an in-memory predicate,
   * under REST it is the server's problem, and the caller cannot tell.
   */
  static toQueryParams(criteria: PropertySearchCriteria): URLSearchParams {
    return criteriaToSearchParams(criteria);
  }

  async listDestinations(): Promise<Destination[]> {
    return this.get<Destination[]>('/destinations');
  }

  async getDestination(id: string): Promise<Destination | null> {
    return this.getOrNull<Destination>(`/destinations/${encodeURIComponent(id)}`);
  }

  async listBreaks(destinationId?: string): Promise<SurfBreak[]> {
    const params = new URLSearchParams();
    if (destinationId !== undefined) params.set('destinationId', destinationId);
    return this.get<SurfBreak[]>('/breaks', params);
  }

  async getBreak(id: string): Promise<SurfBreak | null> {
    return this.getOrNull<SurfBreak>(`/breaks/${encodeURIComponent(id)}`);
  }

  async searchProperties(criteria: PropertySearchCriteria = {}): Promise<Property[]> {
    return this.get<Property[]>('/properties', RemoteDataRepository.toQueryParams(criteria));
  }

  async getProperty(id: string): Promise<Property | null> {
    return this.getOrNull<Property>(`/properties/${encodeURIComponent(id)}`);
  }

  async getPropertiesNearBreak(breakId: string): Promise<Property[]> {
    return this.get<Property[]>(`/breaks/${encodeURIComponent(breakId)}/properties`);
  }

  async listTenureRegimes(): Promise<TenureRegime[]> {
    return this.get<TenureRegime[]>('/tenure-regimes');
  }

  async getTenureRegime(countryCode: string): Promise<TenureRegime | null> {
    return this.getOrNull<TenureRegime>(`/tenure-regimes/${encodeURIComponent(countryCode)}`);
  }
}
