import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * The composition root. Story 2 adds the DataRepository selection here — that single
 * choice is what makes SPEC.md CAP-7 a one-line swap between the JSON adapter and a
 * remote one. Keep it the only place an implementation is named.
 */
export function AppProviders({ children }: { children: ReactNode }) {
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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
