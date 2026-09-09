import type { ReactNode } from 'react';
import type { DataRepository } from './DataRepository';
import { RepositoryContext, defaultRepository } from './repositoryContext';

/**
 * Mounts the active repository for the tree. The implementation itself is chosen in
 * repositoryContext.ts; this component only makes it available.
 */
export function RepositoryProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode;
  /** Overridable so tests can drive the tree with any adapter. */
  repository?: DataRepository;
}) {
  return <RepositoryContext value={repository}>{children}</RepositoryContext>;
}
