import { Link } from 'react-router-dom';
import { useBreaks, useDestinations } from '@/data/queries';
import { destinationSeasonality, describeMonthRange, peakSurfMonths, buildOverlay } from '@/domain/seasonality';
import { formatAccess, formatPriceRange, formatSkill } from '@/domain/format';
import type { Destination, SurfBreak } from '@/domain/types';

/**
 * The discovery surface (SPEC.md CAP-1).
 *
 * Destination comes before property here — deliberately. This buyer is choosing an island
 * and a season before they are choosing a house, and every conventional portal inverts
 * that by opening on a postcode search.
 */
export function DestinationsHome() {
  const destinations = useDestinations();
  const breaks = useBreaks();

  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <p className="text-xs uppercase tracking-[0.2em] text-ocean-700">
          Second homes on the world&rsquo;s best waves
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-light leading-[1.1] tracking-tight text-ink-900 sm:text-6xl">
          Property, chosen by the water.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-700">
          Start with the island and the season, not the postcode. Every listing carries the
          breaks within reach, when they work, and exactly what a foreign buyer is able to
          own there.
        </p>
      </section>

      <section aria-labelledby="destinations-heading" className="mx-auto max-w-6xl px-6 pb-24">
        <h2
          id="destinations-heading"
          className="border-t border-sand-200 pt-8 text-xs uppercase tracking-[0.2em] text-ink-700"
        >
          Three destinations
        </h2>

        {destinations.isPending || breaks.isPending ? (
          <p className="mt-8 text-sm text-ink-700">Loading destinations…</p>
        ) : null}

        {destinations.isError ? (
          <p className="mt-8 text-sm text-ink-900">
            Destinations are unavailable right now. Please try again.
          </p>
        ) : null}

        {destinations.data && breaks.data ? (
          <ul className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.data.map((destination) => (
              <li key={destination.id}>
                <DestinationCard
                  destination={destination}
                  breaks={breaks.data.filter((b) => b.destinationId === destination.id)}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

function DestinationCard({
  destination,
  breaks,
}: {
  destination: Destination;
  breaks: readonly SurfBreak[];
}) {
  // The season shown is the destination's, not any one break's: somewhere on Bali works
  // every month of the year, which is exactly the point worth making on a card.
  const bands = buildOverlay(destination, breaks);
  const season = describeMonthRange(peakSurfMonths(bands).map((band) => band.month));
  const consistency = destinationSeasonality(breaks);
  const yearRound = [...(consistency as unknown as number[])].every((score) => score >= 7);

  return (
    <article className="group">
      <Link
        to={`/destinations/${destination.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
      >
        <div className="aspect-[3/4] overflow-hidden rounded-sm bg-sand-200">
          <img
            src={destination.heroImage.src}
            alt={destination.heroImage.alt}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        </div>

        <h3 className="mt-5 text-2xl font-light text-ink-900 group-hover:text-ocean-700">
          {destination.name}
        </h3>
        <p className="mt-1 text-sm text-ink-700">{destination.country}</p>
        <p className="mt-3 text-base leading-relaxed text-ink-900">{destination.tagline}</p>

        <dl className="mt-5 space-y-1.5 border-t border-sand-200 pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-700">Surf season</dt>
            <dd className="text-ink-900">{yearRound ? 'Year-round' : season}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-700">Suits</dt>
            <dd className="text-ink-900">
              {destination.skillRange.map((level) => formatSkill(level)).join(', ')}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-700">Access</dt>
            <dd className="text-ink-900">{formatAccess(destination.access)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-700">Guide price</dt>
            <dd className="text-ink-900">
              {formatPriceRange(destination.priceRange.minUsd, destination.priceRange.maxUsd)}
            </dd>
          </div>
        </dl>
      </Link>
    </article>
  );
}
