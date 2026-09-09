/**
 * An in-process REST server standing in for the future API.
 *
 * It routes the exact URLs RemoteDataRepository builds, parses the query string back into
 * a PropertySearchCriteria, and answers from the same seed the JSON adapter uses. That
 * round trip — criteria to query params and back — is what makes the contract suite a
 * real test of the remote adapter rather than a mock returning canned values.
 */

import type { JsonSeed } from '@/data/json/JsonDataRepository';
import type { FetchLike } from '@/data/remote/RemoteDataRepository';
import type {
  BreakDirection,
  BreakType,
  PropertyType,
  SkillLevel,
  TenureTypeId,
} from '@/domain/types';
import { filterProperties, sortProperties } from '@/domain/filters';
import type { PropertySearchCriteria, PropertySort } from '@/domain/filters';

const BASE = 'https://api.example.test';

function json(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const notFound = () => json({ error: 'not found' }, 404);

function num(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  return raw === null ? undefined : Number(raw);
}

function csv<T extends string>(params: URLSearchParams, key: string): readonly T[] | undefined {
  const raw = params.get(key);
  return raw === null ? undefined : (raw.split(',') as T[]);
}

export function parseCriteria(params: URLSearchParams): PropertySearchCriteria {
  const seaViewRaw = params.get('seaView');
  return {
    ...(params.get('destinationId') !== null && { destinationId: params.get('destinationId')! }),
    ...(num(params, 'minPriceUsd') !== undefined && { minPriceUsd: num(params, 'minPriceUsd')! }),
    ...(num(params, 'maxPriceUsd') !== undefined && { maxPriceUsd: num(params, 'maxPriceUsd')! }),
    ...(num(params, 'minBedrooms') !== undefined && { minBedrooms: num(params, 'minBedrooms')! }),
    ...(seaViewRaw !== null && { seaView: seaViewRaw === 'true' }),
    ...(params.get('breakDirection') !== null && {
      breakDirection: params.get('breakDirection') as BreakDirection,
    }),
    ...(params.get('skill') !== null && { skill: params.get('skill') as SkillLevel }),
    ...(num(params, 'maxTravelMinutes') !== undefined && {
      maxTravelMinutes: num(params, 'maxTravelMinutes')!,
    }),
    ...(params.get('sort') !== null && { sort: params.get('sort') as PropertySort }),
    ...(csv<PropertyType>(params, 'propertyTypes') && {
      propertyTypes: csv<PropertyType>(params, 'propertyTypes')!,
    }),
    ...(csv<TenureTypeId>(params, 'tenureTypes') && {
      tenureTypes: csv<TenureTypeId>(params, 'tenureTypes')!,
    }),
    ...(csv<BreakType>(params, 'breakTypes') && {
      breakTypes: csv<BreakType>(params, 'breakTypes')!,
    }),
  };
}

export interface FakeRemoteBackend {
  readonly baseUrl: string;
  readonly fetchFn: FetchLike;
  /** Every path the adapter requested, in order — lets tests assert real HTTP was used. */
  readonly calls: string[];
}

export function createFakeRemoteBackend(seed: JsonSeed): FakeRemoteBackend {
  const calls: string[] = [];

  const fetchFn: FetchLike = async (input) => {
    const url = new URL(input);
    const path = url.pathname;
    const params = url.searchParams;
    calls.push(`${path}${params.size > 0 ? `?${params.toString()}` : ''}`);

    if (path === '/destinations') return json(seed.destinations);
    if (path === '/breaks') {
      const destinationId = params.get('destinationId');
      return json(
        destinationId === null
          ? seed.breaks
          : seed.breaks.filter((b) => b.destinationId === destinationId),
      );
    }
    if (path === '/properties') {
      return json(filterProperties(seed.properties, seed.breaks, parseCriteria(params)));
    }
    if (path === '/tenure-regimes') return json(seed.tenureRegimes);

    const destinationMatch = /^\/destinations\/([^/]+)$/.exec(path);
    if (destinationMatch) {
      const id = decodeURIComponent(destinationMatch[1]!);
      const found = seed.destinations.find((d) => d.id === id);
      return found ? json(found) : notFound();
    }

    const breakPropertiesMatch = /^\/breaks\/([^/]+)\/properties$/.exec(path);
    if (breakPropertiesMatch) {
      const id = decodeURIComponent(breakPropertiesMatch[1]!);
      const matched = seed.properties.filter((p) =>
        p.nearbyBreaks.some((edge) => edge.breakId === id),
      );
      return json(sortProperties(matched, 'closest-break'));
    }

    const breakMatch = /^\/breaks\/([^/]+)$/.exec(path);
    if (breakMatch) {
      const id = decodeURIComponent(breakMatch[1]!);
      const found = seed.breaks.find((b) => b.id === id);
      return found ? json(found) : notFound();
    }

    const propertyMatch = /^\/properties\/([^/]+)$/.exec(path);
    if (propertyMatch) {
      const id = decodeURIComponent(propertyMatch[1]!);
      const found = seed.properties.find((p) => p.id === id);
      return found ? json(found) : notFound();
    }

    const regimeMatch = /^\/tenure-regimes\/([^/]+)$/.exec(path);
    if (regimeMatch) {
      const code = decodeURIComponent(regimeMatch[1]!);
      const found = seed.tenureRegimes.find((r) => r.countryCode === code);
      return found ? json(found) : notFound();
    }

    return notFound();
  };

  return { baseUrl: BASE, fetchFn, calls };
}
