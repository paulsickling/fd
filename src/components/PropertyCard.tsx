import { Link } from 'react-router-dom';
import type { Property } from '@/domain/types';
import { formatBreakHeadline, formatUsd } from '@/domain/format';

/**
 * The listing card.
 *
 * Two deliberate departures from a conventional portal card, both from SPEC.md:
 *  - the surf headline sits alongside bed/bath rather than beneath it (CAP-3), because
 *    break proximity is what this buyer is actually shopping for;
 *  - tenure is on the card, not buried in a detail tab (CAP-8), because for a foreign
 *    buyer it is the term that decides whether the purchase is possible at all.
 */
export function PropertyCard({
  property,
  tenureLabel,
}: {
  property: Property;
  /** Resolved by the caller from the country's tenure regime. */
  tenureLabel?: string;
}) {
  const hero = property.images[0];
  const breakHeadline = formatBreakHeadline(property);

  return (
    <article className="group">
      <Link
        to={`/properties/${property.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-sand-200">
          {hero ? (
            <img
              src={hero.src}
              alt={hero.alt}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          ) : null}
          {property.seaView ? (
            <span className="absolute left-3 top-3 rounded-sm bg-sand-50/90 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-ink-700">
              Sea view
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-700">
            {property.locality}
          </p>
          <h3 className="mt-1 text-lg font-light leading-snug text-ink-900 group-hover:text-ocean-700">
            {property.title}
          </h3>
          <p className="mt-2 text-base text-ink-900">{formatUsd(property.priceUsd)}</p>

          {breakHeadline ? (
            <p className="mt-2 text-sm text-ocean-700">{breakHeadline}</p>
          ) : null}

          <p className="mt-2 text-sm text-ink-700">
            {property.bedrooms} bed · {property.bathrooms} bath · {property.builtSqm} m²
          </p>

          {tenureLabel ? (
            <p className="mt-1 text-xs text-ink-700">{tenureLabel}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
