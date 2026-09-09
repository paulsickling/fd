import { Link, useParams } from 'react-router-dom';
import {
  useBreaks,
  useDestination,
  useProperties,
  useProperty,
  useTenureRegime,
} from '@/data/queries';
import { DestinationMap } from '@/features/destinations/DestinationMap';
import {
  formatArea,
  formatBreakHeadline,
  formatBreakSummary,
  formatLocalPrice,
  formatSkillRange,
  formatTravel,
  formatUsdExact,
} from '@/domain/format';
import type { ImageRef, NearbyBreak, TenureRegime, TenureTypeDef } from '@/domain/types';

/**
 * The walk that earns a listing its "dawn patrol on foot" treatment (SPEC.md CAP-3):
 * the same threshold `formatBreakHeadline` and `isWalkToBreak` use — a break you can
 * carry a board to before the wind comes up.
 */
const DAWN_PATROL_MAX_WALK_MINUTES = 15;

function isDawnPatrol(edge: NearbyBreak): boolean {
  return edge.travelMode === 'walk' && edge.travelMinutes <= DAWN_PATROL_MAX_WALK_MINUTES;
}

/**
 * A listing (SPEC.md CAP-3): the house at full size, then the surf it sits above, then
 * what a foreign buyer would actually be holding (CAP-8).
 *
 * Every surf fact on this page is read from the break's own atlas record and joined to the
 * listing through the seeded property-to-break edge. Nothing about a wave is authored per
 * listing, so a break cannot read one way here and another way on its own page.
 */
export function PropertyDetailPage() {
  const { propertyId = '' } = useParams();
  const property = useProperty(propertyId);
  const destinationId = property.data?.destinationId ?? '';
  const destination = useDestination(destinationId);
  const breaks = useBreaks(destinationId);
  const neighbours = useProperties({ destinationId });
  const regime = useTenureRegime(destination.data?.countryCode ?? '');

  if (property.isPending) {
    return <PageMessage>Loading listing…</PageMessage>;
  }
  if (property.isError || !property.data) {
    return (
      <PageMessage>
        We don&rsquo;t have a listing by that reference.{' '}
        <Link to="/" className="text-ocean-700 underline">
          Back to destinations
        </Link>
      </PageMessage>
    );
  }

  const listing = property.data;
  const place = destination.data ?? null;
  const hero = listing.images[0];
  const gallery = listing.images.slice(1);

  const breakHeadline = formatBreakHeadline(listing);
  const walkable = listing.nearbyBreaks.some(isDawnPatrol);

  // The join: the seeded travel edge belongs to the listing, every surf characteristic
  // comes from the atlas record for that break.
  const breaksById = new Map((breaks.data ?? []).map((surfBreak) => [surfBreak.id, surfBreak]));
  const nearby = [...listing.nearbyBreaks]
    .sort((a, b) => a.travelMinutes - b.travelMinutes)
    .flatMap((edge) => {
      const surfBreak = breaksById.get(edge.breakId);
      return surfBreak ? [{ edge, surfBreak }] : [];
    });

  const tenureType = regime.data?.types.find((type) => type.id === listing.tenure) ?? null;

  return (
    <main>
      <section className="relative">
        <div className="aspect-[4/3] max-h-[72vh] w-full overflow-hidden bg-sand-200 sm:aspect-[16/9]">
          {hero ? (
            <img src={hero.src} alt={hero.alt} className="h-full w-full object-cover" />
          ) : null}
        </div>
        {listing.seaView ? (
          <span className="absolute left-6 top-6 rounded-sm bg-sand-50/90 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-ink-700">
            Sea view
          </span>
        ) : null}
        {hero ? (
          <p className="mx-auto max-w-6xl px-6 pt-2 text-[11px] text-ink-700">
            <PhotoCredit image={hero} />
          </p>
        ) : null}
      </section>

      {gallery.length > 0 ? (
        <section aria-labelledby="gallery-heading" className="mx-auto max-w-6xl px-6 pt-6">
          <h2 id="gallery-heading" className="sr-only">
            More photographs of {listing.title}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-3">
            {gallery.map((image) => (
              <li key={image.src}>
                <figure className="m-0">
                  <div className="aspect-[4/3] overflow-hidden rounded-sm bg-sand-200">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <figcaption className="pt-2 text-[11px] text-ink-700">
                    <PhotoCredit image={image} />
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <p className="text-xs uppercase tracking-[0.2em] text-ocean-700">
          {place ? (
            <>
              <Link to={`/destinations/${place.id}`} className="hover:text-ink-900">
                {place.name}
              </Link>
              <span aria-hidden="true"> · </span>
            </>
          ) : null}
          {listing.locality}
        </p>
        <h1 className="mt-3 text-4xl font-light tracking-tight text-ink-900 sm:text-5xl">
          {listing.title}
        </h1>

        <p className="mt-6 text-2xl font-light text-ink-900">{formatUsdExact(listing.priceUsd)}</p>
        <p className="mt-1 text-sm text-ink-700">
          {formatLocalPrice(listing.priceLocal.amount, listing.priceLocal.currency)} at
          today&rsquo;s rate
        </p>

        <p className="mt-8 max-w-2xl leading-relaxed text-ink-900">{listing.description}</p>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-sand-200 py-6 sm:grid-cols-4">
          <Stat label="Bedrooms" value={String(listing.bedrooms)} />
          <Stat label="Bathrooms" value={String(listing.bathrooms)} />
          <Stat label="Land" value={formatArea(listing.landSqm)} />
          <Stat label="Built" value={formatArea(listing.builtSqm)} />
        </dl>
      </section>

      <section aria-labelledby="surf-heading" className="mx-auto max-w-6xl px-6 pt-14">
        <h2 id="surf-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
          The surf from this door
        </h2>

        {breakHeadline ? (
          <p className={`mt-4 text-2xl font-light ${walkable ? 'text-ocean-700' : 'text-ink-900'}`}>
            {breakHeadline}
          </p>
        ) : (
          <p className="mt-4 text-ink-700">
            No break is close enough to this listing to claim one.
          </p>
        )}

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-700">
          Travel times are surveyed door to sand for this property. Everything else below — the
          shape of the wave, and who it suits — is the break&rsquo;s own record, identical
          wherever it appears on this site.
        </p>

        {nearby.length > 0 ? (
          <ul className="mt-6 divide-y divide-sand-200 border-y border-sand-200">
            {nearby.map(({ edge, surfBreak }) => (
              <li key={surfBreak.id}>
                <Link
                  to={`/breaks/${surfBreak.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-5 hover:text-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
                >
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <span className="text-lg font-light text-ink-900">{surfBreak.name}</span>
                    <span
                      className={
                        isDawnPatrol(edge) ? 'text-sm text-ocean-700' : 'text-sm text-ink-700'
                      }
                    >
                      {formatTravel(edge)}
                    </span>
                    {isDawnPatrol(edge) ? (
                      <span className="rounded-sm bg-ocean-500/15 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-ocean-700">
                        Dawn patrol on foot
                      </span>
                    ) : null}
                  </span>
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

      {place && breaks.data && neighbours.data && neighbours.data.length > 0 ? (
        <section aria-labelledby="map-heading" className="mx-auto max-w-6xl px-6 pt-14">
          <h2 id="map-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
            Where it sits
          </h2>
          <div className="mt-6">
            <DestinationMap
              destination={place}
              breaks={breaks.data}
              properties={neighbours.data}
              highlightPropertyId={listing.id}
            />
          </div>
        </section>
      ) : null}

      {regime.data && tenureType ? (
        <TenurePanel
          regime={regime.data}
          type={tenureType}
          years={listing.tenureYears ?? tenureType.typicalYears}
        />
      ) : null}

      {listing.features.length > 0 ? (
        <section aria-labelledby="features-heading" className="mx-auto max-w-6xl px-6 pt-14">
          <h2 id="features-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
            The house
          </h2>
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {listing.features.map((feature) => (
              <li key={feature} className="border-t border-sand-200 pt-3 text-sm text-ink-900">
                {feature}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-16">
        {place ? (
          <Link to={`/destinations/${place.id}`} className="text-sm text-ocean-700 underline">
            Back to property in {place.name}
          </Link>
        ) : (
          <Link to="/" className="text-sm text-ocean-700 underline">
            Back to destinations
          </Link>
        )}
      </section>
    </main>
  );
}

/**
 * What this buyer would actually be holding (SPEC.md CAP-8).
 *
 * Stated at the weight the decision deserves: the plain-English reading and the honest
 * caveat are body copy on the page, not a disclaimer under the fold.
 */
function TenurePanel({
  regime,
  type,
  years,
}: {
  regime: TenureRegime;
  type: TenureTypeDef;
  years: number | null;
}) {
  return (
    <section aria-labelledby="tenure-heading" className="mx-auto max-w-6xl px-6 pt-14">
      <h2 id="tenure-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
        What you would own in {regime.country}
      </h2>
      <div className="mt-6 border-t border-sand-200 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 className="text-2xl font-light text-ink-900">{type.label}</h3>
          <span className="text-sm text-ink-700">
            {years === null ? 'Perpetual' : `${years} years`}
          </span>
        </div>
        <p className="mt-5 max-w-3xl leading-relaxed text-ink-700">{type.plainEnglish}</p>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink-900">{type.riskNote}</p>
      </div>
    </section>
  );
}

/** The licence on every photograph requires the credit to travel with the image. */
function PhotoCredit({ image }: { image: ImageRef }) {
  return (
    <>
      Photograph:{' '}
      <a href={image.creditUrl} className="underline hover:text-ocean-700">
        {image.credit}
      </a>
    </>
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
