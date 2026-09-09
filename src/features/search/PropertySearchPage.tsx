import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBreaks, useDestinations, useProperties, useTenureRegimes } from '@/data/queries';
import { PropertyCard } from '@/components/PropertyCard';
import { MatchBadge } from '@/components/MatchBadge';
import { useSurferProfile } from '@/features/profile/surferProfileContext';
import { rankProperties } from '@/domain/matching';
import { SearchFilters } from './SearchFilters';
import { criteriaFromSearchParams, criteriaToSearchParams } from '@/domain/criteriaUrl';
import type { PropertySearchCriteria } from '@/domain/filters';
import type { TenureTypeId } from '@/domain/types';

/**
 * Property search (SPEC.md CAP-2).
 *
 * Filter state lives in the URL, not in component state — a search is a thing you send
 * someone, and reproducing it exactly is a stated success criterion. The URL is also
 * user-editable, so criteria are validated on the way in by criteriaFromSearchParams.
 */
export function PropertySearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const criteria = useMemo(
    () => criteriaFromSearchParams(searchParams),
    [searchParams],
  );

  const destinations = useDestinations();
  const regimes = useTenureRegimes();
  const properties = useProperties(criteria);
  const breaks = useBreaks();
  const { profile } = useSurferProfile();

  const applyCriteria = useCallback(
    (next: PropertySearchCriteria) => {
      // replace, not push: dragging a price filter should not bury the back button.
      setSearchParams(criteriaToSearchParams(next), { replace: true });
    },
    [setSearchParams],
  );

  const clearCriteria = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  /**
   * With a profile set, the same result set is re-ordered by match and each card explains
   * its score. With none, the repository's own ordering stands — the profile is a lens on
   * the results, never a filter that hides listings.
   */
  const ranked = useMemo(() => {
    const found = properties.data ?? [];
    if (!profile || !breaks.data) {
      return found.map((property) => ({ property, match: null }));
    }
    return rankProperties(found, breaks.data, profile).map(({ property, match }) => ({
      property,
      match,
    }));
  }, [properties.data, breaks.data, profile]);

  const tenureLabels = useMemo(() => {
    const labels = new Map<TenureTypeId, string>();
    for (const regime of regimes.data ?? []) {
      for (const type of regime.types) labels.set(type.id, type.label);
    }
    return labels;
  }, [regimes.data]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl font-light tracking-tight text-ink-900 sm:text-4xl">
        Every listing
      </h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        Filter by the water as readily as by the house — ability, break type, and how far you
        are willing to travel for it.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[260px_1fr]">
        <aside>
          <SearchFilters
            criteria={criteria}
            destinations={destinations.data ?? []}
            regimes={regimes.data ?? []}
            onChange={applyCriteria}
            onClear={clearCriteria}
            resultCount={properties.data?.length}
          />
        </aside>

        <section aria-label="Search results">
          {properties.isPending ? <p className="text-sm text-ink-700">Searching…</p> : null}

          {properties.isError ? (
            <p className="text-sm text-ink-900">
              We couldn&rsquo;t load listings just now. Please try again.
            </p>
          ) : null}

          {properties.data?.length === 0 ? (
            <div className="border-t border-sand-200 pt-8">
              <p className="text-ink-900">Nothing matches all of those filters.</p>
              <p className="mt-2 text-sm text-ink-700">
                Widening the travel time or the ability level usually opens things up — the
                best waves and the easiest waves are rarely at the same address.
              </p>
            </div>
          ) : null}

          {properties.data && properties.data.length > 0 ? (
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {ranked.map(({ property, match }) => (
                <li key={property.id}>
                  <PropertyCard
                    property={property}
                    {...(tenureLabels.get(property.tenure)
                      ? { tenureLabel: tenureLabels.get(property.tenure)! }
                      : {})}
                  />
                  {match ? <MatchBadge match={match} className="mt-2" /> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </main>
  );
}
