/**
 * Runs the one contract suite against both adapters.
 *
 * If this file ever needs different expectations per adapter, the abstraction has leaked
 * and CAP-7 is no longer true.
 */

import { expect, it } from 'vitest';
import { JsonDataRepository, bundledSeed } from './json/JsonDataRepository';
import { RemoteDataRepository } from './remote/RemoteDataRepository';
import { runDataRepositoryContract } from '@/test/repositoryContract';
import { createFakeRemoteBackend } from '@/test/fakeRemoteBackend';

runDataRepositoryContract('JsonDataRepository', () => new JsonDataRepository());

runDataRepositoryContract('RemoteDataRepository (over a fake REST backend)', () => {
  const backend = createFakeRemoteBackend(bundledSeed);
  return new RemoteDataRepository({ baseUrl: backend.baseUrl, fetchFn: backend.fetchFn });
});

// Guards against the remote adapter accidentally satisfying the contract by shortcutting
// the transport: if it stopped issuing requests, the suite above would still pass.
it('drives the remote adapter over real request URLs with serialised criteria', async () => {
  const backend = createFakeRemoteBackend(bundledSeed);
  const repo = new RemoteDataRepository({ baseUrl: backend.baseUrl, fetchFn: backend.fetchFn });

  await repo.searchProperties({ destinationId: 'bali', minBedrooms: 3, sort: 'price-asc' });
  await repo.getDestination('ko-samui');

  expect(backend.calls).toEqual([
    '/properties?destinationId=bali&minBedrooms=3&sort=price-asc',
    '/destinations/ko-samui',
  ]);
});
