import { Link, useParams } from 'react-router-dom';
import {
  useBreaks,
  useDestination,
  useProperties,
  useTenureRegime,
} from '@/data/queries';
import { PropertyCard } from '@/components/PropertyCard';
import { SeasonalityOverlay } from './SeasonalityOverlay';
import { DestinationMap } from './DestinationMap';
import {
  formatAccess,
  formatBreakSummary,
  formatPriceRange,
  formatSkillRange,
} from '@/domain/format';
import type { TenureRegime, TenureTypeId } from '@/domain/types';

/**
 * A destination page (SPEC.md CAP-1): the island's surf profile, what a foreign buyer can
 * actually own there, and only then the property grid.
 */
export function DestinationPage() {
  const { destinationId = '' } = useParams();
  const destination = useDestination(destinationId);
  const breaks = useBreaks(destinationId);
  const properties = useProperties({ destinationId });
  const regime = useTenureRegime(destination.data?.countryCode ?? '');

  if (destination.isPending) {
    return <PageMessage>Loading destination…</PageMessage>;
  }
  if (destination.isError || !destination.data) {
    return (
      <PageMessage>
        We don&rsquo;t have a destination by that name.{' '}
        <Link to="/" className="text-ocean-700 underline">
          Back to destinations
        </Link>
      </PageMessage>
    );
  }

  const place = destination.data;
  const tenureLabels = new Map<TenureTypeId, string>(
    (regime.data?.types ?? []).map((type) => [type.id, type.label]),
  );

  return (
    <main>
      <section className="relative">
        <div className="aspect-[16/9] max-h-[60vh] w-full overflow-hidden bg-sand-200 sm:aspect-[21/9]">
          <img
            src={place.heroImage.src}
            alt={place.heroImage.alt}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mx-auto max-w-6xl px-6 pt-2 text-[11px] text-ink-700">
          Photograph:{' '}
          <a href={place.heroImage.creditUrl} className="underline hover:text-ocean-700">
            {place.heroImage.credit}
          </a>
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-10">
        <p className="text-xs uppercase tracking-[0.2em] text-ocean-700">{place.country}</p>
        <h1 className="mt-3 text-4xl font-light tracking-tight text-ink-900 sm:text-5xl">
          {place.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-900">{place.tagline}</p>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-700">{place.summary}</p>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-sand-200 py-6 sm:grid-cols-4">
          <Stat label="Access" value={formatAccess(place.access)} />
          <Stat label="Surf season" value={place.surfSeason.note} />
          <Stat label="Breaks" value={String(place.breakIds.length)} />
          <Stat
            label="Guide price"
            value={formatPriceRange(place.priceRange.minUsd, place.priceRange.maxUsd)}
          />
        </dl>
      </section>

      <section aria-labelledby="breaks-heading" className="mx-auto max-w-6xl px-6 pt-14">
        <h2 id="breaks-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
          The surf
        </h2>
        {breaks.data ? (
          <ul className="mt-6 divide-y divide-sand-200 border-y border-sand-200">
            {breaks.data.map((surfBreak) => (
              <li key={surfBreak.id}>
                <Link
                  to={`/breaks/${surfBreak.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 hover:text-ocean-700"
                >
                  <span className="text-lg font-light text-ink-900">{surfBreak.name}</span>
                  <span className="text-sm text-ink-700">
                    {formatBreakSummary(surfBreak.type, surfBreak.direction)} ·{' '}
                    {formatSkillRange(surfBreak.skill, surfBreak.skillCeiling)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {breaks.data && breaks.data.length > 0 ? (
        <section aria-labelledby="season-heading" className="mx-auto max-w-6xl px-6 pt-14">
          <h2 id="season-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
            When to be here
          </h2>
          <div className="mt-6">
            <SeasonalityOverlay destination={place} breaks={breaks.data} />
          </div>
        </section>
      ) : null}

      {breaks.data && properties.data ? (
        <section aria-labelledby="map-heading" className="mx-auto max-w-6xl px-6 pt-14">
          <h2 id="map-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
            The lay of the land
          </h2>
          <div className="mt-6">
            <DestinationMap
              destination={place}
              breaks={breaks.data}
              properties={properties.data}
            />
          </div>
        </section>
      ) : null}

      {regime.data ? <TenurePanel regime={regime.data} /> : null}

      <section aria-labelledby="properties-heading" className="mx-auto max-w-6xl px-6 py-16">
        <h2 id="properties-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
          Property in {place.name}
        </h2>

        {properties.isPending ? (
          <p className="mt-6 text-sm text-ink-700">Loading property…</p>
        ) : null}

        {properties.data?.length === 0 ? (
          <p className="mt-6 text-sm text-ink-700">No listings here at the moment.</p>
        ) : null}

        {properties.data && properties.data.length > 0 ? (
          <ul className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {properties.data.map((property) => (
              <li key={property.id}>
                <PropertyCard
                  property={property}
                  {...(tenureLabels.get(property.tenure)
                    ? { tenureLabel: tenureLabels.get(property.tenure)! }
                    : {})}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

/**
 * Ownership rules, stated plainly (SPEC.md CAP-8).
 *
 * This is the section a general portal does not have, and the one an expat buyer most
 * needs: the risk note is shown at the same weight as the label, not tucked into
 * small print.
 */
function TenurePanel({ regime }: { regime: TenureRegime }) {
  return (
    <section aria-labelledby="tenure-heading" className="mx-auto max-w-6xl px-6 pt-14">
      <h2 id="tenure-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
        What a foreign buyer can own in {regime.country}
      </h2>
      <ul className="mt-6 grid gap-8 sm:grid-cols-2">
        {regime.types.map((type) => (
          <li key={type.id} className="border-t border-sand-200 pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-base text-ink-900">{type.label}</h3>
              <span className="text-xs text-ink-700">
                {type.typicalYears === null ? 'Perpetual' : `${type.typicalYears} years`}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{type.plainEnglish}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-900">{type.riskNote}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-700">{label}</dt>
      <dd className="mt-1 text-sm text-ink-900">{value}</dd>
    </div>
  );
}

function PageMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-ink-700">{children}</p>
    </main>
  );
}
