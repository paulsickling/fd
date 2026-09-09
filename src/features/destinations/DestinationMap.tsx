import { useId, type JSX } from 'react';
import { Link } from 'react-router-dom';
import type { BreakDirection, Destination, Property, SurfBreak } from '@/domain/types';

/**
 * Stylised destination map (SPEC.md CAP-9).
 *
 * This is an *illustrative* canvas, not cartography. Positions come from `mapPoint`,
 * which is unitless 0-1 within the canvas and deliberately not latitude/longitude, so
 * nothing here may compute or imply a distance: travel times between a property and a
 * break are seeded edge data and are rendered elsewhere. The backdrop is intentionally
 * abstract — a soft island field rather than a real coastline — precisely so the drawing
 * cannot be read as geographic precision it does not have.
 *
 * Inline SVG only: no mapping library, no tiles, no network, no data imports.
 */

/** Canvas width in user units. Height follows `destination.mapAspect` (width / height). */
const CANVAS_WIDTH = 1000;

/** Keeps a marker and its label inside the canvas even if seed data sits hard on 0 or 1. */
const EDGE_INSET = 0.05;

const DIRECTION_LABEL: Record<BreakDirection, string> = {
  left: 'left-hand',
  right: 'right-hand',
  both: 'left and right-hand',
};

function clampFraction(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1 - EDGE_INSET, Math.max(EDGE_INSET, value));
}

/** "Uluwatu, left-hand reef break" — the marker's accessible name. */
function breakDescription(surfBreak: SurfBreak): string {
  return `${surfBreak.name}, ${DIRECTION_LABEL[surfBreak.direction]} ${surfBreak.type} break`;
}

/** "Cliff House, Bingin, 3-bedroom villa" — the marker's accessible name. */
function propertyDescription(property: Property): string {
  if (property.type === 'land') return `${property.title}, land parcel`;
  return `${property.title}, ${property.bedrooms}-bedroom ${property.type}`;
}

/** Listing titles read "Name, Locality"; the map only has room for the name. */
function shortLabel(title: string): string {
  const head = title.split(',')[0];
  return head === undefined || head.trim() === '' ? title : head.trim();
}

export function DestinationMap({
  destination,
  breaks,
  properties,
  highlightPropertyId,
}: {
  destination: Destination;
  breaks: readonly SurfBreak[];
  properties: readonly Property[];
  highlightPropertyId?: string;
}): JSX.Element {
  const titleId = useId();
  const aspect =
    Number.isFinite(destination.mapAspect) && destination.mapAspect > 0 ? destination.mapAspect : 1;
  const width = CANVAS_WIDTH;
  const height = Number((CANVAS_WIDTH / aspect).toFixed(1));
  const fx = (fraction: number): number => Number((fraction * width).toFixed(1));
  const fy = (fraction: number): number => Number((fraction * height).toFixed(1));

  const hasHighlight =
    highlightPropertyId !== undefined &&
    properties.some((property) => property.id === highlightPropertyId);

  /** Soft organic island. Written in fractions so it holds its shape at any mapAspect. */
  const island = [
    `M ${fx(0.5)} ${fy(0.06)}`,
    `C ${fx(0.72)} ${fy(0.05)} ${fx(0.95)} ${fy(0.2)} ${fx(0.94)} ${fy(0.44)}`,
    `C ${fx(0.93)} ${fy(0.68)} ${fx(0.78)} ${fy(0.94)} ${fx(0.54)} ${fy(0.95)}`,
    `C ${fx(0.3)} ${fy(0.96)} ${fx(0.06)} ${fy(0.8)} ${fx(0.06)} ${fy(0.52)}`,
    `C ${fx(0.06)} ${fy(0.26)} ${fx(0.28)} ${fy(0.07)} ${fx(0.5)} ${fy(0.06)}`,
    'Z',
  ].join(' ');

  /** An inset line reads as high ground without asserting any particular terrain. */
  const ridge = [
    `M ${fx(0.22)} ${fy(0.6)}`,
    `C ${fx(0.34)} ${fy(0.4)} ${fx(0.56)} ${fy(0.34)} ${fx(0.72)} ${fy(0.44)}`,
    `C ${fx(0.82)} ${fy(0.51)} ${fx(0.84)} ${fy(0.66)} ${fx(0.76)} ${fy(0.76)}`,
  ].join(' ');

  /** Swell lines in the water margin, outside the island edge. */
  const swells = [
    `M ${fx(0.012)} ${fy(0.24)} Q ${fx(0.05)} ${fy(0.44)} ${fx(0.015)} ${fy(0.66)}`,
    `M ${fx(0.06)} ${fy(0.12)} Q ${fx(0.16)} ${fy(0.03)} ${fx(0.32)} ${fy(0.015)}`,
    `M ${fx(0.99)} ${fy(0.32)} Q ${fx(0.95)} ${fy(0.52)} ${fx(0.985)} ${fy(0.74)}`,
    `M ${fx(0.62)} ${fy(0.985)} Q ${fx(0.8)} ${fy(0.97)} ${fx(0.93)} ${fy(0.88)}`,
  ];

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-labelledby={titleId}
        className="block h-auto w-full rounded-2xl bg-sand-50"
        data-testid="destination-map"
      >
        <title id={titleId}>
          {`Stylised map of ${destination.name}: ${breaks.length} surf ${
            breaks.length === 1 ? 'break' : 'breaks'
          } and ${properties.length} ${
            properties.length === 1 ? 'property' : 'properties'
          }, shown in indicative positions only.`}
        </title>

        {/* Decorative backdrop: land and water suggested, never a real coastline. */}
        <g aria-hidden="true">
          <rect x={0} y={0} width={width} height={height} className="fill-ocean-500/8" />
          {swells.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              className="stroke-ocean-500/40"
            />
          ))}
          <path d={island} className="fill-sand-100" />
          <path
            d={island}
            fill="none"
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
            className="stroke-ocean-500/50"
          />
          <path
            d={ridge}
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="stroke-sand-200"
          />
        </g>

        {/* Surf breaks: round water markers. */}
        <g>
          {breaks.map((surfBreak) => {
            const cx = fx(clampFraction(surfBreak.mapPoint.x));
            const cy = fy(clampFraction(surfBreak.mapPoint.y));
            const flip = surfBreak.mapPoint.x > 0.72;
            return (
              <Link
                key={surfBreak.id}
                to={`/breaks/${surfBreak.id}`}
                aria-label={breakDescription(surfBreak)}
                data-marker="break"
                data-marker-id={surfBreak.id}
                tabIndex={0}
                className={`group outline-none transition-opacity ${
                  hasHighlight ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <title>{breakDescription(surfBreak)}</title>
                <g transform={`translate(${cx} ${cy})`}>
                  <circle
                    r={34}
                    fill="none"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    className="stroke-ocean-700 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-100"
                  />
                  <circle r={26} className="fill-ocean-500/15" />
                  <circle
                    r={15}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    className="fill-sand-50 stroke-ocean-700"
                  />
                  <path
                    d="M -8 -3 q 4 -5 8 0 t 8 0"
                    fill="none"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    className="stroke-ocean-700"
                  />
                  <path
                    d="M -8 5 q 4 -5 8 0 t 8 0"
                    fill="none"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    className="stroke-ocean-700"
                  />
                  <text
                    x={flip ? -26 : 26}
                    y={6}
                    textAnchor={flip ? 'end' : 'start'}
                    className="fill-ocean-700 stroke-sand-50 [font-size:32px] [paint-order:stroke] [stroke-width:5px] sm:[font-size:23px]"
                  >
                    {surfBreak.name}
                  </text>
                </g>
              </Link>
            );
          })}
        </g>

        {/* Properties: building pins. */}
        <g>
          {properties.map((property) => {
            const cx = fx(clampFraction(property.mapPoint.x));
            const cy = fy(clampFraction(property.mapPoint.y));
            const flip = property.mapPoint.x > 0.72;
            const isHighlighted = property.id === highlightPropertyId;
            const description = propertyDescription(property);
            const label = isHighlighted ? `${description} — highlighted` : description;
            return (
              <Link
                key={property.id}
                to={`/properties/${property.id}`}
                aria-label={label}
                data-marker="property"
                data-marker-id={property.id}
                data-highlighted={isHighlighted ? 'true' : 'false'}
                tabIndex={0}
                className={`group outline-none transition-opacity ${
                  hasHighlight && !isHighlighted ? 'opacity-35' : 'opacity-100'
                }`}
              >
                <title>{label}</title>
                <g transform={`translate(${cx} ${cy}) scale(${isHighlighted ? 1.3 : 1})`}>
                  <circle
                    cy={-24}
                    r={34}
                    fill="none"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    className="stroke-ocean-700 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-100"
                  />
                  {isHighlighted ? (
                    <circle
                      cy={-24}
                      r={30}
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      className="fill-ocean-500/15 stroke-ocean-700"
                    />
                  ) : null}
                  <path
                    d="M 0 4 C -10 -8 -17 -15 -17 -24 A 17 17 0 1 1 17 -24 C 17 -15 10 -8 0 4 Z"
                    strokeWidth={isHighlighted ? 2.25 : 1.5}
                    vectorEffect="non-scaling-stroke"
                    className={
                      isHighlighted ? 'fill-sand-50 stroke-ocean-700' : 'fill-sand-50 stroke-ink-900'
                    }
                  />
                  <path
                    d="M -7 -23 L 0 -30 L 7 -23 M -5 -23 L -5 -15 L 5 -15 L 5 -23"
                    fill="none"
                    strokeWidth={1.25}
                    vectorEffect="non-scaling-stroke"
                    className={isHighlighted ? 'stroke-ocean-700' : 'stroke-ink-700'}
                  />
                  <text
                    x={flip ? -24 : 24}
                    y={-18}
                    textAnchor={flip ? 'end' : 'start'}
                    className={`stroke-sand-50 [paint-order:stroke] [stroke-width:5px] ${
                      isHighlighted
                        ? 'fill-ink-900 font-medium [font-size:32px] sm:[font-size:24px]'
                        : 'fill-ink-700 [font-size:30px] sm:[font-size:22px]'
                    }`}
                  >
                    {shortLabel(property.title)}
                  </text>
                </g>
              </Link>
            );
          })}
        </g>
      </svg>

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-700">
        <span className="flex items-center gap-2">
          <svg viewBox="-20 -20 40 40" className="h-4 w-4 shrink-0" aria-hidden="true">
            <circle r={15} strokeWidth={1.5} className="fill-sand-50 stroke-ocean-700" />
            <path
              d="M -8 -3 q 4 -5 8 0 t 8 0"
              fill="none"
              strokeWidth={1.5}
              className="stroke-ocean-700"
            />
            <path
              d="M -8 5 q 4 -5 8 0 t 8 0"
              fill="none"
              strokeWidth={1.5}
              className="stroke-ocean-700"
            />
          </svg>
          Round marker — surf break
        </span>
        <span className="flex items-center gap-2">
          <svg viewBox="-22 -34 44 44" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path
              d="M 0 4 C -10 -8 -17 -15 -17 -24 A 17 17 0 1 1 17 -24 C 17 -15 10 -8 0 4 Z"
              strokeWidth={1.5}
              className="fill-sand-50 stroke-ink-900"
            />
            <path
              d="M -7 -23 L 0 -30 L 7 -23 M -5 -23 L -5 -15 L 5 -15 L 5 -23"
              fill="none"
              strokeWidth={1.25}
              className="stroke-ink-700"
            />
          </svg>
          Pin marker — property
        </span>
        <span className="text-ink-700/80">
          Illustrative layout. Positions are indicative and not to scale; travel times come from the
          listing, never from this map.
        </span>
      </figcaption>
    </figure>
  );
}
