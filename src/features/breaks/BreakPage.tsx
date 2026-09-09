import { useId } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useBreak,
  useDestination,
  usePropertiesNearBreak,
  useTenureRegime,
} from '@/data/queries';
import { PropertyCard } from '@/components/PropertyCard';
import {
  formatBreakSummary,
  formatBreakType,
  formatDirection,
  formatSkillRange,
  formatTravel,
  formatUsd,
} from '@/domain/format';
import { MONTH_LABELS, describeMonthRange } from '@/domain/seasonality';
import type { Property, Seasonality, SurfBreak, TenureTypeId, Tide } from '@/domain/types';

const TIDE_LABELS: Record<Tide, string> = {
  low: 'Low tide',
  mid: 'Mid tide',
  high: 'High tide',
  'mid-to-high': 'Mid to high tide',
  any: 'Any tide',
};

/**
 * Crowd, said out loud (SPEC.md CAP-4).
 *
 * An atlas that softens this is worth nothing: the buyer is choosing where to own, and a
 * wave they will never get a set at is a fact about the asset, not a marketing
 * inconvenience. The number is always shown alongside the sentence, so the reading never
 * depends on how the phrase is toned.
 */
const CROWD_LABELS: Record<SurfBreak['crowdFactor'], string> = {
  1: 'Empty. You will often have it to yourself.',
  2: 'Quiet. A handful out, even on a good swell.',
  3: 'Busy. A full line-up on the best tides, though waves still come through.',
  4: 'Crowded. Most sets are contested and you will wait for yours.',
  5: 'A zoo. Whenever it is working the line-up is full and competitive.',
};

/** Peak months score 8+; a wave is worth travelling for in those, and surfable from 5. */
const PEAK_SCORE = 8;
const SURFABLE_SCORE = 5;

function monthsAtLeast(seasonality: Seasonality, minimum: number): readonly number[] {
  return seasonality.flatMap((score, index) => (score >= minimum ? [index + 1] : []));
}

/**
 * A break page (SPEC.md CAP-4): the atlas entry for one wave, and — the half a surf guide
 * never has — the property within reach of it. The reverse edge back to the listings is
 * the point: property to break to property, with no dead end at either end.
 */
export function BreakPage() {
  const { breakId = '' } = useParams();
  const surfBreak = useBreak(breakId);
  const destination = useDestination(surfBreak.data?.destinationId ?? '');
  const nearby = usePropertiesNearBreak(breakId);
  const regime = useTenureRegime(destination.data?.countryCode ?? '');

  if (surfBreak.isPending) {
    return <PageMessage>Loading break…</PageMessage>;
  }
  if (surfBreak.isError || !surfBreak.data) {
    return (
      <PageMessage>
        We don&rsquo;t have a break by that name.{' '}
        <Link to="/" className="text-ocean-700 underline">
          Back to destinations
        </Link>
      </PageMessage>
    );
  }

  const wave = surfBreak.data;
  const place = destination.data;
  const tenureLabels = new Map<TenureTypeId, string>(
    (regime.data?.types ?? []).map((type) => [type.id, type.label]),
  );

  const peakMonths = monthsAtLeast(wave.seasonality, PEAK_SCORE);
  const swellSize = `${wave.optimal.swellSizeFt.min}–${wave.optimal.swellSizeFt.max} ft`;

  return (
    <main>
      <section aria-labelledby="break-heading" className="mx-auto max-w-6xl px-6 pt-14">
        {place ? (
          <p className="text-xs uppercase tracking-[0.2em] text-ocean-700">
            <Link to={`/destinations/${place.id}`} className="hover:text-ink-900">
              {place.name}
            </Link>
          </p>
        ) : null}

        <h1
          id="break-heading"
          className="mt-3 text-4xl font-light tracking-tight text-ink-900 sm:text-5xl"
        >
          {wave.name}
        </h1>

        {wave.aliases.length > 0 ? (
          <p className="mt-3 text-sm text-ink-700">
            {`Also known as ${wave.aliases.join(' / ')}`}
          </p>
        ) : null}

        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-900">
          {`${formatBreakSummary(wave.type, wave.direction)} · ${formatSkillRange(
            wave.skill,
            wave.skillCeiling,
          )}`}
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-700">{wave.notes}</p>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-sand-200 py-6 sm:grid-cols-4">
          <Stat label="Break type" value={formatBreakType(wave.type)} />
          <Stat label="Direction" value={formatDirection(wave.direction)} />
          <Stat label="Skill" value={formatSkillRange(wave.skill, wave.skillCeiling)} />
          <Stat label="Bottom" value={wave.bottom} />
        </dl>
      </section>

      <section aria-labelledby="conditions-heading" className="mx-auto max-w-6xl px-6 pt-14">
        <h2 id="conditions-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
          What it wants
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-6 border-y border-sand-200 py-6 sm:grid-cols-4">
          <Stat label="Swell direction" value={wave.optimal.swellDirection} />
          <Stat label="Swell size" value={swellSize} />
          <Stat label="Wind" value={`${wave.optimal.windDirection} offshore`} />
          <Stat label="Tide" value={TIDE_LABELS[wave.optimal.tide]} />
        </dl>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-700">
          {`Paddle out takes about ${wave.paddleOutMinutes} min.`}
        </p>
      </section>

      <section aria-labelledby="water-heading" className="mx-auto max-w-6xl px-6 pt-14">
        <h2 id="water-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
          What you are paddling into
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-900">
          {`Crowd ${wave.crowdFactor} of 5. ${CROWD_LABELS[wave.crowdFactor]}`}
        </p>

        <h3 className="mt-8 text-sm text-ink-900">Hazards</h3>
        <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-700">
          {wave.hazards.map((hazard) => (
            <li key={hazard}>{hazard}</li>
          ))}
        </ul>
      </section>

      {wave.sections && wave.sections.length > 0 ? (
        <section aria-labelledby="sections-heading" className="mx-auto max-w-6xl px-6 pt-14">
          <h2 id="sections-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
            Section by section
          </h2>
          <ul className="mt-6 divide-y divide-sand-200 border-y border-sand-200">
            {wave.sections.map((section) => (
              <li key={section.name} className="py-4">
                <h3 className="text-lg font-light text-ink-900">{section.name}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-700">
                  {section.notes}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="season-heading" className="mx-auto max-w-6xl px-6 pt-14">
        <h2 id="season-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
          The year at {wave.name}
        </h2>
        <div className="mt-6">
          <BreakSeason surfBreak={wave} />
        </div>
      </section>

      <section aria-labelledby="nearby-heading" className="mx-auto max-w-6xl px-6 py-16">
        <h2 id="nearby-heading" className="text-xs uppercase tracking-[0.2em] text-ink-700">
          Property near {wave.name}
        </h2>

        {nearby.isPending ? <p className="mt-6 text-sm text-ink-700">Loading property…</p> : null}

        {nearby.data?.length === 0 ? (
          <p className="mt-6 max-w-2xl text-sm text-ink-700">
            Nothing listed within reach of this break at the moment.
          </p>
        ) : null}

        {nearby.data && nearby.data.length > 0 ? (
          <>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-700">
              {priceLine(nearby.data)}
            </p>
            <ul className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {nearby.data.map((property) => {
                const edge = property.nearbyBreaks.find((near) => near.breakId === wave.id);
                const tenureLabel = tenureLabels.get(property.tenure);
                return (
                  <li key={property.id}>
                    <PropertyCard property={property} {...(tenureLabel ? { tenureLabel } : {})} />
                    {edge ? (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-700">
                        {`${formatTravel(edge)} to ${wave.name}`}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}

        {place ? (
          <p className="mt-14 border-t border-sand-200 pt-6 text-sm leading-relaxed text-ink-700">
            <Link to={`/destinations/${place.id}`} className="text-ocean-700 underline">
              {`Back to ${place.name}`}
            </Link>
            {peakMonths.length > 0
              ? ` — its other breaks, the season overlay, and what a foreign buyer can own. ${wave.name} peaks ${describeMonthRange(peakMonths)}.`
              : ' — its other breaks, the season overlay, and what a foreign buyer can own.'}
          </p>
        ) : null}
      </section>
    </main>
  );
}

/*
 * Drawing geometry for the season strip, in viewBox units. 360 wide so that at the
 * narrowest supported viewport one unit is one CSS pixel and a 9-unit month label renders
 * legibly rather than at 5px.
 */
const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 116;
const MARGIN_X = 6;
const COLUMN = (VIEW_WIDTH - MARGIN_X * 2) / 12;
const BAR_WIDTH = 16;
const BASELINE_Y = 84;
const MAX_BAR_HEIGHT = 68;
const LABEL_Y = 106;

/**
 * One break's own twelve months, drawn small.
 *
 * Deliberately not the destination overlay: there is no weather or crowd track to align
 * here, only this wave's consistency, so a plain bar strip says it without pretending to
 * more. Inline SVG, no charting dependency (stack.md). Height carries the value, peak
 * months are also weighted in the label, and every reading is repeated in words below —
 * nothing here rests on colour alone.
 */
function BreakSeason({ surfBreak }: { surfBreak: SurfBreak }) {
  const titleId = useId();

  const peakMonths = monthsAtLeast(surfBreak.seasonality, PEAK_SCORE);
  const surfableMonths = monthsAtLeast(surfBreak.seasonality, SURFABLE_SCORE);
  const peak = new Set(peakMonths);

  const sentence =
    `${surfBreak.name}: twelve-month surf consistency, scored 0 to 10. ` +
    `${
      peakMonths.length > 0
        ? `Peaks ${describeMonthRange(peakMonths)}`
        : 'No month reaches peak season'
    }; ` +
    `${
      surfableMonths.length > 0
        ? `worth surfing ${describeMonthRange(surfableMonths)}`
        : 'never reliably surfable'
    }.`;

  return (
    <figure className="w-full">
      <figcaption className="mb-5 max-w-2xl text-base font-light leading-relaxed text-ink-900">
        {peakMonths.length > 0 ? (
          <>
            It fires <span className="font-medium">{describeMonthRange(peakMonths)}</span>, and is
            worth surfing {describeMonthRange(surfableMonths)}.
          </>
        ) : (
          <>No month here reaches a peak swell window.</>
        )}
      </figcaption>

      <svg
        role="img"
        aria-labelledby={titleId}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        data-testid="break-seasonality"
      >
        <title id={titleId}>{sentence}</title>

        <line
          x1={MARGIN_X}
          y1={BASELINE_Y}
          x2={VIEW_WIDTH - MARGIN_X}
          y2={BASELINE_Y}
          className="stroke-sand-200"
          strokeWidth="0.75"
        />

        {surfBreak.seasonality.map((score, index) => {
          const month = index + 1;
          const isPeak = peak.has(month);
          const center = MARGIN_X + COLUMN * index + COLUMN / 2;
          // A flat month still gets a hairline, so the axis reads as twelve columns.
          const barHeight = Math.max((score / 10) * MAX_BAR_HEIGHT, 1.2);

          return (
            <g key={month} data-month={MONTH_LABELS[index]} data-surf={score}>
              <rect
                x={center - BAR_WIDTH / 2}
                y={BASELINE_Y - barHeight}
                width={BAR_WIDTH}
                height={barHeight}
                rx="2"
                className={isPeak ? 'fill-ocean-700' : 'fill-ocean-500'}
                opacity={isPeak ? 1 : 0.45}
              />
              <text
                x={center}
                y={LABEL_Y}
                textAnchor="middle"
                fontSize="9"
                fontWeight={isPeak ? 600 : 400}
                className={isPeak ? 'fill-ink-900' : 'fill-ink-700'}
              >
                {MONTH_LABELS[index]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* The same twelve readings in words, for anyone who cannot see the marks. */}
      <ul className="sr-only">
        {surfBreak.seasonality.map((score, index) => (
          <li key={MONTH_LABELS[index]}>{`${MONTH_LABELS[index]}: surf ${score} out of 10.`}</li>
        ))}
      </ul>
    </figure>
  );
}

/** What is actually on the market within reach of this wave, in one honest line. */
function priceLine(properties: readonly Property[]): string {
  const prices = properties.map((property) => property.priceUsd);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const noun = properties.length === 1 ? 'listing' : 'listings';
  const range = low === high ? formatUsd(low) : `${formatUsd(low)} – ${formatUsd(high)}`;
  return `${properties.length} ${noun} within reach of the break, ${range}. Nearest first.`;
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
