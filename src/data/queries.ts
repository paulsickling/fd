/**
 * TanStack Query hooks — the only way feature code reads data.
 *
 * Query keys are domain-shaped and stable, so caching behaves identically whichever
 * adapter is mounted. Nothing here knows whether the answer came from bundled JSON or a
 * network call.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Destination, Property, SurfBreak, TenureRegime } from '@/domain/types';
import type { PropertySearchCriteria } from './DataRepository';
import { useRepository } from './repositoryContext';

export const queryKeys = {
  destinations: ['destinations'] as const,
  destination: (id: string) => ['destination', id] as const,
  breaks: (destinationId?: string) => ['breaks', destinationId ?? 'all'] as const,
  break: (id: string) => ['break', id] as const,
  properties: (criteria: PropertySearchCriteria) => ['properties', criteria] as const,
  property: (id: string) => ['property', id] as const,
  propertiesNearBreak: (breakId: string) => ['properties-near-break', breakId] as const,
  tenureRegimes: ['tenure-regimes'] as const,
  tenureRegime: (countryCode: string) => ['tenure-regime', countryCode] as const,
};

export function useDestinations(): UseQueryResult<Destination[]> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.destinations,
    queryFn: () => repository.listDestinations(),
  });
}

export function useDestination(id: string): UseQueryResult<Destination | null> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.destination(id),
    queryFn: () => repository.getDestination(id),
  });
}

export function useBreaks(destinationId?: string): UseQueryResult<SurfBreak[]> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.breaks(destinationId),
    queryFn: () => repository.listBreaks(destinationId),
  });
}

export function useBreak(id: string): UseQueryResult<SurfBreak | null> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.break(id),
    queryFn: () => repository.getBreak(id),
  });
}

export function useProperties(
  criteria: PropertySearchCriteria = {},
): UseQueryResult<Property[]> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.properties(criteria),
    queryFn: () => repository.searchProperties(criteria),
  });
}

export function useProperty(id: string): UseQueryResult<Property | null> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.property(id),
    queryFn: () => repository.getProperty(id),
  });
}

export function usePropertiesNearBreak(breakId: string): UseQueryResult<Property[]> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.propertiesNearBreak(breakId),
    queryFn: () => repository.getPropertiesNearBreak(breakId),
  });
}

export function useTenureRegimes(): UseQueryResult<TenureRegime[]> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.tenureRegimes,
    queryFn: () => repository.listTenureRegimes(),
  });
}

export function useTenureRegime(countryCode: string): UseQueryResult<TenureRegime | null> {
  const repository = useRepository();
  return useQuery({
    queryKey: queryKeys.tenureRegime(countryCode),
    queryFn: () => repository.getTenureRegime(countryCode),
  });
}
