import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { DataRepository } from '@/data/DataRepository';

/**
 * The application's provider stack.
 *
 * The data source itself is chosen inside RepositoryProvider (src/data/repositoryContext),
 * which is the single composition point behind SPEC.md CAP-7. `repository` is exposed here
 * only so tests can mount the tree against any adapter.
 */
export function AppProviders({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: DataRepository;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Seeded data never changes within a session; a real API can relax this.
            staleTime: Infinity,
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RepositoryProvider {...(repository ? { repository } : {})}>{children}</RepositoryProvider>
    </QueryClientProvider>
  );
}
