/**
 * The composition root for the data layer.
 *
 * This is the ONE place in the application where a concrete repository implementation is
 * named. Swapping the PoC's bundled JSON for a live API is a change to `defaultRepository`
 * below and nothing else — no component, hook, or domain function is aware of the choice.
 * That is the whole of SPEC.md CAP-7.
 *
 * It lives under src/data/ deliberately: the ESLint guardrail forbids importing a concrete
 * adapter anywhere else, and the composition root is the intended exception.
 */

import { createContext, useContext } from 'react';
import type { DataRepository } from './DataRepository';
import { JsonDataRepository } from './json/JsonDataRepository';

/**
 * The active repository.
 *
 * To move to a real backend, replace this with:
 *
 *   new RemoteDataRepository({ baseUrl: import.meta.env.VITE_API_URL, fetchFn: fetch })
 *
 * The contract suite in DataRepository.contract.test.ts already proves that adapter
 * satisfies the same behaviour, so nothing above this line has to change.
 */
export const defaultRepository: DataRepository = new JsonDataRepository();

export const RepositoryContext = createContext<DataRepository | null>(null);

export function useRepository(): DataRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return repository;
}
