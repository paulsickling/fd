/**
 * The twelve-month seasonality overlay (SPEC.md CAP-5) — the product's signature graphic.
 *
 * Three signals share one axis so the buyer can read the trade-off no single chart shows:
 * the waves are best in July, but so is everyone else. Surf consistency is the dominant
 * mark; weather and crowd sit beneath it as slim tracks. The recommendation the whole
 * thing exists to make — the sweet spot — is stated in words as well as marks.
 *
 * All maths lives in src/domain/seasonality.ts. This file only draws.
 * Inline SVG, no charting dependency. All data arrives via props (SPEC.md CAP-7).
 */

import { useId } from 'react';
import type { JSX } from 'react';
import type { MonthBand } from '../../domain/seasonality';
import {
  buildOverlay,
  describeMonthRange,
  peakSurfMonths,
  sweetSpotMonths,
} from '../../domain/seasonality';
import type { Destination, SurfBreak } from '../../domain/types';

/*
 * Drawing geometry, in viewBox units. The viewBox is 360 wide so that at the narrowest
 * supported viewport (360px) one unit is one CSS pixel — a 9-unit month label renders as a
 * 9px label, not an unreadable 5px one. Wider viewports scale the whole thing up crisply.
 */
const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 152;
const MARGIN_X = 6;
const CHART_WIDTH = VIEW_WIDTH - MARGIN_X * 2;
const COLUMN = CHART_WIDTH / 12;
const BAR_WIDTH = 13;
const TRACK_WIDTH = 17;
const BASELINE_Y = 104;
const MAX_BAR_HEIGHT = 76;
const MARKER_Y = 12;
const WEATHER_Y = 112;
const CROWD_Y = 122;
const TRACK_HEIGHT = 5;
const LABEL_Y = 142;
const HIGHLIGHT_TOP = 4;
const HIGHLIGHT_BOTTOM = 130;

function columnCenter(index: number): number {
  return MARGIN_X + COLUMN * index + COLUMN / 2;
}

function monthsOf(bands: readonly MonthBand[]): readonly number[] {
  return bands.map((band) => band.month);
}

/**
 * The season in a sentence. This is the SVG's accessible name, so a screen-reader user
 * reaches the same conclusion a sighted reader takes from the shape of the bars.
 */
function seasonSentence(
  destination: Destination,
  bands: readonly MonthBand[],
  sweet: readonly MonthBand[],
  peak: readonly MonthBand[],
): string {
  const fair = bands.filter((band) => band.goodWeather);
  const busy = bands.filter((band) => band.busy);

  const clauses = [
    peak.length > 0
      ? `surf peaks ${describeMonthRange(monthsOf(peak))}`
      : 'no month reaches peak surf',
    fair.length > 0
      ? `good weather ${describeMonthRange(monthsOf(fair))}`
      : 'no settled weather season',
    busy.length > 0
      ? `crowds peak ${describeMonthRange(monthsOf(busy))}`
      : 'no pronounced crowd peak',
    sweet.length > 0
      ? `the sweet spot is ${describeMonthRange(monthsOf(sweet))}`
      : 'every strong month is also the crowd peak',
  ];

  return `${destination.name}: twelve-month surf, weather and crowd overlay — ${clauses.join('; ')}.`;
}

function monthSentence(band: MonthBand, isSweet: boolean): string {
  const weather = band.goodWeather ? 'good weather' : 'unsettled weather';
  const crowd = band.busy ? 'crowd peak' : 'quieter';
  const sweet = isSweet ? ', sweet spot' : '';
  return `${band.label}: surf ${band.surf} out of 10, ${weather}, ${crowd}${sweet}.`;
}

export function SeasonalityOverlay({
  destination,
  breaks,
}: {
  destination: Destination;
  breaks: readonly SurfBreak[];
}): JSX.Element {
  const titleId = useId();
  const hatchId = useId();

  const bands = buildOverlay(destination, breaks);
  const sweet = sweetSpotMonths(bands);
  const peak = peakSurfMonths(bands);
  const sweetMonths = new Set(monthsOf(sweet));

  const sweetRange = describeMonthRange(monthsOf(sweet));
  const peakRange = describeMonthRange(monthsOf(peak));
  const sentence = seasonSentence(destination, bands, sweet, peak);

  return (
    <figure className="my-10 w-full">
      <figcaption className="mb-5">
        <p className="text-xs uppercase tracking-[0.18em] text-ocean-700">The year in the water</p>
        <p className="mt-2 max-w-prose text-base font-light leading-relaxed text-ink-900">
          {peak.length > 0 ? (
            <>Surf runs <span className="font-medium">{peakRange}</span>. </>
          ) : (
            <>No month here reaches a peak swell window. </>
          )}
          {sweet.length > 0 ? (
            <>
              The sweet spot — good waves and good weather, before the crowd arrives — is{' '}
              <span className="font-medium">{sweetRange}</span>.
            </>
          ) : (
            <>Every strong month here is also the crowd peak, so there is no quiet window.</>
          )}
        </p>
      </figcaption>

      <svg
        role="img"
        aria-labelledby={titleId}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        data-testid="seasonality-overlay"
      >
        <title id={titleId}>{sentence}</title>

        <defs>
          {/*
            Crowd months are hatched rather than merely tinted, so the crowd row stays
            distinguishable from the weather row without relying on colour.
          */}
          <pattern
            id={hatchId}
            width="3"
            height="3"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="3" className="stroke-ink-700" strokeWidth="1.4" />
          </pattern>
        </defs>

        {/* Sweet-spot columns are washed in warm sand behind everything else. */}
        {bands.map((band, index) =>
          sweetMonths.has(band.month) ? (
            <rect
              key={`highlight-${band.month}`}
              x={columnCenter(index) - COLUMN / 2 + 2}
              y={HIGHLIGHT_TOP}
              width={COLUMN - 4}
              height={HIGHLIGHT_BOTTOM - HIGHLIGHT_TOP}
              rx="4"
              className="fill-sand-100"
            />
          ) : null,
        )}

        <line
          x1={MARGIN_X}
          y1={BASELINE_Y}
          x2={VIEW_WIDTH - MARGIN_X}
          y2={BASELINE_Y}
          className="stroke-sand-200"
          strokeWidth="0.75"
        />

        {bands.map((band, index) => {
          const isSweet = sweetMonths.has(band.month);
          const center = columnCenter(index);
          // A flat month still gets a hairline, so the axis reads as twelve columns.
          const barHeight = Math.max((band.surf / 10) * MAX_BAR_HEIGHT, 1.2);

          return (
            <g
              key={band.month}
              data-month={band.label}
              data-surf={band.surf}
              data-good-weather={band.goodWeather ? 'true' : 'false'}
              data-busy={band.busy ? 'true' : 'false'}
              data-sweet-spot={isSweet ? 'true' : 'false'}
            >
              {/* Non-colour carrier for the recommendation: a marker dot above the column. */}
              {isSweet ? (
                <circle
                  cx={center}
                  cy={MARKER_Y}
                  r="2.6"
                  className="fill-ocean-700"
                  data-testid="sweet-spot-marker"
                />
              ) : null}

              {/* Surf consistency — the dominant signal. */}
              <rect
                x={center - BAR_WIDTH / 2}
                y={BASELINE_Y - barHeight}
                width={BAR_WIDTH}
                height={barHeight}
                rx="2"
                className={isSweet ? 'fill-ocean-700' : 'fill-ocean-500'}
                opacity={isSweet ? 1 : 0.45}
              />

              {/* Weather: a slim solid band when the month is settled. */}
              <rect
                x={center - TRACK_WIDTH / 2}
                y={WEATHER_Y}
                width={TRACK_WIDTH}
                height={TRACK_HEIGHT}
                rx="2.5"
                className={band.goodWeather ? 'fill-ocean-500' : 'fill-sand-200'}
                opacity="0.7"
              />

              {/* Crowd: a hatched band when the month is the crowd peak. */}
              <rect
                x={center - TRACK_WIDTH / 2}
                y={CROWD_Y}
                width={TRACK_WIDTH}
                height={TRACK_HEIGHT}
                rx="2.5"
                fill={band.busy ? `url(#${hatchId})` : undefined}
                className={band.busy ? undefined : 'fill-sand-200'}
                opacity="0.7"
              />

              <text
                x={center}
                y={LABEL_Y}
                textAnchor="middle"
                fontSize="9"
                fontWeight={isSweet ? 600 : 400}
                className={isSweet ? 'fill-ink-900' : 'fill-ink-700'}
              >
                {band.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* The same twelve readings in words, for anyone who cannot see the marks. */}
      <ul className="sr-only">
        {bands.map((band) => (
          <li key={band.month}>{monthSentence(band, sweetMonths.has(band.month))}</li>
        ))}
      </ul>

      <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-light text-ink-700">
        <li className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
            <rect x="4" y="1" width="4" height="10" rx="1" className="fill-ocean-500" opacity="0.45" />
          </svg>
          Surf consistency
        </li>
        <li className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
            <rect x="0" y="4.5" width="12" height="3.5" rx="1.75" className="fill-ocean-500" opacity="0.7" />
          </svg>
          Good weather
        </li>
        <li className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
            <rect x="0" y="4.5" width="12" height="3.5" rx="1.75" fill={`url(#${hatchId})`} opacity="0.7" />
          </svg>
          Crowd peak
        </li>
        <li className="flex items-center gap-2 text-ink-900">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
            <circle cx="6" cy="6" r="2.6" className="fill-ocean-700" />
          </svg>
          Sweet spot — dotted above the month
        </li>
      </ul>
    </figure>
  );
}
